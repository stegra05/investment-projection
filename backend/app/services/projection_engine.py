import datetime
from dateutil.relativedelta import relativedelta
from dateutil import rrule
from decimal import Decimal, InvalidOperation
import math # No longer needed here, moved to strategies? Check if still needed. Let's remove for now.
import logging
from typing import Optional, List, Dict, Tuple # Added List, Dict, Tuple, Optional for type hints

# Import models from app.models
from app.models import Portfolio, Asset, PlannedFutureChange
# Import db instance from the app package
from app import db
from sqlalchemy.orm import joinedload

# Import the Enums!
from app.enums import ChangeType, AssetType, FrequencyType, MonthOrdinalType, OrdinalDayType, EndsOnType

# Import Pydantic schema for type hinting draft changes
from app.schemas.portfolio_schemas import PlannedChangeCreateSchema

# Import the return strategy getter
from .return_strategies import get_return_strategy as _get_return_strategy # Keep internal alias

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

# --- Default Annual Return Assumptions (Placeholder) ---
# Expressed as Decimal percentages (e.g., 7.0 for 7%)
# Moved inside the StandardAnnualReturnStrategy where it's used
# DEFAULT_ANNUAL_RETURNS = { ... }


# --- Helper Functions ---

# Helper for rrule day mapping
_RRULE_DAYS_MAP = [rrule.MO, rrule.TU, rrule.WE, rrule.TH, rrule.FR, rrule.SA, rrule.SU]

def _map_days_of_week_to_rrule(days_of_week_indices: list[int] | None) -> list[rrule.weekday] | None:
    if days_of_week_indices is None:
        return None
    return [_RRULE_DAYS_MAP[i] for i in days_of_week_indices if 0 <= i <= 6]

def _map_ordinal_day_to_rrule_weekdays(ordinal_day_enum: OrdinalDayType | None) -> list[rrule.weekday] | None:
    if ordinal_day_enum is None: return None
    if ordinal_day_enum == OrdinalDayType.MONDAY: return [rrule.MO]
    if ordinal_day_enum == OrdinalDayType.TUESDAY: return [rrule.TU]
    if ordinal_day_enum == OrdinalDayType.WEDNESDAY: return [rrule.WE]
    if ordinal_day_enum == OrdinalDayType.THURSDAY: return [rrule.TH]
    if ordinal_day_enum == OrdinalDayType.FRIDAY: return [rrule.FR]
    if ordinal_day_enum == OrdinalDayType.SATURDAY: return [rrule.SA]
    if ordinal_day_enum == OrdinalDayType.SUNDAY: return [rrule.SU]
    if ordinal_day_enum == OrdinalDayType.WEEKDAY: return [rrule.MO, rrule.TU, rrule.WE, rrule.TH, rrule.FR]
    if ordinal_day_enum == OrdinalDayType.WEEKEND_DAY: return [rrule.SA, rrule.SU]
    # OrdinalDayType.DAY is handled by bymonthday directly in _expand_single_recurring_change
    return None


def _expand_single_recurring_change(
    change: PlannedFutureChange,
    projection_start_date: datetime.date,
    projection_end_date: datetime.date
) -> list[PlannedFutureChange]:
    """
    Expands a single PlannedFutureChange object into a list of its occurrences
    within the projection period if it's recurring.
    Returns the original change in a list if it's a one-time event within the period.
    """
    occurrences: list[PlannedFutureChange] = []

    if not change.is_recurring:
        if change.change_date >= projection_start_date and change.change_date <= projection_end_date:
            occurrences.append(change)
        return occurrences

    # --- Construct rrule parameters ---
    rrule_params = {}
    rrule_freq_map = {
        FrequencyType.DAILY: rrule.DAILY,
        FrequencyType.WEEKLY: rrule.WEEKLY,
        FrequencyType.MONTHLY: rrule.MONTHLY,
        FrequencyType.YEARLY: rrule.YEARLY,
    }
    if change.frequency not in rrule_freq_map: # Should not happen with ONE_TIME handled
        return [] # Or log error for invalid frequency on recurring change

    rrule_params['freq'] = rrule_freq_map[change.frequency]
    rrule_params['dtstart'] = datetime.datetime.combine(change.change_date, datetime.datetime.min.time())
    rrule_params['interval'] = change.interval if change.interval and change.interval > 0 else 1

    # End conditions
    rrule_until = datetime.datetime.combine(projection_end_date, datetime.datetime.max.time()) # Max time for inclusiveness
    if change.ends_on_type == EndsOnType.AFTER_OCCURRENCES and change.ends_on_occurrences:
        rrule_params['count'] = change.ends_on_occurrences
    elif change.ends_on_type == EndsOnType.ON_DATE and change.ends_on_date:
        # rrule 'until' is inclusive
        rrule_until = min(rrule_until, datetime.datetime.combine(change.ends_on_date, datetime.datetime.max.time()))
    
    rrule_params['until'] = rrule_until


    # Frequency-specific parameters
    if change.frequency == FrequencyType.WEEKLY:
        mapped_days = _map_days_of_week_to_rrule(change.days_of_week)
        if mapped_days:
            rrule_params['byweekday'] = mapped_days
    
    elif change.frequency == FrequencyType.MONTHLY:
        if change.day_of_month:
            rrule_params['bymonthday'] = change.day_of_month
        elif change.month_ordinal and change.month_ordinal_day:
            # Ordinal day handling (e.g., first Monday, last day)
            month_ordinal_map_setpos = {
                MonthOrdinalType.FIRST: 1, MonthOrdinalType.SECOND: 2,
                MonthOrdinalType.THIRD: 3, MonthOrdinalType.FOURTH: 4,
                MonthOrdinalType.LAST: -1
            }
            month_ordinal_map_monthday = { # For OrdinalDayType.DAY
                MonthOrdinalType.FIRST: 1, MonthOrdinalType.SECOND: 2, # Add more if needed, up to 31
                MonthOrdinalType.LAST: -1
            }

            if change.month_ordinal_day == OrdinalDayType.DAY:
                if change.month_ordinal in month_ordinal_map_monthday:
                    rrule_params['bymonthday'] = month_ordinal_map_monthday[change.month_ordinal]
            else: # Specific day, weekday, or weekend_day
                mapped_ordinal_weekdays = _map_ordinal_day_to_rrule_weekdays(change.month_ordinal_day)
                if mapped_ordinal_weekdays and change.month_ordinal in month_ordinal_map_setpos:
                    rrule_params['byweekday'] = mapped_ordinal_weekdays
                    rrule_params['bysetpos'] = month_ordinal_map_setpos[change.month_ordinal]

    elif change.frequency == FrequencyType.YEARLY:
        if change.month_of_year:
            rrule_params['bymonth'] = change.month_of_year
        # Yearly can also have bymonthday or byweekday/bysetpos similar to monthly
        # For simplicity, current model implies day_of_month OR month_ordinal for yearly if more specific than just month
        if change.day_of_month: # e.g. July 15th every year
             rrule_params['bymonthday'] = change.day_of_month
        elif change.month_ordinal and change.month_ordinal_day: # e.g. Last Sunday of March
            month_ordinal_map_setpos = {
                MonthOrdinalType.FIRST: 1, MonthOrdinalType.SECOND: 2,
                MonthOrdinalType.THIRD: 3, MonthOrdinalType.FOURTH: 4,
                MonthOrdinalType.LAST: -1
            }
            if change.month_ordinal_day == OrdinalDayType.DAY: # Nth day of the specific month
                 month_ordinal_map_monthday = { MonthOrdinalType.FIRST: 1, MonthOrdinalType.LAST: -1} # simplified
                 if change.month_ordinal in month_ordinal_map_monthday:
                    rrule_params['bymonthday'] = month_ordinal_map_monthday[change.month_ordinal]
            else:
                mapped_ordinal_weekdays = _map_ordinal_day_to_rrule_weekdays(change.month_ordinal_day)
                if mapped_ordinal_weekdays and change.month_ordinal in month_ordinal_map_setpos:
                    rrule_params['byweekday'] = mapped_ordinal_weekdays
                    rrule_params['bysetpos'] = month_ordinal_map_setpos[change.month_ordinal]


    # Generate dates
    try:
        rule = rrule.rrule(**rrule_params)
        # Get dates strictly within the projection window, dtstart for rrule can be before proj start
        # Ensure projection_start_date is also datetime for rrule.between
        proj_start_dt = datetime.datetime.combine(projection_start_date, datetime.datetime.min.time())
        
        # Note: rrule.between includes the start/end if they match an occurrence.
        for occ_datetime in rule.between(proj_start_dt, rrule_params['until'], inc=True):
            occurrence_date = occ_datetime.date()
            if occurrence_date >= projection_start_date and occurrence_date <= projection_end_date:
                # Create a new non-persistent PlannedFutureChange instance for this occurrence
                # Important: mark this instance as NOT recurring itself
                new_occurrence = PlannedFutureChange(
                    portfolio_id=change.portfolio_id, # Keep original portfolio_id
                    change_type=change.change_type,
                    change_date=occurrence_date, # Key: use the actual occurrence date
                    amount=change.amount,
                    target_allocation_json=change.target_allocation_json,
                    description=f"{change.description} (Recurring Instance)" if change.description else "Recurring Instance",
                    is_recurring=False, # This instance is a single event
                    frequency=FrequencyType.ONE_TIME, # Mark as one_time
                    interval=1,
                    # Other recurrence fields are not relevant for this single instance
                    days_of_week=None,
                    day_of_month=None,
                    month_ordinal=None,
                    month_ordinal_day=None,
                    month_of_year=None,
                    ends_on_type=EndsOnType.NEVER, # Or appropriate default for one-time
                    ends_on_occurrences=None,
                    ends_on_date=None,
                    # original change_id is not copied, this is a new conceptual instance
                )
                occurrences.append(new_occurrence)
    except Exception as e:
        logging.error(f"Error generating occurrences for change_id {change.change_id if change.change_id else 'unknown'}: {e}", exc_info=True)

    return occurrences


def _fetch_portfolio_and_assets(portfolio_id: int) -> Tuple[Portfolio, List[Asset]]:
    """Fetches portfolio and its assets."""
    portfolio = Portfolio.query.options(
        joinedload(Portfolio.assets),
        joinedload(Portfolio.planned_changes) # Keep loading planned_changes for non-preview path
    ).get(portfolio_id)

    if not portfolio:
        raise ValueError(f"Portfolio with id {portfolio_id} not found.")

    return portfolio, portfolio.assets

def _prepare_and_expand_changes(
    input_changes: List[PlannedFutureChange],
    projection_start_date: datetime.date,
    projection_end_date: datetime.date
) -> Dict[Tuple[int, int], List[PlannedFutureChange]]:
    """Expands recurring changes from the input list and groups all changes by month."""
    all_individual_changes: List[PlannedFutureChange] = []
    for change_object in input_changes:
        expanded_occurrences = _expand_single_recurring_change(
            change_object, projection_start_date, projection_end_date
        )
        all_individual_changes.extend(expanded_occurrences)
    
    changes_by_month: Dict[Tuple[int, int], List[PlannedFutureChange]] = {}
    for change_instance in all_individual_changes:
        key = (change_instance.change_date.year, change_instance.change_date.month)
        changes_by_month.setdefault(key, []).append(change_instance)
        
    return changes_by_month


def _initialize_projection(assets: list[Asset], initial_total_value: Decimal | None):
    """Initializes asset values, monthly returns, and total value."""
    current_asset_values = {}
    monthly_asset_returns = {}
    calculated_initial_total = Decimal('0.0')

    # First pass: Calculate initial values and total
    temp_asset_values = {} # Temporary dict to store initial values before potentially adjusting based on percentage
    for asset in assets:
        initial_value = Decimal('0.0')
        if asset.allocation_value is not None:
            initial_value = Decimal(asset.allocation_value)
            temp_asset_values[asset.asset_id] = initial_value
            calculated_initial_total += initial_value
        # Percentage calculation needs the total, handle in second pass

    # Handle percentage-based allocations if initial_total_value is provided OR if only percentages were given
    final_initial_total = initial_total_value if initial_total_value is not None else calculated_initial_total

    if final_initial_total == Decimal('0.0') and any(a.allocation_percentage is not None for a in assets):
         print("Warning: Cannot calculate percentage allocations because initial total value is zero and no fixed value allocations exist.")
         # Proceed, but percentage assets will remain at 0 initial value

    # Second pass: Finalize initial values and calculate monthly returns
    actual_calculated_total = Decimal('0.0') # Recalculate based on final assignments
    for asset in assets:
        initial_value = temp_asset_values.get(asset.asset_id, Decimal('0.0')) # Get value if set previously

        if asset.allocation_percentage is not None and asset.allocation_value is None and final_initial_total > Decimal('0.0'):
            # Calculate value from percentage only if value wasn't explicitly set
            initial_value = (Decimal(asset.allocation_percentage) / Decimal('100')) * final_initial_total
        elif asset.allocation_percentage is not None and asset.allocation_value is not None:
             # If both are set, value takes precedence (already handled), maybe log a warning?
             print(f"Warning: Asset {asset.asset_id} has both allocation_value and allocation_percentage. Using allocation_value.")


        current_asset_values[asset.asset_id] = initial_value
        actual_calculated_total += initial_value

        # --- Calculate Monthly Asset Returns using Strategy ---
        try:
            # Ensure asset.asset_type is the Enum member if not already
            asset_enum_type = asset.asset_type
            if not isinstance(asset_enum_type, AssetType):
                 # Attempt to convert string representation back to Enum member if needed
                 # This might occur if data isn't loaded correctly as Enum from DB
                 try:
                     asset_enum_type = AssetType[asset_enum_type] # Assumes the string matches enum member name
                 except KeyError:
                      print(f"Error: Asset {asset.asset_id} has an unrecognized asset type '{asset_enum_type}'. Cannot determine return strategy.")
                      monthly_asset_returns[asset.asset_id] = Decimal('0.0') # Assign default zero return
                      continue # Skip to next asset


            strategy = _get_return_strategy(asset_enum_type) # type: ignore
            monthly_return = strategy.calculate_monthly_return(asset)
            monthly_asset_returns[asset.asset_id] = monthly_return
        except Exception as e:
             # Log the full traceback for unexpected errors during strategy execution
             logging.exception(f"Error calculating monthly return for asset {asset.asset_id} via strategy. Setting return to 0.")
             monthly_asset_returns[asset.asset_id] = Decimal('0.0')


    # Optional Validation: Compare final actual calculated total with provided initial_total_value
    tolerance = Decimal('0.01') * max(Decimal('1.0'), final_initial_total) # Relative tolerance or absolute 0.01 if total is small/zero
    if initial_total_value is not None and abs(actual_calculated_total - initial_total_value) > tolerance:
        print(f"Warning: Final calculated initial asset values sum ({actual_calculated_total:.2f}) "
              f"differs significantly from provided initial_total_value ({initial_total_value:.2f}). Check allocations. Using calculated total for projection start.")
        start_total_value = actual_calculated_total # Use the sum of calculated values as the starting point
    elif initial_total_value is not None:
         start_total_value = initial_total_value # Use provided value if it matches calculated total closely
    else:
        # Use calculated total if no initial_total_value provided.
        start_total_value = actual_calculated_total


    # Debugging: Print initial state
    # print(f"Initialized projection. Start Total: {start_total_value:.2f}")
    # for asset_id, val in current_asset_values.items():
    #     print(f"  Asset {asset_id}: Value={val:.2f}, MonthlyReturn={monthly_asset_returns[asset_id]:.5f}")


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
        if change.change_type == ChangeType.CONTRIBUTION:
            net_change_month += change_amount
        elif change.change_type == ChangeType.WITHDRAWAL:
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
        value_i_final = value_i_pre_cashflow.copy() # Start with empty/zero pre-cashflow values
        if net_change_month > Decimal('0.0') and len(value_i_final) > 0:
            # If starting from zero and adding cash, put it in the assets
            # Simple distribution: add all to the first asset found
            # A more complex strategy might be needed for multiple assets starting at zero
            first_asset_id = next(iter(value_i_final))
            value_i_final[first_asset_id] = net_change_month
            # Ensure total reflects the sum of (now non-zero) asset values
            current_total_value_month = sum(value_i_final.values())

        elif net_change_month != Decimal('0.0'):
             # Log that the change was applied directly to the total (e.g., if withdrawing from zero)
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

def calculate_projection(
    portfolio_id: int, 
    start_date: datetime.date, 
    end_date: datetime.date, 
    initial_total_value: Decimal | None,
    draft_changes_input: Optional[List[PlannedChangeCreateSchema]] = None # Accept Pydantic schemas for drafts
):
    """
    Calculates the future value projection for a given portfolio by orchestrating
    data fetching, initialization, and monthly calculations.

    Args:
        portfolio_id: The ID of the portfolio.
        start_date: The date to start the projection from.
        end_date: The date to end the projection.
        initial_total_value: The total value of the portfolio at the start_date (optional).
        draft_changes_input: Optional list of Pydantic PlannedChangeCreateSchema objects for draft changes.

    Returns:
        A list of tuples, where each tuple contains (date, total_value)
        for each month end in the projection period.

    Raises:
        ValueError: If the portfolio with the given ID is not found.
    """
    # --- 1. Fetch Portfolio & Assets --- 
    portfolio, assets = _fetch_portfolio_and_assets(portfolio_id)

    # --- 2. Determine Effective Planned Changes ---
    effective_planned_changes: List[PlannedFutureChange] = [] 
    if draft_changes_input is not None:
        for pydantic_change_schema in draft_changes_input:
            # Convert Pydantic schema to a temporary PlannedFutureChange model instance
            # The Pydantic schema should already have processed enums into their respective enum types.
            change_data_dict = pydantic_change_schema.model_dump()
            # Ensure that portfolio_id is set for these temporary changes, if not already in schema
            if 'portfolio_id' not in change_data_dict or change_data_dict['portfolio_id'] is None:
                 change_data_dict['portfolio_id'] = portfolio_id # Assign current portfolio_id
            
            # Create a temporary, non-persistent model instance
            # Note: If PlannedFutureChange model has strict non-nullable fields not present in 
            # PlannedChangeCreateSchema (beyond defaults), this could fail. 
            # Assuming schema covers necessary fields for a temporary calculation instance.
            temp_change_instance = PlannedFutureChange(**change_data_dict)
            effective_planned_changes.append(temp_change_instance)
    else:
        # Use changes from the database if no drafts are provided
        if portfolio.planned_changes:
            effective_planned_changes = portfolio.planned_changes
    
    # --- 3. Prepare & Expand Changes for Projection ---
    changes_by_month = _prepare_and_expand_changes(effective_planned_changes, start_date, end_date)

    # --- 4. Initialize Projection State (using 'assets' from step 1) ---
    current_asset_values, monthly_asset_returns, current_total_value = \
        _initialize_projection(assets, initial_total_value)

    projection_results = [(start_date, current_total_value)]

    current_date = start_date
    # Loop until the first day of the month *after* the end_date
    loop_end_date = end_date.replace(day=1) + relativedelta(months=1)

    # --- 5. Monthly Projection Loop ---
    while current_date < loop_end_date:
        month_end_date = current_date + relativedelta(months=1) - relativedelta(days=1)
        # Ensure we don't project past the requested end_date
        actual_month_end = min(month_end_date, end_date)

        # --- 5.a Calculate next month's values (using 'changes_by_month' from step 3) ---
        next_asset_values, next_total_value = _calculate_single_month(
            current_date,
            current_asset_values,
            monthly_asset_returns,
            changes_by_month
        )

        # --- 5.b Update Tracking & Store Result ---
        current_asset_values = next_asset_values
        current_total_value = next_total_value
        projection_results.append((actual_month_end, current_total_value))

        # Move to the next month
        current_date += relativedelta(months=1)

        # Exit loop if we have recorded the value for the final month end
        if actual_month_end >= end_date:
             break

    # --- 6. Format Output ---
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