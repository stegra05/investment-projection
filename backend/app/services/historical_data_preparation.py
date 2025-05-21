"""
Service module for fetching and preparing historical data for financial calculations.

This module provides functions to retrieve and process data related to a user's
portfolio, including asset details, reallocation events, and cash flow changes
(contributions and withdrawals). The prepared data is structured to be easily
consumed by other services, such as performance analytics or projection engines.
"""
from flask import current_app
from app import db
from app.models import Asset, PlannedFutureChange
from app.enums import ChangeType
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
import json

# --- Data Fetching and Preparation Functions ---

def fetch_and_process_asset_data(portfolio_id: int) -> dict:
    """Fetches asset data for a portfolio and processes it into a structured format.

    Retrieves all assets associated with the given `portfolio_id`.
    For each asset, it extracts the manual expected return, base allocation
    percentage, and creation date. Values are converted to Decimal where appropriate.
    Errors during decimal conversion for an asset's financial data are logged,
    and problematic fields are set to None or Decimal(0).

    Args:
        portfolio_id (int): The ID of the portfolio whose assets are to be fetched.

    Returns:
        dict: A dictionary where keys are asset_ids and values are dictionaries
              containing:
                - "manual_expected_return" (Optional[Decimal]): Expected annual return as a decimal (e.g., 0.075 for 7.5%).
                                                                  None if not set or invalid.
                - "base_allocation_percentage" (Decimal): Asset's allocation percentage as a decimal (e.g., 0.5 for 50%).
                                                          Defaults to 0 if not set or invalid.
                - "created_at" (date): The date the asset was created.
    """
    current_app.logger.debug(f"Fetching and processing asset data for PortfolioID '{portfolio_id}'.")
    assets_data = {}
    # Query all assets belonging to the specified portfolio.
    portfolio_assets_db = db.session.query(Asset).filter(Asset.portfolio_id == portfolio_id).all()
    
    for asset_db in portfolio_assets_db:
        manual_return_decimal = None
        base_alloc_perc_decimal = Decimal(0) # Default to 0 allocation

        try:
            # Process manual_expected_return: stored as numeric in DB (e.g., 7.5 for 7.5%)
            # Convert to Decimal directly, calculation services will handle /100 if needed.
            if asset_db.manual_expected_return is not None:
                manual_return_decimal = Decimal(asset_db.manual_expected_return)
            
            # Process allocation_percentage: stored as numeric (e.g., 50 for 50%)
            # Convert to a decimal fraction (e.g., 0.50 for 50%).
            if asset_db.allocation_percentage is not None:
                base_alloc_perc_decimal = Decimal(asset_db.allocation_percentage) / Decimal(100)
                
        except InvalidOperation as e:
            # Log error if decimal conversion fails for critical financial data.
            current_app.logger.error(
                f"Invalid decimal conversion for AssetID '{asset_db.asset_id}' in PortfolioID '{portfolio_id}'. "
                f"Manual_expected_return='{asset_db.manual_expected_return}', "
                f"Allocation_percentage='{asset_db.allocation_percentage}'. Error: {e}"
            )
            # Keep manual_return_decimal as None, base_alloc_perc_decimal as 0 if conversion fails.

        asset_created_at_date = asset_db.created_at
        # Ensure created_at is a date object, not datetime, for consistent date comparisons.
        if isinstance(asset_db.created_at, datetime):
            asset_created_at_date = asset_db.created_at.date()
        
        assets_data[asset_db.asset_id] = {
            "manual_expected_return": manual_return_decimal,
            "base_allocation_percentage": base_alloc_perc_decimal,
            "created_at": asset_created_at_date
        }
    current_app.logger.debug(f"Processed {len(assets_data)} assets for PortfolioID '{portfolio_id}'.")
    return assets_data

def fetch_and_process_reallocations(portfolio_id: int, end_date: date) -> list:
    """Fetches and prepares reallocation events for a portfolio up to a specified date.

    Retrieves all 'Reallocation' type `PlannedFutureChange` events for the portfolio
    that occur on or before the `end_date`. Parses the `target_allocation_json`
    field, converting asset IDs to integers and percentage strings to Decimal fractions.
    Validates that percentages in each reallocation sum to 1 (100%); reallocations
    failing this check are logged and skipped.

    Args:
        portfolio_id (int): The ID of the portfolio.
        end_date (date): The last date to consider for reallocation events.

    Returns:
        list: A sorted list of dictionaries, each representing a valid reallocation:
              - "change_date" (date): The date of the reallocation.
              - "allocations" (dict): A dictionary mapping asset_id (int) to its
                                      Decimal allocation percentage (e.g., 0.6 for 60%).
              The list is sorted by `change_date`.
    """
    current_app.logger.debug(f"Fetching reallocations for PortfolioID '{portfolio_id}' up to {end_date.isoformat()}.")
    processed_reallocations = []
    # Query for reallocation events, ordered by date.
    reallocation_changes_db = db.session.query(PlannedFutureChange).filter(
        PlannedFutureChange.portfolio_id == portfolio_id,
        PlannedFutureChange.change_type == ChangeType.REALLOCATION, # Use Enum member
        PlannedFutureChange.change_date <= end_date
    ).order_by(PlannedFutureChange.change_date).all()

    for realloc_db in reallocation_changes_db:
        if realloc_db.target_allocation_json: # Ensure JSON data exists
            try:
                # `target_allocation_json` is expected to be like: {"asset_id_str": "percentage_str", ...}
                target_alloc_dict_str_keys = json.loads(realloc_db.target_allocation_json)
                
                # Convert keys to int and values to Decimal fractions (e.g., "50" -> Decimal('0.50'))
                target_alloc_decimal_values = {
                    int(asset_id_str): Decimal(perc_str) / Decimal(100) 
                    for asset_id_str, perc_str in target_alloc_dict_str_keys.items()
                }
                
                # Validate that the sum of allocations is close to 1 (100%).
                sum_of_allocations = sum(target_alloc_decimal_values.values())
                # Using a small tolerance for floating-point/decimal precision issues.
                tolerance = Decimal('0.001') # 0.1% tolerance

                if abs(sum_of_allocations - Decimal(1)) > tolerance:
                    current_app.logger.warning(
                        f"Reallocation (ChangeID '{realloc_db.change_id}', Date '{realloc_db.change_date}') "
                        f"for PortfolioID '{portfolio_id}' has target allocations summing to {sum_of_allocations:.4f} (not 1.0). "
                        "This reallocation event will be SKIPPED."
                    )
                    continue # Skip this invalid reallocation event.
                
                processed_reallocations.append({
                    "change_date": realloc_db.change_date, # Already a date object from DB
                    "allocations": target_alloc_decimal_values
                })
            except (json.JSONDecodeError, ValueError, InvalidOperation) as e:
                # Log errors during parsing or conversion of reallocation data.
                current_app.logger.error(
                    f"Error processing target_allocation_json for Reallocation ChangeID '{realloc_db.change_id}' "
                    f"(PortfolioID '{portfolio_id}', Date '{realloc_db.change_date}'): {e}. Skipping this event."
                )
    current_app.logger.debug(f"Processed {len(processed_reallocations)} valid reallocations for PortfolioID '{portfolio_id}'.")
    return processed_reallocations

def get_daily_changes(portfolio_id: int, end_date: date) -> dict:
    """Prepares a dictionary of daily cash flow changes (Contributions/Withdrawals).

    Fetches all 'Contribution' and 'Withdrawal' type `PlannedFutureChange` events
    for the portfolio up to the `end_date`. Groups these changes by date.
    Amounts are converted to Decimal.

    Args:
        portfolio_id (int): The ID of the portfolio.
        end_date (date): The last date to consider for cash flow events.

    Returns:
        dict: A dictionary where keys are dates (date objects) and values are lists
              of change events for that date. Each change event is a dictionary:
              - "type" (str): 'Contribution' or 'Withdrawal'.
              - "amount" (Decimal): The amount of the change.
    """
    current_app.logger.debug(f"Fetching daily cash flow changes for PortfolioID '{portfolio_id}' up to {end_date.isoformat()}.")
    changes_by_date = {}
    # Query for contribution and withdrawal events, ordered by date.
    all_relevant_changes = db.session.query(PlannedFutureChange).filter(
        PlannedFutureChange.portfolio_id == portfolio_id,
        PlannedFutureChange.change_date <= end_date,
        PlannedFutureChange.change_type.in_([ChangeType.CONTRIBUTION, ChangeType.WITHDRAWAL]) # Use Enum members
    ).order_by(PlannedFutureChange.change_date).all()

    for change in all_relevant_changes:
        amount_decimal = Decimal(0) # Default to 0 if amount is None or invalid
        try:
            if change.amount is not None:
                amount_decimal = Decimal(change.amount)
        except InvalidOperation:
            current_app.logger.error(
                f"Invalid amount ('{change.amount}') for ChangeID '{change.change_id}' "
                f"(PortfolioID '{portfolio_id}', Date '{change.change_date}'). Using amount 0."
            )
        
        change_event_date = change.change_date
        # Ensure change_event_date is a date object, not datetime.
        if isinstance(change_event_date, datetime):
            change_event_date = change_event_date.date()

        # Group changes by date.
        if change_event_date not in changes_by_date:
            changes_by_date[change_event_date] = []
        
        changes_by_date[change_event_date].append({
            "type": change.change_type.value, # Use .value for Enum to get string
            "amount": amount_decimal
        })
        
    num_event_days = len(changes_by_date)
    num_total_events = sum(len(events) for events in changes_by_date.values())
    current_app.logger.debug(
        f"Processed {num_total_events} cash flow events over {num_event_days} days for PortfolioID '{portfolio_id}'."
    )
    return changes_by_date 