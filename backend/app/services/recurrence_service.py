import datetime
from dateutil import rrule
import logging
from typing import List, Dict, Tuple

# Import models from app.models (adjust path if necessary, assuming models are accessible)
from app.models import PlannedFutureChange
# Import the Enums! (adjust path if necessary)
from app.enums import FrequencyType, MonthOrdinalType, OrdinalDayType, EndsOnType

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
                 month_ordinal_map_monthday = { MonthOrdinalType.FIRST: 1, MonthOrdinalType.LAST: -1}
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
                # Create a non-recurring instance for this specific occurrence
                new_occurrence = PlannedFutureChange(
                    portfolio_id=change.portfolio_id, # Keep original portfolio_id
                    change_type=change.change_type,
                    change_date=occurrence_date, # Key: use the actual occurrence date
                    amount=change.amount,
                    target_allocation_json=change.target_allocation_json,
                    description=f"{change.description} (Recurring Instance)" if change.description else "Recurring Instance",
                    is_recurring=False,
                    frequency=FrequencyType.ONE_TIME,
                    interval=1,
                    # Other recurrence fields are not relevant for this single instance
                    days_of_week=None,
                    day_of_month=None,
                    month_ordinal=None,
                    month_ordinal_day=None,
                    month_of_year=None,
                    ends_on_type=EndsOnType.NEVER,
                    ends_on_occurrences=None,
                    ends_on_date=None,
                    # original change_id is not copied, this is a new conceptual instance
                )
                occurrences.append(new_occurrence)
    except Exception as e:
        logging.error(f"Error generating occurrences for change_id {change.change_id if change.change_id else 'unknown'}: {e}", exc_info=True)

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
        key = (change_instance.change_date.year, change_instance.change_date.month)
        changes_by_month.setdefault(key, []).append(change_instance)
        
    return changes_by_month 