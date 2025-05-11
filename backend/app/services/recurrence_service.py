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

FREQUENCY_CONFIG: Dict[FrequencyType, Dict[str, Optional[ParamApplier] | rrule.asters]] = {
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
    if change.ends_on_type == EndsOnType.AFTER_OCCURRENCES and change.ends_on_occurrences:
        rrule_params['count'] = change.ends_on_occurrences
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


def expand_and_group_changes(
    input_changes: List[PlannedFutureChange],
    projection_start_date: datetime.date,
    projection_end_date: datetime.date
) -> Dict[Tuple[int, int], List[PlannedFutureChange]]:
    """
    Expands recurring changes from the input list and groups all changes by month (year, month).
    """
    all_individual_changes: List[PlannedFutureChange] = []
    for change_object in input_changes:
        expanded_occurrences = _expand_single_recurring_change(
            change_object, projection_start_date, projection_end_date
        )
        all_individual_changes.extend(expanded_occurrences)
    
    changes_by_month: Dict[Tuple[int, int], List[PlannedFutureChange]] = {}
    for change_instance in all_individual_changes:
        # Ensure change_instance.change_date is a date object for keying
        instance_event_date = change_instance.change_date
        if isinstance(instance_event_date, datetime.datetime):
            instance_event_date = instance_event_date.date()

        key = (instance_event_date.year, instance_event_date.month)
        changes_by_month.setdefault(key, []).append(change_instance)
        
    return changes_by_month 