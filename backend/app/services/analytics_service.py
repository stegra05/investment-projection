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

def _calculate_initial_portfolio_state(start_date, portfolio_creation_date, changes_by_date):
    """Calculates current_value and net_contributions up to the specified start_date."""
    current_value = 0.0
    net_contributions = 0.0
    
    calculation_loop_start_date = min(start_date, portfolio_creation_date)
    temp_date = calculation_loop_start_date
    
    while temp_date < start_date:
        if temp_date >= portfolio_creation_date:
            if temp_date in changes_by_date:
                for change_event in changes_by_date[temp_date]:
                    if change_event["type"] == 'Contribution':
                        current_value += float(change_event["amount"]) 
                        net_contributions += float(change_event["amount"])
                    elif change_event["type"] == 'Withdrawal':
                        current_value -= float(change_event["amount"])
                        net_contributions -= float(change_event["amount"])
        temp_date += timedelta(days=1)
    return current_value, net_contributions

def _get_current_day_allocations(
    current_calculation_date: date,
    assets_data: dict,
    processed_reallocations: list,
    # portfolio_creation_date: date # This was included in my previous thought but is not used by this specific function after refactor
) -> dict:
    """Determines asset allocations for the current day."""
    current_day_allocations = {}
    active_reallocation = None
    for realloc in processed_reallocations:
        if realloc["change_date"] <= current_calculation_date:
            active_reallocation = realloc
        else:
            break
    
    if active_reallocation:
        current_day_allocations = active_reallocation["allocations"].copy()
    else:
        for asset_id, data in assets_data.items():
            # Asset must exist and be created by the calculation date to be considered for base allocation
            if data["created_at"] <= current_calculation_date:
                 current_day_allocations[asset_id] = data["base_allocation_percentage"]
    
    total_allocation_sum = sum(val for val in current_day_allocations.values() if isinstance(val, Decimal)) # Ensure only Decimals are summed

    # Check if there are any assets that *should* be allocated to
    # (i.e., assets created on or before current_calculation_date)
    # This helps decide if a zero sum is due to no active assets or explicit zero allocations
    assets_eligible_for_allocation = any(
        assets_data[aid]["created_at"] <= current_calculation_date for aid in current_day_allocations
    ) or any( # Also consider assets not yet in current_day_allocations but eligible
        data["created_at"] <= current_calculation_date for aid, data in assets_data.items()
    )


    if total_allocation_sum > 0 and total_allocation_sum != Decimal(1):
        # Normalize if sum is not 1 but greater than 0
        for asset_id in current_day_allocations:
            if isinstance(current_day_allocations[asset_id], Decimal) and total_allocation_sum != Decimal(0): # Avoid division by zero
                 current_day_allocations[asset_id] /= total_allocation_sum
    elif total_allocation_sum == Decimal(0) and assets_eligible_for_allocation:
        # Distribute equally if sum is 0 but there are active assets eligible for allocation
        
        # Count only assets that are active on the current_calculation_date
        active_assets_for_equal_share = {
            aid: data for aid, data in assets_data.items() if data["created_at"] <= current_calculation_date
        }
        active_assets_count = len(active_assets_for_equal_share)

        if active_assets_count > 0:
            equal_share = Decimal(1) / Decimal(active_assets_count)
            # Reset allocations for this case and distribute equally only to active assets
            current_day_allocations = {}
            for asset_id in active_assets_for_equal_share:
                current_day_allocations[asset_id] = equal_share
    return current_day_allocations

def _calculate_portfolio_daily_return_rate(
    current_day_allocations: dict,
    assets_data: dict,
    current_calculation_date: date
) -> Decimal:
    """Calculates the portfolio's daily return rate based on allocations."""
    portfolio_daily_return_rate = Decimal(0)
    for asset_id, allocation_percentage in current_day_allocations.items():
        asset_info = assets_data.get(asset_id)
        # Ensure asset exists, was created by the calculation date, and has a return defined
        if asset_info and asset_info["created_at"] <= current_calculation_date and asset_info["manual_expected_return"] is not None:
            if isinstance(allocation_percentage, Decimal) and allocation_percentage > 0: # Only include assets with positive allocation
                asset_annual_return = asset_info["manual_expected_return"]
                # Daily rate: (1 + AnnualRate)^(1/365) - 1
                daily_asset_return_rate = (Decimal(1) + asset_annual_return / Decimal(100))**(Decimal(1)/Decimal(365)) - Decimal(1)
                portfolio_daily_return_rate += daily_asset_return_rate * allocation_percentage
    return portfolio_daily_return_rate

def _apply_daily_cash_flows(
    current_calculation_date: date,
    changes_by_date: dict,
    current_value: float,
    net_contributions: float
) -> Tuple[float, float]:
    """Applies contributions and withdrawals for the day."""
    if current_calculation_date in changes_by_date:
        for change_event in changes_by_date[current_calculation_date]:
            if change_event["type"] == 'Contribution':
                current_value += float(change_event["amount"])
                net_contributions += float(change_event["amount"])
            elif change_event["type"] == 'Withdrawal':
                current_value -= float(change_event["amount"])
                net_contributions -= float(change_event["amount"])
    return current_value, net_contributions

def _apply_daily_growth_and_cash_flow(
    current_calculation_date: date, 
    current_value: float, 
    net_contributions: float, 
    assets_data: dict, 
    processed_reallocations: list, 
    changes_by_date: dict,
    portfolio_creation_date: date # Kept for context, even if not directly used by all sub-functions
):
    """Handles logic for a single day's growth and cash flow application."""
    
    # 1. Determine current day's asset allocations
    current_day_allocations = _get_current_day_allocations(
        current_calculation_date,
        assets_data,
        processed_reallocations
        # portfolio_creation_date is not directly needed by _get_current_day_allocations
        # as asset creation dates are checked within assets_data
    )

    # 2. Apply daily growth based on these allocations
    if current_value > 0: # Growth can only occur if there's value
        portfolio_daily_return_rate = _calculate_portfolio_daily_return_rate(
            current_day_allocations,
            assets_data,
            current_calculation_date
        )
        current_value *= float(Decimal(1) + portfolio_daily_return_rate)

    # 3. Apply cash flows (contributions/withdrawals) for the current_calculation_date
    current_value, net_contributions = _apply_daily_cash_flows(
        current_calculation_date,
        changes_by_date,
        current_value,
        net_contributions
    )
            
    # 4. Calculate cumulative return for the day
    cumulative_return = 0.0
    if net_contributions > 0:
        cumulative_return = (current_value - net_contributions) / net_contributions
    elif current_value > 0 and net_contributions <=0:
         cumulative_return = float('inf')
    
    return current_value, net_contributions, {
        "date": current_calculation_date.isoformat(),
        "cumulative_return": round(cumulative_return, 6)
    }

# --- Main Function ---

def calculate_historical_performance(portfolio, start_date, end_date, portfolio_id):
    """
    Calculates historical performance data for a specific portfolio.
    Orchestrates data fetching and daily calculations using helper functions.
    """
    performance_data = []
    current_calculation_date = start_date
    
    # Ensure portfolio_creation_date is a date object
    portfolio_creation_date = portfolio.created_at.date() if isinstance(portfolio.created_at, datetime) else portfolio.created_at

    # Fetch and process data using imported helper functions
    assets_data = fetch_and_process_asset_data(portfolio_id)
    processed_reallocations = fetch_and_process_reallocations(portfolio_id, end_date)
    # Pass portfolio_creation_date to get_daily_changes if it needs to filter by it, 
    # or ensure it only fetches up to end_date as it currently does.
    # The current get_daily_changes only needs portfolio_id and end_date.
    changes_by_date = get_daily_changes(portfolio_id, end_date)

    # Calculate initial state before the main calculation loop
    current_value, net_contributions = _calculate_initial_portfolio_state(
        start_date, 
        portfolio_creation_date, 
        changes_by_date
    )
    
    # Main calculation loop
    while current_calculation_date <= end_date:
        if current_calculation_date < portfolio_creation_date:
            performance_data.append({
                "date": current_calculation_date.isoformat(),
                "cumulative_return": 0.0
            })
        else:
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
    
    return performance_data 