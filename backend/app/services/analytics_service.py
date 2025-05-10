from app import db, current_app
from app.models import Asset, PlannedFutureChange
from datetime import date, datetime, timedelta
from decimal import Decimal, InvalidOperation
import json

def calculate_historical_performance(portfolio, start_date, end_date, portfolio_id):
    """
    Calculates historical performance data for a specific portfolio.
    """
    # The complex calculation logic will be moved here.
    # For now, it's a placeholder.
    
    # --- Actual Performance Calculation Logic ---
    # This implementation is a simplified version and makes several assumptions:
    # 1. Initial Portfolio Value: The calculation of initial value at `start_date` is based on
    #    net contributions up to that point. It does not fetch historical market values of assets.
    # 2. Growth Simulation: A placeholder daily growth factor is applied. This is NOT based on
    #    actual market data or specific asset returns. It's for demonstration purposes.
    # 3. Planned Changes: Only 'Contribution' and 'Withdrawal' types are considered.
    #    Reallocations or other change types are not factored into this performance metric.
    # 4. Cumulative Return: Calculated as (current_value - net_contributions) / net_contributions.

    performance_data = []
    current_calculation_date = start_date
    
    # Ensure portfolio.created_at is a date object if it's a datetime
    portfolio_creation_date = portfolio.created_at.date() if isinstance(portfolio.created_at, datetime) else portfolio.created_at

    # Initialize values
    # current_value represents the market value of the portfolio.
    # net_contributions represents the sum of all cash inflows minus outflows.
    current_value = 0.0
    net_contributions = 0.0

    # --- Fetch additional data for dynamic growth calculation ---
    # 1. Fetch all assets for the portfolio
    portfolio_assets_db = db.session.query(Asset).filter(Asset.portfolio_id == portfolio_id).all()
    assets_data = {}
    for asset_db in portfolio_assets_db:
        try:
            manual_return = Decimal(asset_db.manual_expected_return) if asset_db.manual_expected_return is not None else None
            # Initial allocation_percentage from asset record, can be overridden by reallocations
            base_alloc_perc = Decimal(asset_db.allocation_percentage) / Decimal(100) if asset_db.allocation_percentage is not None else Decimal(0)
        except InvalidOperation:
            # Log error or handle as per application's error handling strategy
            current_app.logger.error(f"Invalid decimal value for asset {asset_db.asset_id} in portfolio {portfolio_id}")
            manual_return = None
            base_alloc_perc = Decimal(0)
        
        assets_data[asset_db.asset_id] = {
            "manual_expected_return": manual_return,
            "base_allocation_percentage": base_alloc_perc, # Store as decimal (e.g., 0.6 for 60%)
            "created_at": asset_db.created_at.date() if isinstance(asset_db.created_at, datetime) else asset_db.created_at
        }

    # 2. Fetch all 'Reallocation' PlannedFutureChange events, sorted by date
    reallocation_changes_db = db.session.query(PlannedFutureChange).filter(
        PlannedFutureChange.portfolio_id == portfolio_id,
        PlannedFutureChange.change_type == 'Reallocation',
        PlannedFutureChange.change_date <= end_date # Only need reallocations up to the report end date
    ).order_by(PlannedFutureChange.change_date).all()

    processed_reallocations = []
    for realloc_db in reallocation_changes_db:
        if realloc_db.target_allocation_json:
            try:
                target_alloc_dict_str_keys = json.loads(realloc_db.target_allocation_json)
                target_alloc_decimal_values = {
                    int(asset_id_str): Decimal(perc_str) / Decimal(100) 
                    for asset_id_str, perc_str in target_alloc_dict_str_keys.items()
                }
                
                # Validate that percentages sum to 1 (e.g., 100%)
                sum_of_allocations = sum(target_alloc_decimal_values.values())
                tolerance = Decimal('0.001') # Allow for minor precision issues (e.g. 99.9% to 100.1%)

                if abs(sum_of_allocations - Decimal(1)) > tolerance:
                    current_app.logger.warning(
                        f"Reallocation change_id {realloc_db.change_id} on date {realloc_db.change_date} "
                        f"has target_allocation_json percentages summing to {sum_of_allocations:.4f}, not 1. "
                        f"This reallocation event will be skipped."
                    )
                    continue # Skip this invalid reallocation event
                
                processed_reallocations.append({
                    "change_date": realloc_db.change_date,
                    "allocations": target_alloc_decimal_values
                })
            except (json.JSONDecodeError, ValueError, InvalidOperation) as e:
                current_app.logger.error(f"Error processing target_allocation_json for change_id {realloc_db.change_id}: {e}")
    # --- End of new data fetching ---

    # Fetch planned changes relevant to the period (Contributions/Withdrawals)
    all_relevant_changes = db.session.query(PlannedFutureChange).filter(
        PlannedFutureChange.portfolio_id == portfolio_id,
        PlannedFutureChange.change_date <= end_date, # Include all changes up to the end_date
        PlannedFutureChange.change_type.in_(['Contribution', 'Withdrawal'])
    ).order_by(PlannedFutureChange.change_date).all()

    # Create a dictionary for quick lookup of changes by date
    changes_by_date = {}
    for change in all_relevant_changes:
        # Ensure amount is Decimal for consistent calculations
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
        
    # Iterate from the portfolio creation date (or earlier if start_date is earlier, to establish baseline)
    # up to the requested end_date to build up current_value and net_contributions.
    # The loop for generating `performance_data` will start from the user-requested `start_date`.
    
    # Determine the actual starting point for historical calculation
    # This ensures net_contributions and current_value are correctly calculated up to the requested start_date
    calculation_loop_start_date = min(start_date, portfolio_creation_date)
    
    temp_date = calculation_loop_start_date
    while temp_date < start_date:
        if temp_date >= portfolio_creation_date: # Only process after portfolio exists
            # This loop correctly establishes `current_value` and `net_contributions` 
            # by processing cash flows (contributions/withdrawals) up to the main `start_date`.
            # Dynamic growth is applied in the main calculation loop below.

            # Apply changes for the day
            if temp_date in changes_by_date:
                for change_event in changes_by_date[temp_date]:
                    if change_event["type"] == 'Contribution':
                        current_value += float(change_event["amount"]) 
                        net_contributions += float(change_event["amount"])
                    elif change_event["type"] == 'Withdrawal':
                        current_value -= float(change_event["amount"])
                        net_contributions -= float(change_event["amount"])
        temp_date += timedelta(days=1)


    # Now, generate performance_data from the requested start_date to end_date
    while current_calculation_date <= end_date:
        if current_calculation_date < portfolio_creation_date:
            # If before portfolio creation, cumulative return is 0
            performance_data.append({
                "date": current_calculation_date.isoformat(),
                "cumulative_return": 0.0
            })
        else:
            # Apply daily growth (placeholder) if portfolio has positive value
            # This happens *before* applying changes for the day, reflecting growth on previous day's balance
            if current_value > 0: # Avoid applying growth if value is zero or negative
                # --- Dynamic Daily Growth Calculation ---
                current_day_allocations = {} # asset_id: Decimal(percentage)
                active_reallocation = None
                for realloc in processed_reallocations:
                    if realloc["change_date"] <= current_calculation_date:
                        active_reallocation = realloc
                    else:
                        break # Reallocations are sorted by date
                
                if active_reallocation:
                    current_day_allocations = active_reallocation["allocations"].copy()
                else:
                    # Use base allocations from assets_data if no reallocation has occurred yet
                    for asset_id, data in assets_data.items():
                        if data["created_at"] <= current_calculation_date:
                             current_day_allocations[asset_id] = data["base_allocation_percentage"]
                
                # Normalize allocations if they don't sum to 1 (e.g. due to new assets not in a prior realloc)
                # This is a simple normalization. More complex logic might be needed depending on business rules.
                total_allocation_sum = sum(current_day_allocations.values())
                if total_allocation_sum > 0 and total_allocation_sum != Decimal(1):
                    for asset_id in current_day_allocations:
                        current_day_allocations[asset_id] /= total_allocation_sum
                elif total_allocation_sum == Decimal(0) and any(assets_data[aid]["created_at"] <= current_calculation_date for aid in assets_data):
                    # If sum is 0 but assets exist, distribute equally (example placeholder logic)
                    # This case might need more specific business rules.
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
                            # Convert annual project return to daily rate: (1 + R_annual)^(1/365) - 1
                            daily_asset_return_rate = (Decimal(1) + asset_annual_return / Decimal(100))**(Decimal(1)/Decimal(365)) - Decimal(1)
                            portfolio_daily_return_rate += daily_asset_return_rate * allocation_percentage
                
                current_value *= float(Decimal(1) + portfolio_daily_return_rate) # Convert to float for current_value
                # --- End of Dynamic Daily Growth Calculation ---

            # Apply changes for the current_calculation_date
            if current_calculation_date in changes_by_date:
                for change_event in changes_by_date[current_calculation_date]:
                    if change_event["type"] == 'Contribution':
                        current_value += float(change_event["amount"]) # Ensure float for current_value
                        net_contributions += float(change_event["amount"])
                    elif change_event["type"] == 'Withdrawal':
                        current_value -= float(change_event["amount"])
                        net_contributions -= float(change_event["amount"])
            
            cumulative_return = 0.0
            if net_contributions > 0: # Avoid division by zero; if net_contributions is zero or negative, return is undefined or 0.
                cumulative_return = (current_value - net_contributions) / net_contributions
            elif current_value > 0 and net_contributions <=0: # E.g. all capital withdrawn but still gains
                 cumulative_return = float('inf') # Or handle as per specific business rule for this edge case
            
            performance_data.append({
                "date": current_calculation_date.isoformat(),
                "cumulative_return": round(cumulative_return, 6) # Increased precision
            })
            
        current_calculation_date += timedelta(days=1)
    
    return performance_data 