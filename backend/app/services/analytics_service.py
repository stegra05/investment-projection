from app import db, current_app
from app.models import Asset, PlannedFutureChange
from datetime import date, datetime, timedelta
from decimal import Decimal, InvalidOperation
import json

# --- Helper Functions ---

def _fetch_and_process_asset_data(portfolio_id):
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

def _fetch_and_process_reallocations(portfolio_id, end_date):
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

def _get_daily_changes(portfolio_id, end_date):
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

        if change.change_date not in changes_by_date:
            changes_by_date[change.change_date] = []
        changes_by_date[change.change_date].append({
            "type": change.change_type,
            "amount": amount_decimal
        })
    return changes_by_date

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

def _apply_daily_growth_and_cash_flow(
    current_calculation_date, 
    current_value, 
    net_contributions, 
    assets_data, 
    processed_reallocations, 
    changes_by_date,
    portfolio_creation_date
):
    """Handles logic for a single day's growth and cash flow application."""
    
    # Apply daily growth
    if current_value > 0:
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
                if data["created_at"] <= current_calculation_date:
                     current_day_allocations[asset_id] = data["base_allocation_percentage"]
        
        total_allocation_sum = sum(current_day_allocations.values())
        if total_allocation_sum > 0 and total_allocation_sum != Decimal(1):
            for asset_id in current_day_allocations:
                current_day_allocations[asset_id] /= total_allocation_sum
        elif total_allocation_sum == Decimal(0) and any(assets_data[aid]["created_at"] <= current_calculation_date for aid in assets_data):
            active_assets_count = sum(1 for aid in assets_data if assets_data[aid]["created_at"] <= current_calculation_date)
            if active_assets_count > 0:
                equal_share = Decimal(1) / Decimal(active_assets_count)
                for asset_id in assets_data:
                    if assets_data[asset_id]["created_at"] <= current_calculation_date:
                        current_day_allocations[asset_id] = equal_share

        portfolio_daily_return_rate = Decimal(0)
        for asset_id, allocation_percentage in current_day_allocations.items():
            asset_info = assets_data.get(asset_id)
            if asset_info and asset_info["created_at"] <= current_calculation_date:
                asset_annual_return = asset_info["manual_expected_return"]
                if asset_annual_return is not None and allocation_percentage > 0:
                    daily_asset_return_rate = (Decimal(1) + asset_annual_return / Decimal(100))**(Decimal(1)/Decimal(365)) - Decimal(1)
                    portfolio_daily_return_rate += daily_asset_return_rate * allocation_percentage
        
        current_value *= float(Decimal(1) + portfolio_daily_return_rate)

    # Apply changes for the current_calculation_date
    if current_calculation_date in changes_by_date:
        for change_event in changes_by_date[current_calculation_date]:
            if change_event["type"] == 'Contribution':
                current_value += float(change_event["amount"])
                net_contributions += float(change_event["amount"])
            elif change_event["type"] == 'Withdrawal':
                current_value -= float(change_event["amount"])
                net_contributions -= float(change_event["amount"])
            
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
    
    portfolio_creation_date = portfolio.created_at.date() if isinstance(portfolio.created_at, datetime) else portfolio.created_at

    # Fetch and process data using helper functions
    assets_data = _fetch_and_process_asset_data(portfolio_id)
    processed_reallocations = _fetch_and_process_reallocations(portfolio_id, end_date)
    changes_by_date = _get_daily_changes(portfolio_id, end_date)

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