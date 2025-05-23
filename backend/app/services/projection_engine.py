"""
Service module for calculating long-term portfolio value projections.

This engine orchestrates the projection process by:
1. Fetching portfolio data (assets, planned changes).
2. Initializing the projection state (starting asset values, monthly returns).
3. Iterating month by month, calculating changes due to growth, cash flows,
   and reallocations (though reallocations are not explicitly handled in the
   current monthly calculation loop but would be part of a more complex asset
   value update).
4. Utilizing helper services for recurrence calculations (`recurrence_service`),
   monthly value updates (`monthly_calculator`), and initial state setup
   (`projection_initializer`).

The main function `calculate_projection` can handle both projections based on
saved portfolio data and previews that include 'draft' (unsaved) planned changes.
"""
import datetime
from dateutil.relativedelta import relativedelta
from decimal import Decimal
import logging
from typing import Optional, List, Dict, Tuple

# Import models from app.models
from app.models import Portfolio, Asset, PlannedFutureChange
# Import db instance from the app package
from app import db
from sqlalchemy.orm import joinedload

# Import the Enums!
from app.enums import ChangeType, EndsOnType
# Import Pydantic schema for type hinting draft changes
from app.schemas.portfolio_schemas import PlannedChangeCreateSchema

# Import the new recurrence service
from .recurrence_service import get_occurrences_for_month
# Import the new monthly calculator service
from .monthly_calculator import calculate_single_month
# Import the new projection initializer service
from .projection_initializer import initialize_projection

logger = logging.getLogger(__name__) # Define logger

# Default annual return assumptions were previously here but are better placed
# within specific return strategies (e.g., in `return_strategies.py`).

# --- Helper Functions ---

# Note: Recurrence helper functions (`is_monthly_match`, `is_weekly_match`, etc.)
# have been moved to `recurrence_service.py`.

def _fetch_portfolio_and_assets(portfolio_id: int) -> Tuple[Portfolio, List[Asset]]:
    """Fetches a portfolio and its associated assets from the database.

    Eagerly loads assets and planned changes associated with the portfolio
    to optimize database access if these related entities are needed later.

    Args:
        portfolio_id: The ID of the portfolio to fetch.

    Returns:
        A tuple containing the Portfolio object and a list of its Asset objects.

    Raises:
        ValueError: If no portfolio is found for the given `portfolio_id`.
    """
    logger.debug(f"Attempting to fetch portfolio and assets for PortfolioID '{portfolio_id}'.")
    # Query for the portfolio, using joinedload to eager-load related assets and planned_changes.
    # This can be more efficient than lazy loading if these relations are consistently accessed.
    portfolio = Portfolio.query.options(
        joinedload(Portfolio.assets), 
        joinedload(Portfolio.planned_changes) # Eager load planned changes, useful for non-draft projections.
    ).get(portfolio_id)

    if not portfolio:
        logger.error(f"Portfolio with ID '{portfolio_id}' not found.")
        raise ValueError(f"Portfolio with id {portfolio_id} not found.")

    logger.debug(f"Successfully fetched Portfolio '{portfolio.name}' (ID: {portfolio_id}) with {len(portfolio.assets)} assets "
                 f"and {len(portfolio.planned_changes)} planned changes.")
    return portfolio, portfolio.assets # Return the portfolio and its already loaded assets list


# Note: Monthly calculation functions like `_apply_monthly_growth`, 
# `_calculate_net_monthly_change`, `_distribute_cash_flow`, and 
# `_calculate_single_month` have been moved to `monthly_calculator.py`.


# --- Main Projection Function ---

def calculate_projection(
    portfolio_id: int, 
    start_date: datetime.date, 
    end_date: datetime.date, 
    initial_total_value: Optional[Decimal], # Optional initial value for flexibility
    draft_changes_input: Optional[List[PlannedChangeCreateSchema]] = None # For previewing with unsaved changes
) -> List[Tuple[datetime.date, Decimal]]:
    """Calculates the future value projection for a portfolio.

    This function orchestrates the entire projection process:
    1. Fetches portfolio and asset data.
    2. Determines the set of planned changes to use (saved or draft).
    3. Initializes the projection state (asset values, returns, total value).
    4. Iterates month by month:
        a. Generates occurrences of planned changes for the current month.
        b. Calculates the portfolio's value at month-end using `calculate_single_month`.
    5. Returns a list of (date, total_value) tuples for each month-end.

    Args:
        portfolio_id: The ID of the portfolio.
        start_date: The date to begin the projection.
        end_date: The date to end the projection.
        initial_total_value: The portfolio's total value at `start_date`. If None,
                             it might be derived from asset allocations if supported by initializer.
        draft_changes_input: An optional list of Pydantic schemas representing unsaved
                             planned changes to include in the projection (for previews).

    Returns:
        A list of (date, Decimal total_value) tuples for each month-end in the projection period.

    Raises:
        ValueError: If the portfolio with `portfolio_id` is not found.
    """
    logger.info(f"Starting projection calculation for PortfolioID '{portfolio_id}' from {start_date} to {end_date}. "
                f"Initial Total Value: {initial_total_value}, Draft Changes Provided: {draft_changes_input is not None}.")
    
    # --- 1. Fetch Portfolio & Assets --- 
    # This retrieves the portfolio and its associated assets.
    # `planned_changes` are also loaded if `draft_changes_input` is None.
    portfolio, assets = _fetch_portfolio_and_assets(portfolio_id)

    # --- 2. Determine Effective Planned Changes ---
    # These are the change rules (recurring or one-time) that will be processed.
    # If `draft_changes_input` is provided, use those; otherwise, use the portfolio's saved changes.
    effective_planned_changes: List[PlannedFutureChange] = [] 
    if draft_changes_input is not None:
        logger.debug(f"Using {len(draft_changes_input)} draft changes for projection.")
        # Convert Pydantic schemas (draft_changes_input) to ORM-like PlannedFutureChange instances.
        # This allows the rest of the projection logic to work with a consistent object type.
        for i, pydantic_change_schema in enumerate(draft_changes_input):
            change_data_dict = pydantic_change_schema.model_dump()
            # Ensure portfolio_id is set for draft changes if not provided in schema.
            if 'portfolio_id' not in change_data_dict or change_data_dict['portfolio_id'] is None:
                 change_data_dict['portfolio_id'] = portfolio_id
            
            temp_change_instance = PlannedFutureChange(**change_data_dict)
            # Assign a temporary, unique ID to draft changes if they don't have one.
            # This is crucial for tracking occurrences if a draft rule uses 'AFTER_OCCURRENCES'.
            if temp_change_instance.change_id is None: 
                temp_change_instance.change_id = f"draft_{i}_{id(temp_change_instance)}" # More unique temp ID
            effective_planned_changes.append(temp_change_instance)
    else:
        logger.debug(f"Using {len(portfolio.planned_changes)} saved planned changes for projection.")
        if portfolio.planned_changes: # Ensure it's not None
            effective_planned_changes = portfolio.planned_changes
    
    # --- 3. Initialize State for Tracking Recurring Rule Occurrences ---
    # `rule_generated_counts` tracks how many times a recurring rule (especially one
    # ending 'AFTER_OCCURRENCES') has already generated an event.
    # The key is the rule's ID (or temporary ID for drafts).
    rule_generated_counts: Dict[any, int] = {} 

    # --- 4. Initialize Projection State (Asset Values, Returns, Total Value) ---
    # This uses the `projection_initializer` service.
    current_asset_values, monthly_asset_returns, current_total_value = \
        initialize_projection(assets, initial_total_value)
    logger.info(f"Projection initialized. Start Date: {start_date}, Initial Total Value: {current_total_value:.2f}. "
                f"Initial Asset Values: {current_asset_values}, Monthly Asset Returns: {monthly_asset_returns}")

    # `projection_results` will store (date, total_value) tuples for each month-end.
    # Start with the initial state.
    projection_results: List[Tuple[datetime.date, Decimal]] = [(start_date, current_total_value)]

    # --- 5. Monthly Projection Loop ---
    current_date = start_date # The first day of the current month being processed.
    # `loop_end_date` is the first day of the month *after* the `end_date`.
    # The loop continues as long as `current_date` is before `loop_end_date`.
    loop_end_date = end_date.replace(day=1) + relativedelta(months=1) 
    logger.debug(f"Monthly projection loop starting. Current Date: {current_date}, Loop End Date: {loop_end_date}")

    while current_date < loop_end_date:
        # Determine the actual end date for the current month's calculation.
        # It's either the natural month-end or the projection `end_date` if it's earlier.
        month_end_date = current_date + relativedelta(months=1) - relativedelta(days=1)
        actual_month_end_for_reporting = min(month_end_date, end_date)
        logger.debug(f"Processing month starting {current_date.strftime('%Y-%m-%d')}, reporting at {actual_month_end_for_reporting.strftime('%Y-%m-%d')}. "
                     f"Current Asset Values: {current_asset_values}, Monthly Asset Returns: {monthly_asset_returns}")

        # --- Generate Occurrences of Planned Changes for the Current Month ---
        # This is done "on-the-fly" for each month to handle complex recurrence rules correctly.
        actual_changes_for_this_month: List[PlannedFutureChange] = []
        for rule in effective_planned_changes:
            # Use the rule's persistent ID or the temporary ID assigned to drafts for tracking.
            rule_key = rule.change_id # Assumes change_id is now reliably set for drafts too.
            
            # Get all potential occurrences of this rule within the current month.
            candidate_occurrences = get_occurrences_for_month(rule, current_date.year, current_date.month)
            
            # If the rule is recurring and has an "ends after X occurrences" condition:
            if (rule.is_recurring and 
                rule.ends_on_type == EndsOnType.AFTER_OCCURRENCES and 
                rule.ends_on_occurrences is not None and 
                rule.ends_on_occurrences > 0):
                
                already_generated_count = rule_generated_counts.get(rule_key, 0)
                occurrences_still_needed = rule.ends_on_occurrences - already_generated_count
                
                if occurrences_still_needed > 0:
                    # Add only the needed number of occurrences from the candidates.
                    add_this_month = candidate_occurrences[:occurrences_still_needed]
                    actual_changes_for_this_month.extend(add_this_month)
                    rule_generated_counts[rule_key] = already_generated_count + len(add_this_month)
            else:
                # For non-limited recurring rules or one-time changes.
                actual_changes_for_this_month.extend(candidate_occurrences)
        logger.debug(f"Generated {len(actual_changes_for_this_month)} change events for month {current_date.strftime('%Y-%m')}.")
        # --- End of On-the-Fly Change Generation ---

        # Calculate asset values and total value for the end of this month.
        next_asset_values, next_total_value = calculate_single_month(
            current_date, # Represents the start of the month being calculated
            current_asset_values,
            monthly_asset_returns,
            actual_changes_for_this_month # List of specific change events for this month
        )

        # Update current state for the next iteration.
        current_asset_values = next_asset_values
        current_total_value = next_total_value
        
        # Store the result for this month-end.
        projection_results.append((actual_month_end_for_reporting, current_total_value))
        logger.debug(f"End of month {current_date.strftime('%Y-%m')}: Total Value = {current_total_value:.2f}")

        # Move to the first day of the next month.
        current_date += relativedelta(months=1)

        # If the reported month-end has reached or passed the overall projection end_date, stop.
        if actual_month_end_for_reporting >= end_date:
             logger.debug(f"Reached or passed projection end date ({end_date}). Stopping loop.")
             break
    
    logger.info(f"Projection calculation finished for PortfolioID '{portfolio_id}'. Generated {len(projection_results)} data points.")
    # Ensure all values in the final result are Decimals for consistency.
    return [(date_val, Decimal(value_val)) for date_val, value_val in projection_results]
