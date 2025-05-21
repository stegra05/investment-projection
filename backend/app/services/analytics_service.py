"""
Service for calculating historical portfolio performance analytics.

This service provides functions to process portfolio data, including assets,
reallocations, and cash flows (contributions/withdrawals), to compute
historical performance metrics like cumulative return over a specified period.
It relies on helper functions from `historical_data_preparation` to fetch and
preprocess the necessary data before performing daily calculations.
"""
from flask import current_app
from app import db
from datetime import date, datetime, timedelta
from decimal import Decimal, InvalidOperation
from typing import Tuple
import json

# Import the extracted data preparation functions
from .historical_data_preparation import (
    fetch_and_process_asset_data,
    fetch_and_process_reallocations,
    get_daily_changes
)

# --- Helper Functions ---

def _calculate_initial_portfolio_state(
    start_date: date, 
    portfolio_creation_date: date, 
    changes_by_date: dict
) -> Tuple[float, float]:
    """Calculates the portfolio's value and net contributions up to the day before `start_date`.

    This function iterates from the portfolio's creation or the analysis `start_date`
    (whichever is earlier) up to the day before the main calculation `start_date`.
    It applies historical contributions and withdrawals to establish the starting
    `current_value` and `net_contributions` for the performance calculation period.

    Args:
        start_date (date): The first day of the performance calculation period.
        portfolio_creation_date (date): The date the portfolio was created.
        changes_by_date (dict): A dictionary mapping dates to lists of financial
                                changes (contributions/withdrawals).

    Returns:
        Tuple[float, float]: A tuple containing:
            - current_value (float): The portfolio's value before `start_date`.
            - net_contributions (float): The sum of all contributions minus withdrawals
                                         before `start_date`.
    """
    current_value = 0.0  # Initialize portfolio value
    net_contributions = 0.0  # Initialize net contributions

    # Determine the actual start for iterating through historical changes.
    # We need to consider changes from portfolio creation up to the analysis start_date.
    # The loop runs up to, but not including, `start_date`.
    iteration_start_date = min(start_date, portfolio_creation_date)
    temp_date = iteration_start_date
    
    while temp_date < start_date:
        # Only process changes if the temp_date is on or after the portfolio was created.
        if temp_date >= portfolio_creation_date:
            daily_changes = changes_by_date.get(temp_date, [])
            for change_event in daily_changes:
                amount = float(change_event["amount"])
                if change_event["type"] == 'Contribution':
                    current_value += amount
                    net_contributions += amount
                elif change_event["type"] == 'Withdrawal':
                    current_value -= amount
                    net_contributions -= amount
        temp_date += timedelta(days=1)
        
    current_app.logger.debug(
        f"Initial state calculated up to {start_date}: "
        f"Current Value = {current_value}, Net Contributions = {net_contributions}"
    )
    return current_value, net_contributions

def _get_current_day_allocations(
    current_calculation_date: date,
    assets_data: dict, # Processed data from fetch_and_process_asset_data
    processed_reallocations: list # Sorted list from fetch_and_process_reallocations
) -> dict:
    """Determines the effective asset allocations for a given calculation date.

    It considers the initial asset allocations and any reallocations that
    occurred on or before the `current_calculation_date`.
    If no explicit allocations are found (e.g., sum is zero but assets exist),
    it distributes allocation equally among active assets. Allocations are normalized
    if they don't sum to 1 (100%).

    Args:
        current_calculation_date (date): The date for which to determine allocations.
        assets_data (dict): A dictionary of processed asset data, including their
                            creation dates and base allocation percentages.
        processed_reallocations (list): A sorted list of reallocation events.

    Returns:
        dict: A dictionary mapping asset_id (int) to its Decimal allocation percentage
              for the `current_calculation_date`.
    """
    current_day_allocations = {}
    
    # Find the most recent reallocation event that is active on current_calculation_date
    active_reallocation = None
    for realloc in processed_reallocations:
        if realloc["change_date"] <= current_calculation_date:
            active_reallocation = realloc
        else:
            # Since reallocations are sorted by date, we can break early
            break 
    
    if active_reallocation:
        # If a reallocation is active, use its allocations
        current_day_allocations = active_reallocation["allocations"].copy()
        current_app.logger.debug(f"Date {current_calculation_date}: Using allocations from reallocation on {active_reallocation['change_date']}")
    else:
        # No active reallocation, use base allocations of assets created by this date
        for asset_id, data in assets_data.items():
            if data["created_at"] <= current_calculation_date: # Asset must exist
                 current_day_allocations[asset_id] = data["base_allocation_percentage"]
        current_app.logger.debug(f"Date {current_calculation_date}: Using base asset allocations.")

    # Calculate the sum of current allocations (ensure only Decimals are summed)
    total_allocation_sum = sum(
        val for val in current_day_allocations.values() if isinstance(val, Decimal)
    )

    # Check if any assets were eligible for allocation on this date.
    # An asset is eligible if it was created on or before the current_calculation_date.
    # This helps distinguish between a genuine zero allocation sum and a scenario where no assets were active.
    assets_eligible_for_allocation = any(
        data["created_at"] <= current_calculation_date for data in assets_data.values()
    )

    # Normalize allocations if they sum to something other than 1 but are positive.
    # This handles cases where initial allocations might not be perfectly 100%.
    if total_allocation_sum > Decimal(0) and total_allocation_sum != Decimal(1):
        current_app.logger.warning(
            f"Date {current_calculation_date}: Allocations sum to {total_allocation_sum}. Normalizing."
        )
        for asset_id in current_day_allocations:
            if isinstance(current_day_allocations[asset_id], Decimal):
                 current_day_allocations[asset_id] /= total_allocation_sum
    # If sum is zero but assets were eligible, distribute allocation equally among active assets.
    elif total_allocation_sum == Decimal(0) and assets_eligible_for_allocation:
        current_app.logger.info(
            f"Date {current_calculation_date}: Allocations sum to 0 with eligible assets. Distributing equally."
        )
        # Filter for assets that are actually active (created on or before current_calculation_date)
        # to determine the count for equal distribution.
        active_assets_for_equal_share = {
            aid: data for aid, data in assets_data.items() 
            if data["created_at"] <= current_calculation_date
        }
        active_assets_count = len(active_assets_for_equal_share)

        if active_assets_count > 0:
            equal_share = Decimal(1) / Decimal(active_assets_count)
            # Reset allocations and distribute equally only to assets active on this day.
            current_day_allocations = {asset_id: equal_share for asset_id in active_assets_for_equal_share}
        else:
            # No assets were active on this day (e.g., portfolio created but assets added later).
            # Allocations remain empty or zero.
            current_app.logger.debug(f"Date {current_calculation_date}: No assets active for equal distribution despite eligibility flag.")
            current_day_allocations = {} # Ensure it's empty if no assets are truly active
            
    return current_day_allocations

def _calculate_portfolio_daily_return_rate(
    current_day_allocations: dict, # Asset_id -> Decimal percentage
    assets_data: dict, # Processed asset data
    current_calculation_date: date
) -> Decimal:
    """Calculates the portfolio's weighted average daily return rate.

    This is based on the allocations for the `current_calculation_date` and
    the `manual_expected_return` for each asset. Assumes returns are compounded daily.

    Args:
        current_day_allocations (dict): Asset allocations for the day.
        assets_data (dict): Processed data for all assets in the portfolio.
        current_calculation_date (date): The date for which to calculate the return.

    Returns:
        Decimal: The calculated daily return rate for the portfolio.
    """
    portfolio_daily_return_rate = Decimal(0)
    for asset_id, allocation_percentage in current_day_allocations.items():
        asset_info = assets_data.get(asset_id)
        
        # Asset must exist, be active, have a defined return, and positive allocation.
        if (asset_info and 
            asset_info["created_at"] <= current_calculation_date and 
            asset_info["manual_expected_return"] is not None and
            isinstance(allocation_percentage, Decimal) and 
            allocation_percentage > Decimal(0)):
            
            asset_annual_return = asset_info["manual_expected_return"] # Assumed to be a percentage, e.g., 7.5 for 7.5%
            # Convert annual return to daily: (1 + AnnualRate)^(1/365) - 1
            # Ensure asset_annual_return is treated as a percentage (e.g., 7.5 becomes 0.075)
            daily_asset_return_rate = (
                (Decimal(1) + asset_annual_return / Decimal(100)) ** (Decimal(1)/Decimal(365))
            ) - Decimal(1)
            
            portfolio_daily_return_rate += daily_asset_return_rate * allocation_percentage
            
    return portfolio_daily_return_rate

def _apply_daily_cash_flows(
    current_calculation_date: date,
    changes_by_date: dict, # Date -> list of change events
    current_value: float,
    net_contributions: float
) -> Tuple[float, float]:
    """Applies cash flows (contributions/withdrawals) for the given date.

    Updates `current_value` and `net_contributions` based on changes occurring
    on `current_calculation_date`. Cash flows are assumed to occur at the end of the day,
    after any growth/loss from returns has been applied.

    Args:
        current_calculation_date (date): The date of the cash flows.
        changes_by_date (dict): All historical changes, keyed by date.
        current_value (float): Portfolio value before cash flows on this date.
        net_contributions (float): Net contributions before cash flows on this date.

    Returns:
        Tuple[float, float]: Updated `current_value` and `net_contributions`.
    """
    daily_changes = changes_by_date.get(current_calculation_date, [])
    if daily_changes:
        current_app.logger.debug(f"Date {current_calculation_date}: Applying {len(daily_changes)} cash flows.")
    for change_event in daily_changes:
        amount = float(change_event["amount"]) # Ensure amount is float for calculations
        if change_event["type"] == 'Contribution':
            current_value += amount
            net_contributions += amount
        elif change_event["type"] == 'Withdrawal':
            current_value -= amount
            net_contributions -= amount
    return current_value, net_contributions

def _apply_daily_growth_and_cash_flow(
    current_calculation_date: date, 
    current_value: float, # Value at start of day, after previous day's cash flows
    net_contributions: float, # Net contributions up to start of day
    assets_data: dict, 
    processed_reallocations: list, 
    changes_by_date: dict,
    portfolio_creation_date: date # Used for context, though sub-functions might not all use it
) -> Tuple[float, float, dict]:
    """Calculates one day's portfolio value change and performance.

    This function encapsulates the logic for a single day:
    1. Determines asset allocations for the day.
    2. Calculates and applies daily growth to `current_value` based on these allocations.
    3. Applies any cash flows (contributions/withdrawals) for the day.
    4. Calculates the cumulative return up to this day.

    Args:
        current_calculation_date (date): The specific day to process.
        current_value (float): Portfolio value at the beginning of the day.
        net_contributions (float): Net contributions accumulated up to the beginning of the day.
        assets_data (dict): Processed asset data.
        processed_reallocations (list): Sorted list of reallocation events.
        changes_by_date (dict): Cash flow events, keyed by date.
        portfolio_creation_date (date): The portfolio's creation date.

    Returns:
        Tuple[float, float, dict]:
            - Updated `current_value` at the end of the day.
            - Updated `net_contributions` at the end of the day.
            - A dictionary with the date and calculated `cumulative_return`.
    """
    current_app.logger.debug(f"Processing daily growth/cash flow for {current_calculation_date}. Start of day value: {current_value:.2f}")
    
    # 1. Determine current day's asset allocations
    current_day_allocations = _get_current_day_allocations(
        current_calculation_date,
        assets_data,
        processed_reallocations
    )
    current_app.logger.debug(f"Date {current_calculation_date}: Allocations determined: {json.dumps({k: str(v) for k, v in current_day_allocations.items()}) if current_day_allocations else 'None'}")

    # 2. Apply daily growth based on these allocations
    # Growth is applied first, assuming it happens on the value before end-of-day cash flows.
    if current_value > 0: # Growth/loss can only occur if there's a positive value.
        portfolio_daily_return_rate = _calculate_portfolio_daily_return_rate(
            current_day_allocations,
            assets_data,
            current_calculation_date
        )
        daily_growth_factor = float(Decimal(1) + portfolio_daily_return_rate)
        current_value *= daily_growth_factor
        current_app.logger.debug(f"Date {current_calculation_date}: Value after growth (factor {daily_growth_factor:.6f}): {current_value:.2f}")
    else:
        current_app.logger.debug(f"Date {current_calculation_date}: No growth applied as current value is {current_value:.2f}.")

    # 3. Apply cash flows (contributions/withdrawals) for the current_calculation_date
    # These are typically considered to occur at the end of the day.
    original_value_before_cashflow = current_value
    current_value, net_contributions = _apply_daily_cash_flows(
        current_calculation_date,
        changes_by_date,
        current_value, # Value after growth
        net_contributions # Net contributions before today's cash flows
    )
    if original_value_before_cashflow != current_value:
        current_app.logger.debug(f"Date {current_calculation_date}: Value after cash flows: {current_value:.2f}. Net contributions updated to: {net_contributions:.2f}")
            
    # 4. Calculate cumulative return for the day based on end-of-day value and net contributions
    cumulative_return = 0.0
    if net_contributions > 0:
        # Standard formula: (End Value - Net Contributions) / Net Contributions
        cumulative_return = (current_value - net_contributions) / net_contributions
    elif current_value > 0 and net_contributions <= 0:
        # If net contributions are zero or negative (more withdrawn than contributed),
        # but there's still positive value (due to high returns), return is effectively infinite or very large.
        # Representing as float('inf') or a large number, or handling as "N/A" might be options.
        # For now, using float('inf') as per previous logic.
         cumulative_return = float('inf') 
    # If current_value is 0 or negative, and net_contributions is 0 or negative, cumulative_return remains 0.0 or could be negative.
    # If current_value is negative (e.g. due to large withdrawal from grown amount), this formula would give negative return.
    
    daily_performance_point = {
        "date": current_calculation_date.isoformat(),
        "cumulative_return": round(cumulative_return, 6) if cumulative_return != float('inf') else "Infinity" # Or handle as needed
    }
    current_app.logger.debug(f"Date {current_calculation_date}: Performance point: {daily_performance_point}")
    
    return current_value, net_contributions, daily_performance_point

# --- Main Function ---

def calculate_historical_performance(
    portfolio, # SQLAlchemy Portfolio model instance
    start_date: date, 
    end_date: date, 
    portfolio_id_for_logging: int # Added for explicit logging context
) -> list:
    """Calculates historical performance data for a given portfolio over a specified period.

    This function orchestrates the entire process:
    1. Fetches and processes asset data, reallocations, and daily cash flows.
    2. Calculates an initial portfolio state (value and net contributions) before the `start_date`.
    3. Iterates daily from `start_date` to `end_date`, applying growth and cash flows.
    4. Records the cumulative return for each day.

    Args:
        portfolio (Portfolio): The SQLAlchemy Portfolio object.
        start_date (date): The start date of the performance calculation period.
        end_date (date): The end date of the performance calculation period.
        portfolio_id_for_logging (int): The portfolio ID, passed explicitly for logging clarity,
                                       though it's also available from the portfolio object.

    Returns:
        list: A list of dictionaries, where each dictionary represents a day's
              performance point, containing "date" (ISO format) and "cumulative_return".
    """
    current_app.logger.info(
        f"Starting historical performance calculation for PortfolioID '{portfolio_id_for_logging}' "
        f"from {start_date.isoformat()} to {end_date.isoformat()}."
    )
    performance_data = [] # Stores daily performance points
    
    # Ensure portfolio_creation_date is a date object for comparisons.
    # The portfolio.created_at might be a datetime object.
    portfolio_creation_date = portfolio.created_at.date() if isinstance(portfolio.created_at, datetime) else portfolio.created_at

    # --- Data Preparation ---
    # Fetch and process all necessary data upfront using helper functions.
    # These functions are assumed to be robust and handle DB interactions.
    assets_data = fetch_and_process_asset_data(portfolio.portfolio_id)
    current_app.logger.debug(f"PortfolioID '{portfolio_id_for_logging}': Fetched and processed {len(assets_data)} assets.")
    
    processed_reallocations = fetch_and_process_reallocations(portfolio.portfolio_id, end_date)
    current_app.logger.debug(f"PortfolioID '{portfolio_id_for_logging}': Fetched and processed {len(processed_reallocations)} reallocations.")
    
    changes_by_date = get_daily_changes(portfolio.portfolio_id, end_date)
    current_app.logger.debug(f"PortfolioID '{portfolio_id_for_logging}': Fetched {sum(len(v) for v in changes_by_date.values())} cash flow events across {len(changes_by_date)} dates.")

    # --- Initial State Calculation ---
    # Calculate portfolio value and net contributions accumulated *before* the `start_date`.
    current_value, net_contributions = _calculate_initial_portfolio_state(
        start_date, 
        portfolio_creation_date, 
        changes_by_date
    )
    
    # --- Daily Calculation Loop ---
    current_calculation_date = start_date
    while current_calculation_date <= end_date:
        # If the calculation date is before the portfolio was created, performance is zero.
        if current_calculation_date < portfolio_creation_date:
            performance_data.append({
                "date": current_calculation_date.isoformat(),
                "cumulative_return": 0.0 # No performance before existence
            })
            current_app.logger.debug(f"PortfolioID '{portfolio_id_for_logging}', Date {current_calculation_date.isoformat()}: Pre-creation, cumulative return 0.0.")
        else:
            # Apply daily growth and cash flows, get performance point
            current_value, net_contributions, daily_performance_point = _apply_daily_growth_and_cash_flow(
                current_calculation_date,
                current_value,
                net_contributions,
                assets_data,
                processed_reallocations,
                changes_by_date,
                portfolio_creation_date 
            )
            performance_data.append(daily_performance_point)
            
        current_calculation_date += timedelta(days=1)
    
    current_app.logger.info(
        f"Finished historical performance calculation for PortfolioID '{portfolio_id_for_logging}'. "
        f"Generated {len(performance_data)} daily data points."
    )
    return performance_data 