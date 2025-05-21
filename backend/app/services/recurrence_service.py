"""
Service module for handling recurrence rules of `PlannedFutureChange` events.

This module provides functionality to:
- Map application-specific recurrence parameters (e.g., days of the week,
  ordinal days like 'first Monday') to `python-dateutil.rrule` parameters.
- Generate specific occurrence dates for a given recurring rule within a
  target month, respecting the rule's own end conditions (e.g., ends on
  a specific date or after a number of occurrences).
- Create new, non-recurring `PlannedFutureChange` instances for each generated
  occurrence, which can then be used by projection or calculation engines.

The main entry point for generating monthly occurrences is `get_occurrences_for_month`.
A deprecated function `_expand_single_recurring_change` is kept for reference
as it contains similar rrule parameter construction logic, though it was designed
to expand occurrences over an entire projection period rather than month by month.
"""
import datetime
from dateutil import rrule # For recurrence rule processing
import logging
from typing import List, Dict, Callable, Optional # Using Optional from typing

# Import ORM model and Enums from the application
from app.models import PlannedFutureChange
from app.enums import FrequencyType, MonthOrdinalType, OrdinalDayType, EndsOnType

# Initialize a logger for this module
logger = logging.getLogger(__name__)

# Helper constant mapping integer day indices (0=Mon, 6=Sun) to rrule weekday constants.
_RRULE_DAYS_MAP = [rrule.MO, rrule.TU, rrule.WE, rrule.TH, rrule.FR, rrule.SA, rrule.SU]

def _map_days_of_week_to_rrule(days_of_week_indices: Optional[List[int]]) -> Optional[List[rrule.weekday]]:
    """Maps a list of day-of-week integer indices to rrule weekday constants.
    
    Args:
        days_of_week_indices: A list of integers (0 for Monday, ..., 6 for Sunday).
                              Can be None.
    Returns:
        A list of rrule.weekday objects, or None if input is None.
    """
    if days_of_week_indices is None:
        return None
    # Filter for valid indices (0-6) to prevent errors.
    return [_RRULE_DAYS_MAP[i] for i in days_of_week_indices if 0 <= i <= 6]

def _map_ordinal_day_to_rrule_weekdays(ordinal_day_enum: Optional[OrdinalDayType]) -> Optional[List[rrule.weekday]]:
    """Maps an OrdinalDayType enum to a list of rrule weekday constants.
    
    Used for rules like "first Monday of the month" or "last weekday".
    OrdinalDayType.DAY is handled directly by `bymonthday` in rrule, so returns None here.

    Args:
        ordinal_day_enum: An OrdinalDayType enum member, or None.

    Returns:
        A list of rrule.weekday objects corresponding to the enum, or None.
    """
    if ordinal_day_enum is None: return None
    # Direct mapping from OrdinalDayType enum members to rrule constants.
    if ordinal_day_enum == OrdinalDayType.MONDAY: return [rrule.MO]
    if ordinal_day_enum == OrdinalDayType.TUESDAY: return [rrule.TU]
    if ordinal_day_enum == OrdinalDayType.WEDNESDAY: return [rrule.WE]
    if ordinal_day_enum == OrdinalDayType.THURSDAY: return [rrule.TH]
    if ordinal_day_enum == OrdinalDayType.FRIDAY: return [rrule.FR]
    if ordinal_day_enum == OrdinalDayType.SATURDAY: return [rrule.SA]
    if ordinal_day_enum == OrdinalDayType.SUNDAY: return [rrule.SU]
    if ordinal_day_enum == OrdinalDayType.WEEKDAY: return [rrule.MO, rrule.TU, rrule.WE, rrule.TH, rrule.FR]
    if ordinal_day_enum == OrdinalDayType.WEEKEND_DAY: return [rrule.SA, rrule.SU]
    # If OrdinalDayType.DAY, it means a specific day number (e.g., 15th),
    # which is handled by `bymonthday` rrule parameter, not `byweekday`.
    return None

# --- Frequency Specific Parameter Applicators ---
# These functions modify the `rrule_params` dictionary in place based on the
# `PlannedFutureChange` rule's specifics for its frequency type.

def _apply_weekly_rrule_params(change: PlannedFutureChange, rrule_params: dict) -> None:
    """Applies rrule parameters specific to WEEKLY frequency (e.g., `byweekday`)."""
    # `days_of_week` from the change rule (e.g., [0, 2] for Mon, Wed) is mapped to rrule constants.
    mapped_days = _map_days_of_week_to_rrule(change.days_of_week)
    if mapped_days:
        rrule_params['byweekday'] = mapped_days

def _apply_monthly_rrule_params(change: PlannedFutureChange, rrule_params: dict) -> None:
    """Applies rrule parameters specific to MONTHLY frequency.
    
    Handles rules like "on the 15th of the month" (`bymonthday`) or
    "on the first Monday of the month" (`byweekday` + `bysetpos`).
    """
    if change.day_of_month: # e.g., recur on the 15th day of the month
        rrule_params['bymonthday'] = change.day_of_month
    elif change.month_ordinal and change.month_ordinal_day: # e.g., recur on the 'first' 'Monday'
        # `bysetpos` defines the Nth occurrence (1st, 2nd, ..., last which is -1).
        month_ordinal_to_bysetpos = {
            MonthOrdinalType.FIRST: 1, MonthOrdinalType.SECOND: 2,
            MonthOrdinalType.THIRD: 3, MonthOrdinalType.FOURTH: 4,
            MonthOrdinalType.LAST: -1  # Last occurrence of the weekday in the month
        }
        # If the rule is for "Nth day" (e.g. "last day of month"), it's a direct bymonthday.
        if change.month_ordinal_day == OrdinalDayType.DAY:
            if change.month_ordinal == MonthOrdinalType.LAST:
                rrule_params['bymonthday'] = -1 # rrule uses -1 for the last day of the month
            elif change.month_ordinal == MonthOrdinalType.FIRST:
                rrule_params['bymonthday'] = 1 # First day of the month
            # Other "Nth day" (e.g., 2nd day) might need more complex logic if required,
            # but typically `day_of_month` field would be used for specific day numbers.
        else: # Rule is for "Nth weekday/weekend_day/etc."
            mapped_ordinal_weekdays = _map_ordinal_day_to_rrule_weekdays(change.month_ordinal_day)
            if mapped_ordinal_weekdays and change.month_ordinal in month_ordinal_to_bysetpos:
                rrule_params['byweekday'] = mapped_ordinal_weekdays
                rrule_params['bysetpos'] = month_ordinal_to_bysetpos[change.month_ordinal]

def _apply_yearly_rrule_params(change: PlannedFutureChange, rrule_params: dict) -> None:
    """Applies rrule parameters specific to YEARLY frequency.
    
    Handles rules like "on June 15th" (`bymonth`, `bymonthday`) or
    "on the last Monday of June" (`bymonth`, `byweekday`, `bysetpos`).
    """
    if change.month_of_year: # e.g., recur in June (month 6)
        rrule_params['bymonth'] = change.month_of_year

    # Logic for day specification within the year is similar to monthly.
    if change.day_of_month: # Specific day number in the month (e.g., 15th of June)
        rrule_params['bymonthday'] = change.day_of_month
    elif change.month_ordinal and change.month_ordinal_day: # Ordinal day in the month (e.g., last Monday of June)
        month_ordinal_to_bysetpos = {
            MonthOrdinalType.FIRST: 1, MonthOrdinalType.SECOND: 2,
            MonthOrdinalType.THIRD: 3, MonthOrdinalType.FOURTH: 4,
            MonthOrdinalType.LAST: -1
        }
        if change.month_ordinal_day == OrdinalDayType.DAY: # "Nth day of the month"
            if change.month_ordinal == MonthOrdinalType.LAST:
                rrule_params['bymonthday'] = -1 # Last day of the specified month
            elif change.month_ordinal == MonthOrdinalType.FIRST:
                rrule_params['bymonthday'] = 1 # First day of the specified month
        else: # "Nth weekday/etc. of the month"
            mapped_ordinal_weekdays = _map_ordinal_day_to_rrule_weekdays(change.month_ordinal_day)
            if mapped_ordinal_weekdays and change.month_ordinal in month_ordinal_to_bysetpos:
                rrule_params['byweekday'] = mapped_ordinal_weekdays
                rrule_params['bysetpos'] = month_ordinal_to_bysetpos[change.month_ordinal]

# --- Frequency Configuration Mapping ---
# Type alias for the parameter applicator functions defined above.
ParamApplier = Callable[[PlannedFutureChange, Dict], None]

# Maps FrequencyType enums to their corresponding rrule constant and specific parameter applicator function.
FREQUENCY_CONFIG: Dict[FrequencyType, Dict[str, Optional[ParamApplier] | int]] = {
    FrequencyType.DAILY: {
        "rrule_const": rrule.DAILY,
        "param_func": None  # DAILY frequency usually doesn't need extra specific parameters beyond generic ones.
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
    original_change_rule: PlannedFutureChange, 
    occurrence_date: datetime.date,
    description_suffix: str = " (Recurring Instance)" # Default suffix for description
) -> PlannedFutureChange:
    """Creates a new, non-recurring PlannedFutureChange instance from an original rule for a specific occurrence date.

    The new instance represents a single event generated by the recurring rule.
    It's marked as non-recurring (is_recurring=False, frequency=ONE_TIME) and
    inherits core properties like amount, type, and JSON data from the original rule.
    Recurrence-specific fields from the original rule are reset or nulled out.

    Args:
        original_change_rule: The original PlannedFutureChange object that defines the recurrence.
        occurrence_date: The specific date this new instance occurs on.
        description_suffix: A suffix to append to the original description, indicating
                            it's a generated instance.

    Returns:
        A new PlannedFutureChange object representing a single occurrence.
    """
    new_description = original_change_rule.description if original_change_rule.description else ""
    if description_suffix and new_description: # Add space if both exist
        new_description += description_suffix
    elif description_suffix: # Only suffix exists
        new_description = description_suffix.strip()
        
    return PlannedFutureChange(
        portfolio_id=original_change_rule.portfolio_id,
        change_type=original_change_rule.change_type,
        change_date=occurrence_date, # Key: this instance occurs on this specific date
        amount=original_change_rule.amount,
        target_allocation_json=original_change_rule.target_allocation_json,
        description=new_description,
        # Mark this instance as a one-time event; its recurrence is defined by the original rule.
        is_recurring=False, 
        frequency=FrequencyType.ONE_TIME, 
        # Nullify recurrence-specific fields as they don't apply to a single instance.
        interval=1, # Default for one-time
        days_of_week=None,
        day_of_month=None,
        month_ordinal=None,
        month_ordinal_day=None,
        month_of_year=None,
        ends_on_type=EndsOnType.NEVER, # Default for one-time
        ends_on_occurrences=None,
        ends_on_date=None,
        # Could add a field like `original_rule_id = original_change_rule.change_id` for traceability if needed.
    )

def get_occurrences_for_month(
    change_rule: PlannedFutureChange, 
    target_year: int, 
    target_month: int
) -> List[PlannedFutureChange]:
    """Generates all occurrences for a given `PlannedFutureChange` rule that fall
    within the specified `target_year` and `target_month`.

    This function constructs an `rrule` based on the `change_rule`'s properties
    (frequency, interval, specific day/date conditions, end conditions). It then
    queries this `rrule` for occurrences within the boundaries of the target month.
    Each found occurrence date results in a new, non-recurring `PlannedFutureChange`
    instance created by `_create_one_time_change_from_rule`.

    The function respects the rule's own end conditions (e.g., `ends_on_date`,
    `ends_on_occurrences`). However, for rules with `ends_on_occurrences`, the
    calling context (e.g., projection engine) is responsible for managing the
    cumulative count of generated occurrences if the rule spans multiple months
    to ensure the total limit is not exceeded across the entire projection. This
    function itself will generate all occurrences within the month that would be
    valid if the 'count' limit were applied to the rrule directly from its start.

    Args:
        change_rule: The `PlannedFutureChange` ORM object defining the recurrence.
        target_year: The year of the target month.
        target_month: The month number (1-12) of the target month.

    Returns:
        A list of new `PlannedFutureChange` instances, each representing a single
        occurrence within the target month. Returns an empty list if no occurrences
        are found, or if inputs are invalid.
    """
    occurrences_in_target_month: List[PlannedFutureChange] = []
    
    # Ensure the rule's own start date is a date object for comparisons.
    rule_start_date_obj = change_rule.change_date
    if isinstance(rule_start_date_obj, datetime.datetime):
        rule_start_date_obj = rule_start_date_obj.date()

    # Define the datetime boundaries of the target month for rrule.between().
    try:
        # Start of the target month (e.g., 2023-06-01 00:00:00)
        month_start_dt = datetime.datetime(target_year, target_month, 1)
        # End of the target month (e.g., 2023-06-30 23:59:59.999999)
        if target_month == 12: # Handle December specifically for year increment
            month_end_dt = datetime.datetime(target_year, target_month, 31, 23, 59, 59, 999999)
        else:
            # Go to first day of next month, then subtract one microsecond.
            month_end_dt = datetime.datetime(target_year, target_month + 1, 1) - datetime.timedelta(microseconds=1)
    except ValueError: # Invalid year or month
        logger.error(f"Invalid target_year ({target_year}) or target_month ({target_month}) for rule '{change_rule.change_id}'.")
        return [] # Return empty list for invalid month/year.

    # --- Handle Non-Recurring Changes ---
    # If the rule itself is a one-time event, check if it falls within the target month.
    if not change_rule.is_recurring:
        if rule_start_date_obj.year == target_year and rule_start_date_obj.month == target_month:
            # If it's a non-recurring event within the month, it is its own occurrence.
            # Depending on desired behavior, either return the original object or a conceptual copy.
            # Here, we append the original rule, assuming it's treated as a single event.
            # If strict separation of rules vs. instances is needed, use _create_one_time_change_from_rule.
             occurrences_in_target_month.append(change_rule) 
        return occurrences_in_target_month

    # --- Handle Recurring Changes: Construct rrule parameters ---
    rrule_params: Dict[str, any] = {} # Parameters for rrule constructor
    
    frequency_details = FREQUENCY_CONFIG.get(change_rule.frequency)
    if not frequency_details: # Should not happen if DB/enum constraints are good
        logger.warning(
            f"Unsupported frequency type '{change_rule.frequency}' for rule ID '{change_rule.change_id}'. "
            f"Skipping for month {target_year}-{target_month}."
        )
        return []

    rrule_params['freq'] = frequency_details["rrule_const"] # e.g., rrule.MONTHLY
    
    # `dtstart` for rrule must be a datetime object.
    dtstart_datetime = change_rule.change_date
    if isinstance(dtstart_datetime, datetime.date) and not isinstance(dtstart_datetime, datetime.datetime):
        dtstart_datetime = datetime.datetime.combine(dtstart_datetime, datetime.datetime.min.time())
    rrule_params['dtstart'] = dtstart_datetime

    # Interval for the recurrence.
    rrule_params['interval'] = change_rule.interval if change_rule.interval and change_rule.interval > 0 else 1

    # --- Determine rrule End Conditions ('until' or 'count') ---
    # `effective_rrule_until` is the latest possible datetime an occurrence can happen
    # based on the rule's own `ends_on_date`.
    effective_rrule_until: Optional[datetime.datetime] = None
    if change_rule.ends_on_type == EndsOnType.ON_DATE and change_rule.ends_on_date:
        ends_on_date_dt = change_rule.ends_on_date
        # Convert rule's end date to datetime, using max time to be inclusive of the whole day.
        if isinstance(ends_on_date_dt, datetime.date) and not isinstance(ends_on_date_dt, datetime.datetime):
            ends_on_date_dt = datetime.datetime.combine(ends_on_date_dt, datetime.datetime.max.time())
        effective_rrule_until = ends_on_date_dt
    
    # Optimization: If the rule's own end date is before the target month even starts, no occurrences are possible.
    if effective_rrule_until and effective_rrule_until < month_start_dt:
        logger.debug(f"Rule '{change_rule.change_id}' ends before target month. No occurrences for {target_year}-{target_month}.")
        return []

    # Set 'until' for rrule. If `effective_rrule_until` is None (rule ends 'NEVER' or 'AFTER_OCCURRENCES'),
    # rrule will generate indefinitely or up to 'count'. We later filter by month window.
    rrule_params['until'] = effective_rrule_until 
    
    # Set 'count' for rrule if the rule ends after a specific number of occurrences.
    # The projection engine needs to manage cumulative counts if this limit spans multiple months.
    # This function will generate all occurrences within the month that would be valid if the 'count'
    # were applied from the rule's start.
    if change_rule.ends_on_type == EndsOnType.AFTER_OCCURRENCES:
        if change_rule.ends_on_occurrences is not None and change_rule.ends_on_occurrences > 0:
            rrule_params['count'] = change_rule.ends_on_occurrences
        else: # Rule specified to end after 0, None, or negative occurrences.
            logger.debug(f"Rule '{change_rule.change_id}' ends after 0 or invalid occurrences. No events for {target_year}-{target_month}.")
            return [] 

    # Apply frequency-specific rrule parameters (e.g., byweekday, bymonthday).
    param_func = frequency_details.get("param_func")
    if param_func: # If a specific applicator function exists for this frequency
        param_func(change_rule, rrule_params) # Modifies rrule_params in-place

    # --- Generate Occurrences using rrule ---
    try:
        rule_obj = rrule.rrule(**rrule_params) # Instantiate the rrule object
        
        # Use rrule.between() to find occurrences strictly within the target month's window.
        # `inc=True` makes the start and end of the window inclusive.
        generated_dates_in_window = rule_obj.between(month_start_dt, month_end_dt, inc=True)

        for occ_datetime in generated_dates_in_window:
            occurrence_date = occ_datetime.date() # Convert to date object
            
            # Final check: ensure the generated occurrence is not before the rule's original start date.
            # This is mainly a safeguard, as rrule's dtstart should handle this, but complex rules
            # (e.g., with bysetpos=-1 on a month where dtstart is late) might need it.
            if occurrence_date >= rule_start_date_obj:
                new_occurrence_event = _create_one_time_change_from_rule(change_rule, occurrence_date)
                occurrences_in_target_month.append(new_occurrence_event)
                
    except Exception as e: # Catch any error during rrule processing.
        logger.error(
            f"Error generating monthly occurrences for Rule ID '{change_rule.change_id}' "
            f"(PortfolioID '{change_rule.portfolio_id}', Rule Start '{change_rule.change_date}') "
            f"for target month {target_year}-{target_month}: {e}", 
            exc_info=True # Log full traceback for debugging.
        )

    logger.debug(f"Generated {len(occurrences_in_target_month)} occurrences for rule '{change_rule.change_id}' in {target_year}-{target_month}.")
    return occurrences_in_target_month

# The _expand_single_recurring_change function is marked as DEPRECATED in its docstring.
# It's kept for reference or testing of rrule parameter logic, as it's similar to parts of
# get_occurrences_for_month, but it's not the primary function for monthly generation anymore.
def _expand_single_recurring_change(
    change: PlannedFutureChange,
    projection_start_date: datetime.date,
    projection_end_date: datetime.date
) -> List[PlannedFutureChange]:
    """
    DEPRECATED: Expands a single recurring PlannedFutureChange into its specific occurrences.

    This function was used to pre-calculate all occurrences of a recurring rule
    over an entire projection period. It is kept for reference or testing of rrule logic
    but is superseded by `get_occurrences_for_month` for on-the-fly monthly generation
    in the projection engine.

    Args:
        change: The PlannedFutureChange rule to expand.
        projection_start_date: The start date of the overall projection period.
        projection_end_date: The end date of the overall projection period.

    Returns:
        A list of non-recurring PlannedFutureChange instances, each representing
        a single occurrence of the original rule within the projection period.
    """
    occurrences: List[PlannedFutureChange] = []

    # If the change is not recurring, check if its single date falls within the projection period.
    if not change.is_recurring:
        change_event_date = change.change_date
        if isinstance(change_event_date, datetime.datetime): # Ensure it's a date object
            change_event_date = change_event_date.date()
            
        if projection_start_date <= change_event_date <= projection_end_date:
            occurrences.append(change) # Return the original one-time event if within range
        return occurrences

    # --- Construct rrule parameters for recurring changes ---
    rrule_params: Dict[str, any] = {} # Dictionary to hold parameters for rrule.rrule()
    
    frequency_details = FREQUENCY_CONFIG.get(change.frequency)
    if not frequency_details: # Should not happen if DB/enum constraints are good
        logger.warning(
            f"Unsupported frequency type: {change.frequency} for ChangeID "
            f"'{change.change_id if change.change_id else 'N/A (draft?)'}'. Skipping this rule."
        )
        return [] # Return empty list if frequency is not supported

    rrule_params['freq'] = frequency_details["rrule_const"] # e.g., rrule.MONTHLY
    
    # Ensure dtstart (rule's start date) is a datetime object for rrule.
    dtstart_datetime = change.change_date
    if isinstance(dtstart_datetime, datetime.date) and not isinstance(dtstart_datetime, datetime.datetime):
        dtstart_datetime = datetime.datetime.combine(dtstart_datetime, datetime.datetime.min.time())
    rrule_params['dtstart'] = dtstart_datetime

    # Interval for the recurrence (e.g., every 2 weeks if interval is 2 and freq is WEEKLY).
    rrule_params['interval'] = change.interval if change.interval and change.interval > 0 else 1

    # --- Determine End Conditions for rrule ---
    # The rrule should generate dates up to the projection_end_date,
    # but also respect the rule's own end condition if it's earlier.
    # `rrule_until` will be the effective end date for rrule generation.
    rrule_until = datetime.datetime.combine(projection_end_date, datetime.datetime.max.time()) # Max time on projection end date

    if change.ends_on_type == EndsOnType.AFTER_OCCURRENCES:
        if change.ends_on_occurrences is not None and change.ends_on_occurrences > 0:
            rrule_params['count'] = change.ends_on_occurrences # rrule handles 'count' limit
        else: 
            # If ends_on_occurrences is 0, None, or negative, no occurrences should be generated.
            logger.debug(f"Rule ChangeID '{change.change_id}' ends after 0 or invalid occurrences. No events generated.")
            return [] 
    elif change.ends_on_type == EndsOnType.ON_DATE and change.ends_on_date:
        # If rule has its own specific end date, use the earlier of that or projection_end_date.
        specific_end_date_dt = change.ends_on_date
        # Ensure it's a datetime object for comparison and for rrule 'until' param.
        if isinstance(specific_end_date_dt, datetime.date) and not isinstance(specific_end_date_dt, datetime.datetime):
             specific_end_date_dt = datetime.datetime.combine(specific_end_date_dt, datetime.datetime.max.time())
        rrule_until = min(rrule_until, specific_end_date_dt)

    rrule_params['until'] = rrule_until # Set the calculated 'until' parameter for rrule
    
    # Apply frequency-specific parameters (e.g., byweekday for weekly, bymonthday for monthly).
    param_func = frequency_details.get("param_func")
    if param_func: # If a specific applicator function exists for this frequency
        param_func(change, rrule_params) # Modifies rrule_params in place

    # --- Generate Occurrences using rrule ---
    try:
        rule = rrule.rrule(**rrule_params) # Create the rrule object
        
        # Define projection window as datetime objects for rrule.between().
        proj_start_dt = datetime.datetime.combine(projection_start_date, datetime.datetime.min.time())
        
        # Get the original start date of the rule (change.change_date) as a date object for filtering.
        original_change_rule_start_date = change.change_date
        if isinstance(original_change_rule_start_date, datetime.datetime):
            original_change_rule_start_date = original_change_rule_start_date.date()

        # Generate occurrences within the intersection of the rule's effective period and the projection window.
        # `inc=True` includes start and end dates in `between` if they match.
        for occ_datetime in rule.between(proj_start_dt, rrule_params['until'], inc=True):
            occurrence_date = occ_datetime.date() # Convert generated datetime to date
            
            # Final filter: ensure the occurrence is not before the rule's original start date
            # (rrule might generate dates before dtstart if dtstart is in the past relative to window),
            # and also ensure it's within the overall projection_end_date.
            if original_change_rule_start_date <= occurrence_date <= projection_end_date:
                # Create a new PlannedFutureChange instance for this specific occurrence.
                # This instance is marked as non-recurring.
                new_occurrence = _create_one_time_change_from_rule(change, occurrence_date)
                occurrences.append(new_occurrence)
                
    except Exception as e: # Catch any error during rrule processing.
        logger.error(
            f"Error generating occurrences for ChangeID '{change.change_id if change.change_id else 'N/A'}': {e}", 
            exc_info=True # Log full exception traceback
        )

    return occurrences

# expand_and_group_changes is removed as its functionality is now handled on-the-fly
# by the projection_engine.py using get_occurrences_for_month.
# Original code for expand_and_group_changes was here. 