import datetime
from dateutil.relativedelta import relativedelta
from decimal import Decimal, InvalidOperation

d# Import models from app.models
from app.models import Portfolio, Asset, PlannedFutureChange
# Import db instance from the app package
from app import db
from sqlalchemy.orm import joinedload

# Placeholder for models until actual import path is confirmed
# class Portfolio:
#     id = 1
#     assets = []
#     planned_future_changes = []

# class Asset:
#     id = 1
#     asset_type = 'Stock'
#     allocation_percentage = None
#     allocation_value = None
#     manual_expected_return = None # Annual percentage

# class PlannedFutureChange:
#     id = 1
#     portfolio_id = 1
#     change_date = datetime.date.today()
#     change_type = 'Contribution' # or 'Withdrawal', 'Reallocation'
#     amount = Decimal('0.00')


def calculate_projection(portfolio_id: int, start_date: datetime.date, end_date: datetime.date, initial_total_value: Decimal):
    """
    Calculates the future value projection for a given portfolio.

    Args:
        portfolio_id: The ID of the portfolio.
        start_date: The date to start the projection from.
        end_date: The date to end the projection.
        initial_total_value: The total value of the portfolio at the start_date.

    Returns:
        A list of tuples, where each tuple contains (date, total_value)
        for each month end in the projection period.

    Raises:
        ValueError: If the portfolio with the given ID is not found.
    """

    # --- 1. Fetch Data --- 
    portfolio = Portfolio.query.options(
        joinedload(Portfolio.assets),
        joinedload(Portfolio.planned_future_changes)
    ).get(portfolio_id)

    if not portfolio:
        raise ValueError(f"Portfolio with id {portfolio_id} not found.")

    assets = portfolio.assets
    # Fetch all changes associated with the portfolio. Filtering happens in the loop.
    planned_changes = portfolio.planned_future_changes

    # Pre-process planned changes for efficient lookup
    changes_by_month = {}
    for change in planned_changes:
        key = (change.change_date.year, change.change_date.month)
        if key not in changes_by_month:
            changes_by_month[key] = []
        changes_by_month[key].append(change)

    # --- Mock Data for Development ---
    # assets = [
    #     Asset(id=1, asset_type='Stock', allocation_value=Decimal('6000'), manual_expected_return=Decimal('7.5')),
    #     Asset(id=2, asset_type='Bond', allocation_value=Decimal('4000'), manual_expected_return=Decimal('3.0')),
    #     # Asset(id=3, asset_type='Cash', allocation_percentage=Decimal('10'), manual_expected_return=Decimal('1.0')), # Example percentage
    # ]
    # planned_changes = [
    #     PlannedFutureChange(id=1, portfolio_id=portfolio_id, change_date=start_date + relativedelta(months=3), change_type='Contribution', amount=Decimal('500')),
    #     PlannedFutureChange(id=2, portfolio_id=portfolio_id, change_date=start_date + relativedelta(months=6), change_type='Withdrawal', amount=Decimal('200')), # Assume positive amount for withdrawal type
    #     PlannedFutureChange(id=3, portfolio_id=portfolio_id, change_date=start_date + relativedelta(months=6), change_type='Contribution', amount=Decimal('100')),
    #     PlannedFutureChange(id=4, portfolio_id=portfolio_id, change_date=start_date + relativedelta(months=8), change_type='Reallocation', amount=Decimal('0')), # Ignored in V1
    # ]
    # --- End Mock Data ---


    # --- 2. Initialization ---
    current_asset_values = {}
    monthly_asset_returns = {}
    calculated_initial_total = Decimal('0.0')

    for asset in assets:
        initial_value = Decimal('0.0')
        # Ensure database values are treated as Decimals
        if asset.allocation_value is not None:
            initial_value = Decimal(asset.allocation_value)
        elif asset.allocation_percentage is not None and initial_total_value is not None:
            initial_value = (Decimal(asset.allocation_percentage) / Decimal('100')) * initial_total_value
        # Note: If initial_total_value is None and only percentages are given,
        # this logic needs adjustment. The caller/API layer should ensure
        # initial_total_value is provided if needed.

        current_asset_values[asset.id] = initial_value
        calculated_initial_total += initial_value

        # Calculate Monthly Asset Returns (R_step_i)
        monthly_return = Decimal('0.0')
        if asset.manual_expected_return is not None:
            try:
                # Ensure database value is treated as Decimal
                r_annual = Decimal(asset.manual_expected_return) / Decimal('100')
                # (1 + R_annual_i)^(1/12) - 1
                monthly_return = (Decimal('1.0') + r_annual) ** (Decimal('1.0') / Decimal('12.0')) - Decimal('1.0')
            except (InvalidOperation, TypeError):
                 # Handle potential invalid decimal conversion or if None sneaks through
                monthly_return = Decimal('0.0')
        monthly_asset_returns[asset.id] = monthly_return

    # Optional Validation: Check if sum of initial asset values matches initial_total_value
    tolerance = Decimal('0.01') # Adjust tolerance as needed
    if initial_total_value is not None and abs(calculated_initial_total - initial_total_value) > tolerance:
        # This might indicate inconsistent data (e.g., sum of allocation_values doesn't match a stored total,
        # or percentages don't sum to 100% if initial_total_value was derived from them)
        # Log a warning or decide on stricter handling (e.g., raise error)
        print(f"Warning: Initial calculated asset values sum ({calculated_initial_total:.2f}) "
              f"differs from provided initial_total_value ({initial_total_value:.2f}) for portfolio {portfolio_id}. Proceeding.")
        # Depending on requirements, you might want to normalize initial values here or raise an error.


    projection_results = [(start_date, initial_total_value if initial_total_value is not None else calculated_initial_total)]
    # Use calculated_initial_total if initial_total_value wasn't provided (e.g. only value allocations exist)
    current_total_value = initial_total_value if initial_total_value is not None else calculated_initial_total

    current_date = start_date
    # Ensure the loop includes the start month and goes up to the end_date
    loop_end_date = end_date.replace(day=1) + relativedelta(months=1)

    # --- 3. Monthly Projection Loop ---
    while current_date < loop_end_date:
        month_end_date = current_date + relativedelta(months=1) - relativedelta(days=1)
        # Ensure we don't project past the requested end_date
        actual_month_end = min(month_end_date, end_date)

        value_i_pre_cashflow = {}
        total_value_pre_cashflow = Decimal('0.0')

        # --- 3.a Calculate Asset Growth ---
        for asset_id, current_value in current_asset_values.items():
            # Ensure current_value is Decimal
            current_value_dec = Decimal(current_value)
            growth = current_value_dec * monthly_asset_returns[asset_id]
            value_i_pre_cashflow[asset_id] = current_value_dec + growth
            total_value_pre_cashflow += value_i_pre_cashflow[asset_id]

        # --- 3.b Process Planned Changes for the Month ---
        net_change_month = Decimal('0.0')
        # Efficiently get changes for the current month using the pre-processed dictionary
        current_month_key = (current_date.year, current_date.month)
        month_changes = changes_by_month.get(current_month_key, [])
        # month_changes = [
        #     change for change in planned_changes
        #     if change.change_date.year == current_date.year and change.change_date.month == current_date.month
        # ]

        for change in month_changes:
            # Ensure amount from DB is Decimal
            change_amount = Decimal(change.amount)
            if change.change_type == 'Contribution':
                net_change_month += change_amount
            elif change.change_type == 'Withdrawal':
                net_change_month -= change_amount # Subtract withdrawal amount
            # Ignore 'Reallocation' for V1

        # --- 3.c Distribute Cash Flow & Calculate Final Monthly Values ---
        value_i_final = {}
        # Start with the pre-cashflow total, then adjust
        current_total_value = total_value_pre_cashflow

        if total_value_pre_cashflow > Decimal('0.0'):
            # Pro-rata distribution only if there's a positive value to distribute over
            for asset_id, pre_cashflow_val in value_i_pre_cashflow.items():
                try:
                    cash_flow_i = net_change_month * (pre_cashflow_val / total_value_pre_cashflow)
                    final_value = pre_cashflow_val + cash_flow_i
                    value_i_final[asset_id] = final_value
                except InvalidOperation:
                    # Handle potential division errors if pre_cashflow_val is somehow invalid
                    print(f"Warning: Invalid operation during cash flow distribution for asset {asset_id}. Skipping cash flow for this asset.")
                    value_i_final[asset_id] = pre_cashflow_val # Keep pre-cashflow value

            # Recalculate total from final asset values after pro-rata distribution
            current_total_value = sum(value_i_final.values())

        else:
            # Handle zero or negative total value pre-cashflow
            # If portfolio value is zero or negative, cash flow distribution is complex.
            # Simplest V1: Add/subtract net change directly to the total value.
            # Asset values remain unchanged proportionally (which might not be realistic, but avoids division by zero).
            current_total_value = total_value_pre_cashflow + net_change_month
            value_i_final = value_i_pre_cashflow.copy() # Keep asset values as they were pre-cashflow

            if net_change_month != Decimal('0.0'):
                 print(f"Warning: Portfolio value at {current_date.strftime('%Y-%m')} was {total_value_pre_cashflow:.2f}. "
                       f"Applied net change {net_change_month:.2f} directly. Pro-rata distribution skipped.")


        # --- 3.d Update Tracking ---
        current_asset_values = value_i_final.copy() # Update asset values for the next iteration

        # --- 3.e Store Result ---
        # Use the actual_month_end which respects the overall end_date
        projection_results.append((actual_month_end, current_total_value))

        # Move to the next month
        current_date += relativedelta(months=1)

        # Exit loop if we have passed the end_date
        if actual_month_end >= end_date:
             break


    # --- 4. Output ---
    # Ensure output values are Decimals for consistency if needed downstream,
    # although standard floats might be sufficient for charting.
    return [(date, Decimal(value)) for date, value in projection_results]

# Example Usage (can be removed or moved to tests later)
# Ensure this part requires app context if run directly
# if __name__ == '__main__':
#     from app import create_app # Assuming you have an app factory
#     app = create_app()
#     with app.app_context():
#         start = datetime.date(2024, 1, 1)
#         end = datetime.date(2025, 12, 31)
#         # Assuming Portfolio ID 1 exists and has some initial value logic
#         # You might need to query the actual current value for a portfolio ID
#         portfolio_id_to_project = 1
#         # Fetch or calculate a sensible initial_total_value
#         # initial_value = calculate_initial_value(portfolio_id_to_project, start)
#         initial_value = Decimal('10000.00') # Placeholder

#         try:
#             results = calculate_projection(portfolio_id_to_project, start, end, initial_value)
#             print("Projection Results:")
#             for date, value in results:
#                 print(f"{date.strftime('%Y-%m-%d')}: {value:.2f}")
#         except ValueError as e:
#             print(f"Error: {e}") 