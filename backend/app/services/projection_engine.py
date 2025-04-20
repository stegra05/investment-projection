import datetime
from dateutil.relativedelta import relativedelta
from decimal import Decimal, InvalidOperation

# Import models from app.models
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

# --- Helper Functions ---

def _fetch_and_prepare_data(portfolio_id: int):
    """Fetches portfolio, assets, and planned changes, pre-processing changes."""
    portfolio = Portfolio.query.options(
        joinedload(Portfolio.assets),
        joinedload(Portfolio.planned_changes)
    ).get(portfolio_id)

    if not portfolio:
        raise ValueError(f"Portfolio with id {portfolio_id} not found.")

    assets = portfolio.assets
    planned_changes = portfolio.planned_changes

    # Pre-process planned changes for efficient lookup
    changes_by_month = {}
    for change in planned_changes:
        key = (change.change_date.year, change.change_date.month)
        if key not in changes_by_month:
            changes_by_month[key] = []
        changes_by_month[key].append(change)

    return assets, changes_by_month

def _initialize_projection(assets: list[Asset], initial_total_value: Decimal | None):
    """Initializes asset values, monthly returns, and total value."""
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

        current_asset_values[asset.asset_id] = initial_value
        calculated_initial_total += initial_value

        # Calculate Monthly Asset Returns (R_step_i)
        monthly_return = Decimal('0.0')
        if asset.manual_expected_return is not None:
            try:
                r_annual = Decimal(asset.manual_expected_return) / Decimal('100')
                # (1 + R_annual_i)^(1/12) - 1
                monthly_return = (Decimal('1.0') + r_annual) ** (Decimal('1.0') / Decimal('12.0')) - Decimal('1.0')
            except (InvalidOperation, TypeError):
                monthly_return = Decimal('0.0')
        monthly_asset_returns[asset.asset_id] = monthly_return

    # Optional Validation
    tolerance = Decimal('0.01')
    if initial_total_value is not None and abs(calculated_initial_total - initial_total_value) > tolerance:
        print(f"Warning: Initial calculated asset values sum ({calculated_initial_total:.2f}) "
              f"differs from provided initial_total_value ({initial_total_value:.2f}). Proceeding.")
        # Use the provided initial_total_value if available, otherwise the calculated sum.
        start_total_value = initial_total_value
    else:
        # Use calculated total if no initial_total_value provided or if they match closely.
        start_total_value = initial_total_value if initial_total_value is not None else calculated_initial_total


    return current_asset_values, monthly_asset_returns, start_total_value


def _apply_monthly_growth(
    current_asset_values: dict[int, Decimal],
    monthly_asset_returns: dict[int, Decimal]
) -> tuple[dict[int, Decimal], Decimal]:
    """Applies monthly growth to each asset based on its expected return."""
    value_i_pre_cashflow = {}
    total_value_pre_cashflow = Decimal('0.0')
    for asset_id, current_value in current_asset_values.items():
        current_value_dec = Decimal(current_value) # Ensure Decimal
        growth = current_value_dec * monthly_asset_returns[asset_id]
        value_i_pre_cashflow[asset_id] = current_value_dec + growth
        total_value_pre_cashflow += value_i_pre_cashflow[asset_id]
    return value_i_pre_cashflow, total_value_pre_cashflow

def _calculate_net_monthly_change(
    current_date: datetime.date,
    changes_by_month: dict[tuple[int, int], list[PlannedFutureChange]]
) -> Decimal:
    """Calculates the net cash flow (contributions - withdrawals) for the month."""
    net_change_month = Decimal('0.0')
    current_month_key = (current_date.year, current_date.month)
    month_changes = changes_by_month.get(current_month_key, [])

    for change in month_changes:
        change_amount = Decimal(change.amount) # Ensure Decimal
        if change.change_type == 'Contribution':
            net_change_month += change_amount
        elif change.change_type == 'Withdrawal':
            net_change_month -= change_amount
    return net_change_month

def _distribute_cash_flow(
    current_date: datetime.date, # Added for logging context
    value_i_pre_cashflow: dict[int, Decimal],
    total_value_pre_cashflow: Decimal,
    net_change_month: Decimal
) -> tuple[dict[int, Decimal], Decimal]:
    """Distributes the net monthly cash flow across assets proportionally."""
    value_i_final = {}
    current_total_value_month = total_value_pre_cashflow # Start with pre-cashflow total

    if total_value_pre_cashflow > Decimal('0.0'):
        for asset_id, pre_cashflow_val in value_i_pre_cashflow.items():
            try:
                # Proportional distribution
                cash_flow_i = net_change_month * (pre_cashflow_val / total_value_pre_cashflow)
                final_value = pre_cashflow_val + cash_flow_i
                value_i_final[asset_id] = final_value
            except InvalidOperation:
                # Log or handle potential division by zero or other issues if needed
                print(f"Warning: Invalid operation during cash flow distribution for asset {asset_id}. Using pre-cashflow value.")
                value_i_final[asset_id] = pre_cashflow_val # Keep pre-cashflow value

        # Recalculate total from final asset values for accuracy
        current_total_value_month = sum(value_i_final.values())
    else:
        # Handle zero/negative pre-cashflow value scenario
        current_total_value_month = total_value_pre_cashflow + net_change_month
        value_i_final = value_i_pre_cashflow.copy() # Keep pre-cashflow values
        if net_change_month != Decimal('0.0'):
            # Log that the change was applied directly to the total
            print(f"Warning: Portfolio value before cash flow at {current_date.strftime('%Y-%m')} was {total_value_pre_cashflow:.2f}. "
                  f"Applied net change {net_change_month:.2f} directly to total.")

    return value_i_final, current_total_value_month


def _calculate_single_month(
    current_date: datetime.date,
    current_asset_values: dict[int, Decimal],
    monthly_asset_returns: dict[int, Decimal],
    changes_by_month: dict[tuple[int, int], list[PlannedFutureChange]]
):
    """Calculates the projection for a single month by orchestrating sub-steps."""

    # 1. Apply Asset Growth
    value_i_pre_cashflow, total_value_pre_cashflow = _apply_monthly_growth(
        current_asset_values, monthly_asset_returns
    )

    # 2. Calculate Net Cash Flow for the Month
    net_change_month = _calculate_net_monthly_change(
        current_date, changes_by_month
    )

    # 3. Distribute Cash Flow and Finalize Monthly Values
    value_i_final, current_total_value_month = _distribute_cash_flow(
        current_date, # Pass date for logging
        value_i_pre_cashflow,
        total_value_pre_cashflow,
        net_change_month
    )

    return value_i_final, current_total_value_month


# --- Main Projection Function ---

def calculate_projection(portfolio_id: int, start_date: datetime.date, end_date: datetime.date, initial_total_value: Decimal | None):
    """
    Calculates the future value projection for a given portfolio by orchestrating
    data fetching, initialization, and monthly calculations.

    Args:
        portfolio_id: The ID of the portfolio.
        start_date: The date to start the projection from.
        end_date: The date to end the projection.
        initial_total_value: The total value of the portfolio at the start_date (optional).

    Returns:
        A list of tuples, where each tuple contains (date, total_value)
        for each month end in the projection period.

    Raises:
        ValueError: If the portfolio with the given ID is not found.
    """
    # --- 1. Fetch & Prepare ---
    assets, changes_by_month = _fetch_and_prepare_data(portfolio_id)

    # --- 2. Initialize ---
    current_asset_values, monthly_asset_returns, current_total_value = \
        _initialize_projection(assets, initial_total_value)

    projection_results = [(start_date, current_total_value)]

    current_date = start_date
    # Loop until the first day of the month *after* the end_date
    loop_end_date = end_date.replace(day=1) + relativedelta(months=1)

    # --- 3. Monthly Projection Loop ---
    while current_date < loop_end_date:
        month_end_date = current_date + relativedelta(months=1) - relativedelta(days=1)
        # Ensure we don't project past the requested end_date
        actual_month_end = min(month_end_date, end_date)

        # --- 3.a Calculate next month's values ---
        next_asset_values, next_total_value = _calculate_single_month(
            current_date,
            current_asset_values,
            monthly_asset_returns,
            changes_by_month
        )

        # --- 3.b Update Tracking & Store Result ---
        current_asset_values = next_asset_values
        current_total_value = next_total_value
        projection_results.append((actual_month_end, current_total_value))

        # Move to the next month
        current_date += relativedelta(months=1)

        # Exit loop if we have recorded the value for the final month end
        if actual_month_end >= end_date:
             break

    # --- 4. Format Output ---
    # Ensure output values remain Decimals
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