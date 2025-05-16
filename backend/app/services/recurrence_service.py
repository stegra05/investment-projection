import datetime
from dateutil import rrule
import logging
from typing import List, Dict, Tuple, Callable, Optional

# Import models from app.models (adjust path if necessary, assuming models are accessible)
from app.models import PlannedFutureChange
# Import the Enums! (adjust path if necessary)
from app.enums import FrequencyType, MonthOrdinalType, OrdinalDayType, EndsOnType

logger = logging.getLogger(__name__)

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
    # OrdinalDayType.DAY is handled by bymonthday directly
    return None

# --- Frequency Specific Parameter Handlers ---
def _apply_weekly_rrule_params(change: PlannedFutureChange, rrule_params: dict) -> None:
    """Applies rrule parameters specific to WEEKLY frequency."""
    mapped_days = _map_days_of_week_to_rrule(change.days_of_week)
    if mapped_days:
        rrule_params['byweekday'] = mapped_days

def _apply_monthly_rrule_params(change: PlannedFutureChange, rrule_params: dict) -> None:
    """Applies rrule parameters specific to MONTHLY frequency."""
    if change.day_of_month:
        rrule_params['bymonthday'] = change.day_of_month
    elif change.month_ordinal and change.month_ordinal_day:
        month_ordinal_map_setpos = {
            MonthOrdinalType.FIRST: 1, MonthOrdinalType.SECOND: 2,
            MonthOrdinalType.THIRD: 3, MonthOrdinalType.FOURTH: 4,
            MonthOrdinalType.LAST: -1
        }
        if change.month_ordinal_day == OrdinalDayType.DAY:
            if change.month_ordinal == MonthOrdinalType.LAST:
                rrule_params['bymonthday'] = -1
            elif change.month_ordinal == MonthOrdinalType.FIRST:
                rrule_params['bymonthday'] = 1
        else:
            mapped_ordinal_weekdays = _map_ordinal_day_to_rrule_weekdays(change.month_ordinal_day)
            if mapped_ordinal_weekdays and change.month_ordinal in month_ordinal_map_setpos:
                rrule_params['byweekday'] = mapped_ordinal_weekdays
                rrule_params['bysetpos'] = month_ordinal_map_setpos[change.month_ordinal]

def _apply_yearly_rrule_params(change: PlannedFutureChange, rrule_params: dict) -> None:
    """Applies rrule parameters specific to YEARLY frequency."""
    if change.month_of_year:
        rrule_params['bymonth'] = change.month_of_year

    if change.day_of_month:
        rrule_params['bymonthday'] = change.day_of_month
    elif change.month_ordinal and change.month_ordinal_day:
        month_ordinal_map_setpos = {
            MonthOrdinalType.FIRST: 1, MonthOrdinalType.SECOND: 2,
            MonthOrdinalType.THIRD: 3, MonthOrdinalType.FOURTH: 4,
            MonthOrdinalType.LAST: -1
        }
        if change.month_ordinal_day == OrdinalDayType.DAY:
            if change.month_ordinal == MonthOrdinalType.LAST:
                rrule_params['bymonthday'] = -1
            elif change.month_ordinal == MonthOrdinalType.FIRST:
                rrule_params['bymonthday'] = 1
        else:
            mapped_ordinal_weekdays = _map_ordinal_day_to_rrule_weekdays(change.month_ordinal_day)
            if mapped_ordinal_weekdays and change.month_ordinal in month_ordinal_map_setpos:
                rrule_params['byweekday'] = mapped_ordinal_weekdays
                rrule_params['bysetpos'] = month_ordinal_map_setpos[change.month_ordinal]

# --- Frequency Configuration ---
# Type alias for the parameter applying function
ParamApplier = Callable[[PlannedFutureChange, dict], None]

FREQUENCY_CONFIG: Dict[FrequencyType, Dict[str, Optional[ParamApplier] | int]] = {
    FrequencyType.DAILY: {
        "rrule_const": rrule.DAILY,
        "param_func": None  # No specific params beyond generic ones
    },
    FrequencyType.WEEKLY: {
        "rrule_const": rrule.WEEKLY,
        "param_func": _apply_weekly_rrule_params
    },
    FrequencyType.MONTHLY: {
        "rrule_const": rrule.MONTHLY,
        "param_func": _apply_monthly_rrule_params
    },
    FrequencyType.YEARLY: {
        "rrule_const": rrule.YEARLY,
        "param_func": _apply_yearly_rrule_params
    },
}

def _create_one_time_change_from_rule(
    original_change: PlannedFutureChange, 
    occurrence_date: datetime.date,
    description_suffix: str = " (Recurring Instance)"
) -> PlannedFutureChange:
    """Creates a new non-recurring PlannedFutureChange instance from an original rule and an occurrence date."""
    return PlannedFutureChange(
        portfolio_id=original_change.portfolio_id,
        change_type=original_change.change_type,
        change_date=occurrence_date,
        amount=original_change.amount,
        target_allocation_json=original_change.target_allocation_json,
        description=f"{original_change.description}{description_suffix}" if original_change.description else description_suffix.strip(),
        is_recurring=False, # Expanded instances are one-time conceptual events
        frequency=FrequencyType.ONE_TIME, # Mark as ONE_TIME
        # These fields below are not relevant for a one-time instance derived from a recurring rule
        interval=1,
        days_of_week=None,
        day_of_month=None,
        month_ordinal=None,
        month_ordinal_day=None,
        month_of_year=None,
        ends_on_type=EndsOnType.NEVER,
        ends_on_occurrences=None,
        ends_on_date=None,
        # Preserve original_change_id if it exists and is useful for tracking, else None.
        # For now, not explicitly setting it, as instances are new conceptual events.
        # original_change_id=original_change.change_id 
    )

def get_occurrences_for_month(
    change_rule: PlannedFutureChange, 
    target_year: int, 
    target_month: int
) -> list[PlannedFutureChange]:
    """
    Generates all occurrences for a given PlannedFutureChange rule that fall
    within the specified target_year and target_month.

    This function respects the rule's own end conditions (ends_on_date, ends_on_occurrences).
    The calling projection engine is responsible for managing cumulative counts if a rule
    is processed over multiple months and has an 'ends_on_occurrences' limit that spans
    beyond a single month's generation by this function.
    """
    occurrences_in_target_month: list[PlannedFutureChange] = []
    
    rule_start_date_obj = change_rule.change_date
    if isinstance(rule_start_date_obj, datetime.datetime):
        rule_start_date_obj = rule_start_date_obj.date()

    # Define the boundaries of the target month
    try:
        month_start_dt = datetime.datetime(target_year, target_month, 1)
        # Calculate end of month by going to first of next month and subtracting one day
        if target_month == 12:
            month_end_dt = datetime.datetime(target_year, target_month, 31, 23, 59, 59, 999999)
        else:
            month_end_dt = datetime.datetime(target_year, target_month + 1, 1) - datetime.timedelta(microseconds=1)
    except ValueError:
        logger.error(f"Invalid target_year ({target_year}) or target_month ({target_month}) provided.")
        return []

    # --- Handle Non-Recurring Changes ---
    if not change_rule.is_recurring:
        if rule_start_date_obj.year == target_year and rule_start_date_obj.month == target_month:
            # For a truly one-time event, we just return it as is, but ensure it's a new instance
            # conceptually, or decide if the original can be returned.
            # To be safe and align with how recurring instances are made, create a new one-time event.
            # However, if it's already a ONE_TIME, non-recurring event, its properties are already set.
            # Let's assume for now a non-recurring change *is* the occurrence.
             occurrences_in_target_month.append(change_rule) # Or a copy: _create_one_time_change_from_rule(change_rule, rule_start_date_obj, "")
        return occurrences_in_target_month

    # --- Handle Recurring Changes ---
    rrule_params = {}
    frequency_details = FREQUENCY_CONFIG.get(change_rule.frequency)
    if not frequency_details:
        logger.warning(
            f"Unsupported frequency type: {change_rule.frequency} for PortfolioID '{change_rule.portfolio_id}', "
            f"Rule Start Date '{change_rule.change_date}'. Skipping for month {target_year}-{target_month}."
        )
        return []

    rrule_params['freq'] = frequency_details["rrule_const"]
    
    dtstart_datetime = change_rule.change_date
    if isinstance(dtstart_datetime, datetime.date) and not isinstance(dtstart_datetime, datetime.datetime):
        dtstart_datetime = datetime.datetime.combine(dtstart_datetime, datetime.datetime.min.time())
    rrule_params['dtstart'] = dtstart_datetime

    rrule_params['interval'] = change_rule.interval if change_rule.interval and change_rule.interval > 0 else 1

    # Determine the 'until' for rrule generation. It should not go beyond the rule's own end date
    # or beyond the target month if we want to optimize rrule itself.
    # However, for EndsOnType.AFTER_OCCURRENCES, rrule needs its full potential 'count'.
    
    effective_rrule_until = None
    if change_rule.ends_on_type == EndsOnType.ON_DATE and change_rule.ends_on_date:
        ends_on_date_dt = change_rule.ends_on_date
        if isinstance(ends_on_date_dt, datetime.date) and not isinstance(ends_on_date_dt, datetime.datetime):
            ends_on_date_dt = datetime.datetime.combine(ends_on_date_dt, datetime.datetime.max.time())
        effective_rrule_until = ends_on_date_dt
    
    # If effective_rrule_until is set by rule's end date, and that date is before our target month even starts,
    # then no occurrences possible for this month.
    if effective_rrule_until and effective_rrule_until < month_start_dt:
        return []

    rrule_params['until'] = effective_rrule_until # Can be None if ends_on_type is NEVER or AFTER_OCCURRENCES

    if change_rule.ends_on_type == EndsOnType.AFTER_OCCURRENCES and change_rule.ends_on_occurrences is not None and change_rule.ends_on_occurrences > 0:
        rrule_params['count'] = change_rule.ends_on_occurrences
    elif change_rule.ends_on_type == EndsOnType.AFTER_OCCURRENCES and (change_rule.ends_on_occurrences is None or change_rule.ends_on_occurrences <= 0):
        return [] # Rule ends after 0 or invalid occurrences

    param_func = frequency_details.get("param_func")
    if param_func:
        param_func(change_rule, rrule_params)

    try:
        rule_obj = rrule.rrule(**rrule_params)
        
        # Get all occurrences from the rule based on its own 'count' or 'until' limit
        # then filter for the specific month.
        # rrule.between is inclusive for start and end by default.
        generated_dates_in_window = rule_obj.between(month_start_dt, month_end_dt, inc=True)

        for occ_datetime in generated_dates_in_window:
            occurrence_date = occ_datetime.date()
            # Ensure the occurrence is not before the rule's original start date
            # This is important if dtstart was long ago and rrule.between picked it up.
            if occurrence_date >= rule_start_date_obj:
                new_occurrence = _create_one_time_change_from_rule(change_rule, occurrence_date)
                occurrences_in_target_month.append(new_occurrence)
                
    except Exception as e:
        logger.error(
            f"Error generating monthly occurrences for PortfolioID '{change_rule.portfolio_id}', "
            f"Rule Start Date '{change_rule.change_date}', Target Month {target_year}-{target_month}: {e}", 
            exc_info=True
        )

    return occurrences_in_target_month

# _expand_single_recurring_change and its tests (TestExpandSingleRecurringChange) are kept for now
# as they provide good coverage for rrule parameter construction, which is similar to
# the logic used in get_occurrences_for_month, even if _expand_single_recurring_change
# itself is not directly used by the projection engine anymore.

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
        # Ensure change_date is a date object for comparison
        change_event_date = change.change_date
        if isinstance(change_event_date, datetime.datetime):
            change_event_date = change_event_date.date()
            
        if change_event_date >= projection_start_date and change_event_date <= projection_end_date:
            occurrences.append(change)
        return occurrences

    # --- Construct rrule parameters ---
    rrule_params = {}
    
    frequency_details = FREQUENCY_CONFIG.get(change.frequency)
    if not frequency_details:
        logger.warning(
            f"Unsupported frequency type: {change.frequency} for PortfolioID '{change.portfolio_id}', "
            f"ChangeID '{change.change_id if change.change_id else 'unknown'}'. Skipping."
        )
        return []

    rrule_params['freq'] = frequency_details["rrule_const"]
    
    # Ensure change.change_date is datetime for dtstart
    dtstart_datetime = change.change_date
    if isinstance(dtstart_datetime, datetime.date) and not isinstance(dtstart_datetime, datetime.datetime):
        dtstart_datetime = datetime.datetime.combine(dtstart_datetime, datetime.datetime.min.time())
    rrule_params['dtstart'] = dtstart_datetime

    rrule_params['interval'] = change.interval if change.interval and change.interval > 0 else 1

    # End conditions
    rrule_until = datetime.datetime.combine(projection_end_date, datetime.datetime.max.time())
    if change.ends_on_type == EndsOnType.AFTER_OCCURRENCES:
        if change.ends_on_occurrences is not None and change.ends_on_occurrences > 0:
            rrule_params['count'] = change.ends_on_occurrences
        else: # Occurrences is 0, None, or negative
            # If count is 0 or invalid, no occurrences should be generated.
            # This also handles the case where ends_on_occurrences is None for this type.
            return [] 
    elif change.ends_on_type == EndsOnType.ON_DATE and change.ends_on_date:
        specific_end_date_dt = change.ends_on_date
        if isinstance(specific_end_date_dt, datetime.date) and not isinstance(specific_end_date_dt, datetime.datetime):
             specific_end_date_dt = datetime.datetime.combine(specific_end_date_dt, datetime.datetime.max.time())
        rrule_until = min(rrule_until, specific_end_date_dt)

    rrule_params['until'] = rrule_until
    
    # Apply frequency-specific parameters using the config
    param_func = frequency_details.get("param_func")
    if param_func:
        param_func(change, rrule_params)

    # Generate dates
    try:
        rule = rrule.rrule(**rrule_params)
        proj_start_dt = datetime.datetime.combine(projection_start_date, datetime.datetime.min.time())
        
        # Ensure change.change_date (original start of recurrence) is a date object for comparison below
        original_change_start_date = change.change_date
        if isinstance(original_change_start_date, datetime.datetime):
            original_change_start_date = original_change_start_date.date()

        for occ_datetime in rule.between(proj_start_dt, rrule_params['until'], inc=True):
            occurrence_date = occ_datetime.date()
            if occurrence_date >= original_change_start_date and occurrence_date <= projection_end_date:
                new_occurrence = PlannedFutureChange(
                    portfolio_id=change.portfolio_id, 
                    change_type=change.change_type,
                    change_date=occurrence_date, 
                    amount=change.amount,
                    target_allocation_json=change.target_allocation_json,
                    description=f"{change.description} (Recurring Instance)" if change.description else "Recurring Instance",
                    is_recurring=False, # Expanded instances are one-time conceptual events
                    frequency=FrequencyType.ONE_TIME, # Mark as ONE_TIME
                    interval=1,
                    days_of_week=None,
                    day_of_month=None,
                    month_ordinal=None,
                    month_ordinal_day=None,
                    month_of_year=None,
                    ends_on_type=EndsOnType.NEVER, # Recurrence definition not relevant for instance
                    ends_on_occurrences=None,
                    ends_on_date=None,
                )
                occurrences.append(new_occurrence)
    except Exception as e:
        logger.error(f"Error generating occurrences for PortfolioID '{change.portfolio_id}', ChangeID '{change.change_id if change.change_id else 'unknown'}': {e}", exc_info=True)

    return occurrences

# expand_and_group_changes is removed as its functionality is now handled on-the-fly
# by the projection_engine.py using get_occurrences_for_month.
# Original code for expand_and_group_changes was here. 