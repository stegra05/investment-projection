"""
Service module for calculating single-month portfolio projections.

This module contains functions to apply monthly growth to assets, calculate
net cash flows from planned changes, distribute these cash flows proportionally
across assets, and orchestrate these steps to determine the portfolio's state
at the end of a single month.
"""
import datetime
from decimal import Decimal, InvalidOperation
from typing import List, Dict, Tuple, Callable
import logging # Added logging
from app.models import PlannedFutureChange # Assuming PlannedFutureChange is used here
from app.enums import ChangeType # Assuming ChangeType is used here

# Initialize a logger for this module. This is standard practice for logging within applications.
logger = logging.getLogger(__name__) 

def _apply_monthly_growth(
    current_asset_values: Dict[int, Decimal], # Asset ID -> Current Value
    monthly_asset_returns: Dict[int, Decimal] # Asset ID -> Monthly Return Rate (as decimal, e.g., 0.01 for 1%)
) -> Tuple[Dict[int, Decimal], Decimal]:
    """Applies expected monthly growth to each asset's current value.

    Args:
        current_asset_values: A dictionary mapping asset IDs to their current Decimal values.
        monthly_asset_returns: A dictionary mapping asset IDs to their expected monthly
                               return rates (as decimal fractions, e.g., 0.01 for 1%).

    Returns:
        A tuple containing:
            - value_i_pre_cashflow (Dict[int, Decimal]): Asset values after applying growth,
                                                         before any cash flows for the month.
            - total_value_pre_cashflow (Decimal): Total portfolio value after growth,
                                                  before cash flows.
    """
    value_i_pre_cashflow = {} # Stores individual asset values after growth
    total_value_pre_cashflow = Decimal('0.0') # Accumulates total portfolio value after growth

    for asset_id, current_value in current_asset_values.items():
        # Ensure current_value is Decimal for precision
        current_value_dec = Decimal(current_value) 
        
        # Calculate growth for the asset
        # monthly_asset_returns[asset_id] is the expected return rate for this asset for the month
        growth_amount = current_value_dec * monthly_asset_returns.get(asset_id, Decimal('0.0')) # Default to 0 if no return rate
        
        # New value after growth
        value_after_growth = current_value_dec + growth_amount
        value_i_pre_cashflow[asset_id] = value_after_growth
        
        # Add to total portfolio value
        total_value_pre_cashflow += value_after_growth
        
    logger.debug(f"Applied monthly growth. Total value before cash flow: {total_value_pre_cashflow:.2f}")
    return value_i_pre_cashflow, total_value_pre_cashflow

# --- Cash Flow Effect Handlers for Change Types ---
# Defines a type for functions that determine how a change amount affects cash flow.
CashFlowEffectHandler = Callable[[Decimal], Decimal]

# Handler functions for specific change types.
# These determine if a change amount is positive (inflow) or negative (outflow).
def _handle_contribution_effect(amount: Decimal) -> Decimal:
    """Contributions are positive cash flow."""
    return amount

def _handle_withdrawal_effect(amount: Decimal) -> Decimal:
    """Withdrawals are negative cash flow."""
    return -amount

def _handle_dividend_effect(amount: Decimal) -> Decimal:
    """Dividends are treated as positive cash inflow to the portfolio total."""
    return amount

def _handle_interest_effect(amount: Decimal) -> Decimal:
    """Interest payments are treated as positive cash inflow to the portfolio total."""
    return amount

# Configuration mapping ChangeType enums to their corresponding cash flow effect handlers.
# This allows easy extension for new change types that have a direct cash flow impact.
# Change types not listed (e.g., REALLOCATION) are assumed to have no *net* cash flow effect
# on the portfolio's total value, as they primarily shift value between assets.
CHANGE_TYPE_CASH_FLOW_EFFECTS: Dict[ChangeType, CashFlowEffectHandler] = {
    ChangeType.CONTRIBUTION: _handle_contribution_effect,
    ChangeType.WITHDRAWAL: _handle_withdrawal_effect,
    ChangeType.DIVIDEND: _handle_dividend_effect, 
    ChangeType.INTEREST: _handle_interest_effect,
}

def _calculate_net_monthly_change(
    monthly_changes: List[PlannedFutureChange] # List of change events for the current month
) -> Decimal:
    """Calculates the total net cash flow from all planned changes within a month.

    It iterates through changes, applying the configured cash flow effect for each type.
    Invalid amounts are logged and skipped.

    Args:
        monthly_changes: A list of `PlannedFutureChange` ORM objects relevant to this month.

    Returns:
        Decimal: The net sum of cash inflows (positive) and outflows (negative) for the month.
    """
    net_change_month = Decimal('0.0') # Initialize net cash flow for the month

    for change in monthly_changes:
        try:
            # Ensure the change amount is a Decimal for accurate calculations.
            change_amount = Decimal(change.amount) if change.amount is not None else Decimal('0.0')
        except (InvalidOperation, TypeError) as e:
            # Log a warning if an amount is invalid and skip it.
            logger.warning(
                f"Invalid amount '{change.amount}' for change type '{change.change_type}' "
                f"on date '{change.change_date}'. Skipping this amount. Error: {e}"
            )
            continue # Skip this change event if amount is invalid
            
        # Get the appropriate handler based on the change type.
        handler = CHANGE_TYPE_CASH_FLOW_EFFECTS.get(change.change_type)
        if handler:
            # Apply the handler to get the cash flow effect (positive/negative) and add to net.
            net_change_month += handler(change_amount)
        # else:
            # Change types not in CHANGE_TYPE_CASH_FLOW_EFFECTS (e.g., REALLOCATION)
            # are considered to have no direct impact on the net cash flow of the portfolio total.
            # logger.debug(f"Change type {change.change_type} has no defined cash flow effect for net monthly change calculation.")

    logger.debug(f"Calculated net monthly cash flow: {net_change_month:.2f}")
    return net_change_month

def _distribute_cash_flow(
    current_date: datetime.date, # For logging context
    value_i_pre_cashflow: Dict[int, Decimal], # Asset values after growth, before cash flow
    total_value_pre_cashflow: Decimal, # Total portfolio value after growth
    net_change_month: Decimal # Net cash flow for the month
) -> Tuple[Dict[int, Decimal], Decimal]:
    """Distributes the net monthly cash flow proportionally across assets.

    If the portfolio has positive value before cash flow, the net change is distributed
    according to each asset's proportion of the total value.
    If the portfolio value is zero or negative, special handling applies for positive cash inflows.

    Args:
        current_date: The current month's date (for logging).
        value_i_pre_cashflow: Asset values after growth but before this month's cash flows.
        total_value_pre_cashflow: Total portfolio value corresponding to `value_i_pre_cashflow`.
        net_change_month: The net cash flow to be distributed this month.

    Returns:
        A tuple containing:
            - value_i_final (Dict[int, Decimal]): Asset values after distributing cash flow.
            - current_total_value_month (Decimal): Final total portfolio value for the month.
    """
    value_i_final = {} # Stores final asset values after cash flow distribution
    current_total_value_month = total_value_pre_cashflow # Initialize with pre-cashflow total

    if total_value_pre_cashflow > Decimal('0.0'):
        # If portfolio has positive value, distribute cash flow proportionally.
        for asset_id, pre_cashflow_val in value_i_pre_cashflow.items():
            try:
                # Calculate this asset's share of the cash flow.
                proportion = pre_cashflow_val / total_value_pre_cashflow
                cash_flow_for_asset_i = net_change_month * proportion
                final_value_for_asset_i = pre_cashflow_val + cash_flow_for_asset_i
                value_i_final[asset_id] = final_value_for_asset_i
            except InvalidOperation as e:
                # This might happen if total_value_pre_cashflow became zero unexpectedly.
                logger.error(
                    f"Invalid operation during cash flow distribution for AssetID '{asset_id}' "
                    f"at {current_date.strftime('%Y-%m')}. Pre-cashflow value: {pre_cashflow_val}, "
                    f"Total pre-cashflow: {total_value_pre_cashflow}. Error: {e}. "
                    "Using pre-cashflow value for this asset."
                )
                value_i_final[asset_id] = pre_cashflow_val # Fallback to pre-cashflow value

        # Recalculate total from individual final asset values for precision.
        current_total_value_month = sum(value_i_final.values())
    else:
        # Handle scenarios where portfolio value before cash flow is zero or negative.
        # The net cash flow is applied directly to the total portfolio value.
        current_total_value_month = total_value_pre_cashflow + net_change_month
        value_i_final = value_i_pre_cashflow.copy() # Initialize with (likely zero) pre-cashflow values
        
        # If there's a positive net cash inflow and assets exist (even if at zero value),
        # a strategy is needed to allocate this inflow.
        # Current simple strategy: if starting from zero and adding cash, and assets are defined,
        # allocate the entire net positive cash flow to the "first" asset.
        # This might need refinement based on business rules (e.g., target allocations).
        if net_change_month > Decimal('0.0') and len(value_i_final) > 0:
            first_asset_id = next(iter(value_i_final)) # Get the ID of the first asset
            value_i_final[first_asset_id] = value_i_final.get(first_asset_id, Decimal('0.0')) + net_change_month
            # Recalculate total as asset values have changed.
            current_total_value_month = sum(value_i_final.values())
            logger.info(
                f"Portfolio value at {current_date.strftime('%Y-%m')} was {total_value_pre_cashflow:.2f}. "
                f"Positive net change {net_change_month:.2f} allocated (e.g. to first asset). "
                f"New total: {current_total_value_month:.2f}"
            )
        elif net_change_month != Decimal('0.0'):
             # If cash flow is non-zero but not positive into existing assets (e.g. withdrawal from zero),
             # log that the change primarily affected the total.
             logger.warning(
                f"Portfolio value before cash flow at {current_date.strftime('%Y-%m')} was {total_value_pre_cashflow:.2f}. "
                f"Net change {net_change_month:.2f} applied. Final total: {current_total_value_month:.2f}"
             )
    
    logger.debug(f"Distributed cash flow for {current_date.strftime('%Y-%m')}. Final total value: {current_total_value_month:.2f}")
    return value_i_final, current_total_value_month


def calculate_single_month(
    current_date: datetime.date, # The date representing the current month of calculation
    current_asset_values: Dict[int, Decimal], # Asset values at the start of the month
    monthly_asset_returns: Dict[int, Decimal], # Expected return rates for each asset for this month
    monthly_changes: List[PlannedFutureChange] # Cash flow changes occurring this month
) -> Tuple[Dict[int, Decimal], Decimal]:
    """Calculates the portfolio's asset values and total value for a single month.

    This function orchestrates the monthly calculation by:
    1. Applying growth to current asset values based on their expected monthly returns.
    2. Calculating the net cash flow from all planned changes occurring within the month.
    3. Distributing this net cash flow proportionally across the assets.

    Args:
        current_date: The date representing the month being calculated (e.g., first day of month).
        current_asset_values: Dictionary of asset IDs to their Decimal values at the month's start.
        monthly_asset_returns: Dictionary of asset IDs to their Decimal monthly return rates.
        monthly_changes: List of `PlannedFutureChange` objects for this month.

    Returns:
        A tuple containing:
            - value_i_final (Dict[int, Decimal]): Asset values at the end of the month.
            - current_total_value_month (Decimal): Total portfolio value at the end of the month.
    """
    logger.info(f"Calculating single month projection for: {current_date.strftime('%Y-%m')}")
    logger.debug(f"Starting asset values: {json.dumps({k: str(v) for k,v in current_asset_values.items()}) if current_asset_values else 'None'}")

    # Step 1: Apply expected monthly growth to assets.
    # This calculates `value_i_pre_cashflow` (individual asset values after growth)
    # and `total_value_pre_cashflow` (total portfolio value after growth).
    value_i_pre_cashflow, total_value_pre_cashflow = _apply_monthly_growth(
        current_asset_values, monthly_asset_returns
    )

    # Step 2: Calculate the net cash flow for the month from planned changes.
    # This sums up all contributions, withdrawals, dividends, etc.
    net_change_month = _calculate_net_monthly_change(
        monthly_changes # List of PlannedFutureChange objects for this month
    )

    # Step 3: Distribute the net cash flow across assets and finalize monthly values.
    # This adjusts `value_i_pre_cashflow` based on `net_change_month` to get `value_i_final`.
    value_i_final, current_total_value_month = _distribute_cash_flow(
        current_date, # Pass current_date for logging context within _distribute_cash_flow
        value_i_pre_cashflow,
        total_value_pre_cashflow,
        net_change_month
    )
    
    logger.info(f"Finished calculation for {current_date.strftime('%Y-%m')}. Final total value: {current_total_value_month:.2f}")
    logger.debug(f"Ending asset values: {json.dumps({k: str(v) for k,v in value_i_final.items()}) if value_i_final else 'None'}")
    return value_i_final, current_total_value_month 