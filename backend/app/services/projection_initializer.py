from decimal import Decimal, InvalidOperation
import logging
from typing import List, Dict, Tuple # Added Tuple back

from app.models import Asset
from app.enums import AssetType
# Assuming return_strategies is in the same directory or accessible
from .return_strategies import get_return_strategy as _get_return_strategy

logger = logging.getLogger(__name__)

def _initialize_asset_values(assets: list[Asset], initial_total_value_override: Decimal | None) -> tuple[Dict[int, Decimal], Decimal]:
    """Initializes individual asset values based on fixed values and/or percentages of a total."""
    current_asset_values: Dict[int, Decimal] = {}
    calculated_total_from_fixed_values = Decimal('0.0')
    assets_with_percentage_only: List[Asset] = []

    # First pass: Apply fixed allocation_value and sum them up
    for asset in assets:
        if asset.allocation_value is not None:
            try:
                value = Decimal(asset.allocation_value)
                current_asset_values[asset.asset_id] = value
                calculated_total_from_fixed_values += value
            except InvalidOperation:
                logger.error(f"Invalid allocation_value '{asset.allocation_value}' for asset {asset.asset_id}. Setting to 0.")
                current_asset_values[asset.asset_id] = Decimal('0.0')
        elif asset.allocation_percentage is not None:
            # If only percentage is given, save for second pass
            assets_with_percentage_only.append(asset)
            current_asset_values[asset.asset_id] = Decimal('0.0') # Initialize to 0, will be overwritten
        else:
            # No allocation info, initialize to 0
            current_asset_values[asset.asset_id] = Decimal('0.0')
            logger.warning(f"Asset {asset.asset_id} has neither allocation_value nor allocation_percentage. Initialized to 0.")

    # Determine the definitive total to use for percentage calculations
    # Priority: 1. initial_total_value_override, 2. sum of fixed values, 3. zero if neither exists
    definitive_total_for_percentages = initial_total_value_override 
    if definitive_total_for_percentages is None:
        definitive_total_for_percentages = calculated_total_from_fixed_values
    
    # Second pass: Apply percentage allocations if applicable
    if definitive_total_for_percentages > Decimal('0.0'):
        for asset in assets_with_percentage_only:
            if asset.allocation_percentage is not None: # Should always be true due to how list was populated
                try:
                    percentage_value = (Decimal(asset.allocation_percentage) / Decimal('100')) * definitive_total_for_percentages
                    current_asset_values[asset.asset_id] = percentage_value
                except InvalidOperation:
                    logger.error(f"Invalid allocation_percentage '{asset.allocation_percentage}' for asset {asset.asset_id}. Setting to 0.")
                    current_asset_values[asset.asset_id] = Decimal('0.0')
    elif len(assets_with_percentage_only) > 0:
        logger.warning(
            "Cannot calculate percentage-based allocations because the definitive total portfolio value is zero or negative. "
            "Percentage-based assets will remain at 0."
        )

    # Final sum of all allocated values
    final_calculated_total = sum(current_asset_values.values())
    return current_asset_values, final_calculated_total

def _calculate_all_monthly_asset_returns(assets: list[Asset]) -> Dict[int, Decimal]:
    """Calculates the expected monthly return for each asset using a strategy pattern."""
    monthly_asset_returns: Dict[int, Decimal] = {}
    for asset in assets:
        try:
            asset_enum_type = asset.asset_type
            if not isinstance(asset_enum_type, AssetType):
                try:
                    asset_enum_type = AssetType[str(asset_enum_type)] 
                except KeyError:
                    logger.error(f"Asset {asset.asset_id} has an unrecognized asset type '{asset_enum_type}'. Cannot determine return strategy.")
                    monthly_asset_returns[asset.asset_id] = Decimal('0.0')
                    continue
            
            strategy = _get_return_strategy(asset_enum_type) # type: ignore[arg-type]
            monthly_return = strategy.calculate_monthly_return(asset)
            monthly_asset_returns[asset.asset_id] = monthly_return
        except Exception:
            logger.exception(f"Error calculating monthly return for asset {asset.asset_id} ({asset.name_or_ticker}) via strategy. Setting return to 0.")
            monthly_asset_returns[asset.asset_id] = Decimal('0.0')
    return monthly_asset_returns

def initialize_projection(assets: list[Asset], initial_total_value_override: Decimal | None) -> tuple[Dict[int, Decimal], Dict[int, Decimal], Decimal]:
    """Initializes asset values, monthly returns, and the final starting total value for the projection."""
    
    # 1. Initialize individual asset values based on their fixed/percentage allocations
    current_asset_values, final_calculated_total_from_assets = _initialize_asset_values(
        assets, initial_total_value_override
    )

    # 2. Calculate expected monthly returns for each asset
    monthly_asset_returns = _calculate_all_monthly_asset_returns(assets)

    # 3. Determine the definitive starting total value for the projection
    # This considers an override, the sum of asset values, and logs discrepancies.
    projection_start_total_value: Decimal
    if initial_total_value_override is not None:
        # If an override is provided, it takes precedence. 
        # Warn if it significantly differs from the sum of calculated asset values.
        # Using a small relative tolerance or absolute if total is small.
        tolerance = Decimal('0.01') * max(Decimal('1.0'), initial_total_value_override)
        if abs(final_calculated_total_from_assets - initial_total_value_override) > tolerance:
            logger.warning(
                f"The sum of initialized asset values ({final_calculated_total_from_assets:.2f}) differs significantly "
                f"from the provided initial_total_value_override ({initial_total_value_override:.2f}). "
                f"The override value will be used as the projection's starting total."
            )
        projection_start_total_value = initial_total_value_override
    else:
        # If no override, the sum of the initialized asset values is the starting total.
        projection_start_total_value = final_calculated_total_from_assets

    return current_asset_values, monthly_asset_returns, projection_start_total_value 