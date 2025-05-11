from flask import current_app
from app import db
from app.models import Asset, PlannedFutureChange
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
import json

# --- Helper Functions for Data Fetching and Preparation ---

def fetch_and_process_asset_data(portfolio_id: int) -> dict:
    """Fetches and prepares asset data for a given portfolio."""
    assets_data = {}
    portfolio_assets_db = db.session.query(Asset).filter(Asset.portfolio_id == portfolio_id).all()
    for asset_db in portfolio_assets_db:
        try:
            manual_return = Decimal(asset_db.manual_expected_return) if asset_db.manual_expected_return is not None else None
            base_alloc_perc = Decimal(asset_db.allocation_percentage) / Decimal(100) if asset_db.allocation_percentage is not None else Decimal(0)
        except InvalidOperation:
            current_app.logger.error(f"Invalid decimal value for asset {asset_db.asset_id} in portfolio {portfolio_id}")
            manual_return = None
            base_alloc_perc = Decimal(0)
        
        assets_data[asset_db.asset_id] = {
            "manual_expected_return": manual_return,
            "base_allocation_percentage": base_alloc_perc,
            "created_at": asset_db.created_at.date() if isinstance(asset_db.created_at, datetime) else asset_db.created_at
        }
    return assets_data

def fetch_and_process_reallocations(portfolio_id: int, end_date: date) -> list:
    """Fetches and prepares processed reallocations for a portfolio up to a given end date."""
    processed_reallocations = []
    reallocation_changes_db = db.session.query(PlannedFutureChange).filter(
        PlannedFutureChange.portfolio_id == portfolio_id,
        PlannedFutureChange.change_type == 'Reallocation',
        PlannedFutureChange.change_date <= end_date
    ).order_by(PlannedFutureChange.change_date).all()

    for realloc_db in reallocation_changes_db:
        if realloc_db.target_allocation_json:
            try:
                target_alloc_dict_str_keys = json.loads(realloc_db.target_allocation_json)
                target_alloc_decimal_values = {
                    int(asset_id_str): Decimal(perc_str) / Decimal(100) 
                    for asset_id_str, perc_str in target_alloc_dict_str_keys.items()
                }
                
                sum_of_allocations = sum(target_alloc_decimal_values.values())
                tolerance = Decimal('0.001') 

                if abs(sum_of_allocations - Decimal(1)) > tolerance:
                    current_app.logger.warning(
                        f"Reallocation change_id {realloc_db.change_id} on date {realloc_db.change_date} "
                        f"has target_allocation_json percentages summing to {sum_of_allocations:.4f}, not 1. "
                        f"This reallocation event will be skipped."
                    )
                    continue
                
                processed_reallocations.append({
                    "change_date": realloc_db.change_date,
                    "allocations": target_alloc_decimal_values
                })
            except (json.JSONDecodeError, ValueError, InvalidOperation) as e:
                current_app.logger.error(f"Error processing target_allocation_json for change_id {realloc_db.change_id}: {e}")
    return processed_reallocations

def get_daily_changes(portfolio_id: int, end_date: date) -> dict:
    """Prepares a dictionary of daily changes (Contributions/Withdrawals) by date."""
    changes_by_date = {}
    all_relevant_changes = db.session.query(PlannedFutureChange).filter(
        PlannedFutureChange.portfolio_id == portfolio_id,
        PlannedFutureChange.change_date <= end_date,
        PlannedFutureChange.change_type.in_(['Contribution', 'Withdrawal'])
    ).order_by(PlannedFutureChange.change_date).all()

    for change in all_relevant_changes:
        try:
            amount_decimal = Decimal(change.amount) if change.amount is not None else Decimal(0)
        except InvalidOperation:
            current_app.logger.error(f"Invalid amount for change_id {change.change_id}: {change.amount}")
            amount_decimal = Decimal(0)

        change_event_date = change.change_date
        if isinstance(change_event_date, datetime): # Ensure it's a date object
            change_event_date = change_event_date.date()

        if change_event_date not in changes_by_date:
            changes_by_date[change_event_date] = []
        changes_by_date[change_event_date].append({
            "type": change.change_type,
            "amount": amount_decimal
        })
    return changes_by_date 