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

# --- Default Annual Return Assumptions (Placeholder) ---
# Expressed as Decimal percentages (e.g., 7.0 for 7%)
# Moved inside the StandardAnnualReturnStrategy where it's used
# DEFAULT_ANNUAL_RETURNS = { ... }


# --- Helper Functions ---

# Recurrence helper functions MOVED to recurrence_service.py


def _fetch_portfolio_and_assets(portfolio_id: int) -> Tuple[Portfolio, List[Asset]]:
    """Fetches portfolio and its assets."""
    portfolio = Portfolio.query.options(
        joinedload(Portfolio.assets),
        joinedload(Portfolio.planned_changes) # Keep loading planned_changes for non-preview path
    ).get(portfolio_id)

    if not portfolio:
        raise ValueError(f"Portfolio with id {portfolio_id} not found.")

    return portfolio, portfolio.assets


# Monthly calculation functions MOVED to monthly_calculator.py
# def _apply_monthly_growth(...):
# ... (entire function removed)
# def _calculate_net_monthly_change(...):
# ... (entire function removed)
# def _distribute_cash_flow(...):
# ... (entire function removed)
# def _calculate_single_month(...):
# ... (entire function removed)


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
        # Create unique IDs for draft changes if they don't have one, for state tracking
        # This assumes draft_changes_input Pydantic models might not have an ID yet.
        # For simplicity, we use object id() as a key for draft changes for now.
        # A more robust solution might involve assigning temporary unique string IDs.
        for i, pydantic_change_schema in enumerate(draft_changes_input):
            change_data_dict = pydantic_change_schema.model_dump()
            if 'portfolio_id' not in change_data_dict or change_data_dict['portfolio_id'] is None:
                 change_data_dict['portfolio_id'] = portfolio_id
            # If the schema has an id field and it's None, consider how to handle for rule_generated_counts keying
            # For now, PlannedFutureChange instances from Pydantic will be used as objects.
            temp_change_instance = PlannedFutureChange(**change_data_dict)
            # Assign a temporary ID if it's a draft and doesn't have one for tracking AFTER_OCCURRENCES
            if temp_change_instance.change_id is None: # Assuming change_id can be None for new drafts
                temp_change_instance.change_id = f"draft_{i}" # Create a temporary unique ID
            effective_planned_changes.append(temp_change_instance)
    else:
        if portfolio.planned_changes:
            effective_planned_changes = portfolio.planned_changes
    
    # --- 3. Prepare & Expand Changes for Projection --- (This step is now done IN-LOOP)
    # changes_by_month = expand_and_group_changes(effective_planned_changes, start_date, end_date)

    # Initialize a dictionary to keep track of generated counts for rules with AFTER_OCCURRENCES
    rule_generated_counts: Dict[any, int] = {}
    # The key for this dict ideally is change_rule.change_id. Drafts need a temp stable ID.

    # --- 4. Initialize Projection State (using 'assets' from step 1) ---
    current_asset_values, monthly_asset_returns, current_total_value = \
        initialize_projection(assets, initial_total_value)

    projection_results = [(start_date, current_total_value)]

    current_date = start_date
    loop_end_date = end_date.replace(day=1) + relativedelta(months=1)

    # --- 5. Monthly Projection Loop ---
    while current_date < loop_end_date:
        month_end_date = current_date + relativedelta(months=1) - relativedelta(days=1)
        actual_month_end = min(month_end_date, end_date)

        # --- Generate changes for the current month on-the-fly ---
        actual_changes_for_this_month: List[PlannedFutureChange] = []
        for rule in effective_planned_changes:
            # Use rule.change_id as key if it exists and is persistent.
            # For draft changes, we assigned a temporary unique change_id.
            rule_key = rule.change_id if rule.change_id is not None else id(rule)

            candidate_occurrences = get_occurrences_for_month(rule, current_date.year, current_date.month)
            
            if rule.is_recurring and rule.ends_on_type == EndsOnType.AFTER_OCCURRENCES and rule.ends_on_occurrences is not None and rule.ends_on_occurrences > 0:
                already_generated = rule_generated_counts.get(rule_key, 0)
                needed = rule.ends_on_occurrences - already_generated
                
                if needed > 0:
                    to_add_this_month = candidate_occurrences[:needed]
                    actual_changes_for_this_month.extend(to_add_this_month)
                    rule_generated_counts[rule_key] = already_generated + len(to_add_this_month)
            else:
                actual_changes_for_this_month.extend(candidate_occurrences)
        # --- End of on-the-fly change generation for the month ---

        next_asset_values, next_total_value = calculate_single_month(
            current_date,
            current_asset_values,
            monthly_asset_returns,
            actual_changes_for_this_month # Pass the list of changes for the current month
        )

        current_asset_values = next_asset_values
        current_total_value = next_total_value
        projection_results.append((actual_month_end, current_total_value))

        current_date += relativedelta(months=1)

        if actual_month_end >= end_date:
             break

    return [(date, Decimal(value)) for date, value in projection_results]
