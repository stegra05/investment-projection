import datetime
from decimal import Decimal, InvalidOperation
from typing import List, Dict, Tuple, Callable
import logging # Added logging
from app.models import PlannedFutureChange # Assuming PlannedFutureChange is used here
from app.enums import ChangeType # Assuming ChangeType is used here

logger = logging.getLogger(__name__) # Added logger instantiation

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

# --- Cash Flow Effect Handlers for Change Types ---
CashFlowEffectHandler = Callable[[Decimal], Decimal]

def _handle_contribution_effect(amount: Decimal) -> Decimal:
    return amount

def _handle_withdrawal_effect(amount: Decimal) -> Decimal:
    return -amount

def _handle_dividend_effect(amount: Decimal) -> Decimal:
    # Assuming dividends are treated as positive cash inflow to the portfolio total
    return amount

def _handle_interest_effect(amount: Decimal) -> Decimal:
    # Assuming interest is treated as positive cash inflow to the portfolio total
    return amount

# Configuration for how different change types affect net cash flow
# Types not listed (e.g., REALLOCATION) are assumed to have no direct net cash flow effect here.
CHANGE_TYPE_CASH_FLOW_EFFECTS: Dict[ChangeType, CashFlowEffectHandler] = {
    ChangeType.CONTRIBUTION: _handle_contribution_effect,
    ChangeType.WITHDRAWAL: _handle_withdrawal_effect,
    ChangeType.DIVIDEND: _handle_dividend_effect, 
    ChangeType.INTEREST: _handle_interest_effect,
}

def _calculate_net_monthly_change(
    monthly_changes: list[PlannedFutureChange]
) -> Decimal:
    """Calculates the net cash flow for the month using a configurable approach."""
    net_change_month = Decimal('0.0')

    for change in monthly_changes:
        try:
            change_amount = Decimal(change.amount) # Ensure Decimal
        except (InvalidOperation, TypeError) as e:
            logger.warning(f"Invalid amount '{change.amount}' for change type {change.change_type} on {change.change_date}. Skipping this amount. Error: {e}")
            continue
            
        handler = CHANGE_TYPE_CASH_FLOW_EFFECTS.get(change.change_type)
        if handler:
            net_change_month += handler(change_amount)
        # else: change types not in the map (e.g., REALLOCATION) have no direct cash flow impact here
            # logger.debug(f"Change type {change.change_type} has no defined cash flow effect for net monthly change calculation.")

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
                logger.warning(f"Invalid operation during cash flow distribution for asset {asset_id}. Using pre-cashflow value.")
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
             logger.warning(f"Portfolio value before cash flow at {current_date.strftime('%Y-%m')} was {total_value_pre_cashflow:.2f}. "
                   f"Applied net change {net_change_month:.2f} directly to total.")

    return value_i_final, current_total_value_month


def calculate_single_month(
    current_date: datetime.date,
    current_asset_values: dict[int, Decimal],
    monthly_asset_returns: dict[int, Decimal],
    monthly_changes: list[PlannedFutureChange]
) -> tuple[dict[int, Decimal], Decimal]: # Added return type hint
    """Calculates the projection for a single month by orchestrating sub-steps."""

    # 1. Apply Asset Growth
    value_i_pre_cashflow, total_value_pre_cashflow = _apply_monthly_growth(
        current_asset_values, monthly_asset_returns
    )

    # 2. Calculate Net Cash Flow for the Month
    net_change_month = _calculate_net_monthly_change(
        monthly_changes
    )

    # 3. Distribute Cash Flow and Finalize Monthly Values
    value_i_final, current_total_value_month = _distribute_cash_flow(
        current_date, # Pass date for logging
        value_i_pre_cashflow,
        total_value_pre_cashflow,
        net_change_month
    )

    return value_i_final, current_total_value_month 