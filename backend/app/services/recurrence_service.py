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
    if change.frequency not in rrule_freq_map:
        return []

    rrule_params['freq'] = rrule_freq_map[change.frequency]
    rrule_params['dtstart'] = datetime.datetime.combine(change.change_date, datetime.datetime.min.time())
    rrule_params['interval'] = change.interval if change.interval and change.interval > 0 else 1

    # End conditions
    # The overall 'until' for the rrule is the projection_end_date to avoid generating dates too far out.
    # This can be further restricted by the change's own end condition.
    rrule_until = datetime.datetime.combine(projection_end_date, datetime.datetime.max.time())
    if change.ends_on_type == EndsOnType.AFTER_OCCURRENCES and change.ends_on_occurrences:
        rrule_params['count'] = change.ends_on_occurrences
    elif change.ends_on_type == EndsOnType.ON_DATE and change.ends_on_date:
        # rrule 'until' parameter is inclusive. If the change ends on a specific date,
        # use the minimum of that date and the overall projection_end_date.
        # Ensure max time for the day to include any occurrences on that end date.
        specific_end_date_dt = datetime.datetime.combine(change.ends_on_date, datetime.datetime.max.time())
        rrule_until = min(rrule_until, specific_end_date_dt)

    rrule_params['until'] = rrule_until

    # Frequency-specific parameters
    if change.frequency == FrequencyType.WEEKLY:
        # byweekday: Used for WEEKLY frequency to specify days of the week.
        # Accepts a list of rrule weekday constants (MO, TU, etc.).
        mapped_days = _map_days_of_week_to_rrule(change.days_of_week)
        if mapped_days:
            rrule_params['byweekday'] = mapped_days

    elif change.frequency == FrequencyType.MONTHLY:
        if change.day_of_month:
            # bymonthday: Used for MONTHLY or YEARLY to specify day(s) of the month.
            # For MONTHLY, if day_of_month (e.g., 15) is set, it means the 15th of every month.
            rrule_params['bymonthday'] = change.day_of_month
        elif change.month_ordinal and change.month_ordinal_day:
            # For ordinal days (e.g., first Monday, last day of the month):
            # byweekday: Specifies the day type (e.g., Monday, Weekday).
            # bysetpos: Specifies the occurrence within the month (e.g., 1st, -1 for last).
            month_ordinal_map_setpos = {
                MonthOrdinalType.FIRST: 1, MonthOrdinalType.SECOND: 2,
                MonthOrdinalType.THIRD: 3, MonthOrdinalType.FOURTH: 4,
                MonthOrdinalType.LAST: -1
            }
            month_ordinal_map_monthday = { # For OrdinalDayType.DAY (e.g. last day of month)
                MonthOrdinalType.LAST: -1 # first day is bymonthday = 1
            }

            if change.month_ordinal_day == OrdinalDayType.DAY:
                # If it's for the Nth (e.g. last) day of the month. For first day, bymonthday=1 is used.
                # For other Nth days (2nd, 3rd..30th), direct bymonthday is used.
                # LAST day is handled via bymonthday = -1.
                if change.month_ordinal == MonthOrdinalType.LAST:
                     rrule_params['bymonthday'] = month_ordinal_map_monthday[MonthOrdinalType.LAST]
                elif change.month_ordinal == MonthOrdinalType.FIRST: # first day of month
                    rrule_params['bymonthday'] = 1
                # Note: Other ordinals for DAY (e.g. 2nd day, 3rd day) are not directly supported by bysetpos
                # and would typically be handled by bymonthday directly (e.g. bymonthday=2 for 2nd day).
                # The current model structure implies a single day_of_month or an ordinal rule.

            else: # Specific day (Mon, Tue), Weekday, or Weekend_day
                mapped_ordinal_weekdays = _map_ordinal_day_to_rrule_weekdays(change.month_ordinal_day)
                if mapped_ordinal_weekdays and change.month_ordinal in month_ordinal_map_setpos:
                    rrule_params['byweekday'] = mapped_ordinal_weekdays
                    rrule_params['bysetpos'] = month_ordinal_map_setpos[change.month_ordinal]

    elif change.frequency == FrequencyType.YEARLY:
        if change.month_of_year:
            # bymonth: Specifies the month(s) for YEARLY recurrence.
            rrule_params['bymonth'] = change.month_of_year

        if change.day_of_month:
            # bymonthday: For YEARLY, if day_of_month (e.g. 15) and bymonth (e.g. July) are set,
            # it means July 15th every year.
            rrule_params['bymonthday'] = change.day_of_month
        elif change.month_ordinal and change.month_ordinal_day:
            # For ordinal days within a specific month of the year (e.g., last Sunday of March):
            # byweekday + bysetpos combination is used, similar to MONTHLY.
            # bymonth must also be set for this to be applied to the correct month annually.
            month_ordinal_map_setpos = {
                MonthOrdinalType.FIRST: 1, MonthOrdinalType.SECOND: 2,
                MonthOrdinalType.THIRD: 3, MonthOrdinalType.FOURTH: 4,
                MonthOrdinalType.LAST: -1
            }
            if change.month_ordinal_day == OrdinalDayType.DAY:
                # For Nth day of a specific month (e.g. last day of March, first day of June)
                # bymonthday: used with bymonth. E.g., LAST day of March (bymonth=3, bymonthday=-1)
                if change.month_ordinal == MonthOrdinalType.LAST:
                    rrule_params['bymonthday'] = -1
                elif change.month_ordinal == MonthOrdinalType.FIRST:
                     rrule_params['bymonthday'] = 1
            else:
                mapped_ordinal_weekdays = _map_ordinal_day_to_rrule_weekdays(change.month_ordinal_day)
                if mapped_ordinal_weekdays and change.month_ordinal in month_ordinal_map_setpos:
                    rrule_params['byweekday'] = mapped_ordinal_weekdays
                    rrule_params['bysetpos'] = month_ordinal_map_setpos[change.month_ordinal]

    # Generate dates
    try:
        rule = rrule.rrule(**rrule_params)
        proj_start_dt = datetime.datetime.combine(projection_start_date, datetime.datetime.min.time())

        # rrule.between(dtstart, dtend, inc=True) includes occurrences on dtstart and dtend if they match the rule.
        # The dtstart for the rule object (rule._dtstart) might be before our projection_start_date.
        # We iterate from the rule's actual start, but only include dates within our projection window.
        for occ_datetime in rule.between(proj_start_dt, rrule_params['until'], inc=True):
            occurrence_date = occ_datetime.date()
            # Ensure the generated date is not before the change's original start date (dtstart of the rule)
            # and also within the overall projection window.
            # The `rule.between` already respects the `proj_start_dt` as its lower bound for generation.
            if occurrence_date >= change.change_date and occurrence_date <= projection_end_date:
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