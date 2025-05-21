"""
Service module for initializing the state of a portfolio projection.

This module is responsible for setting up the initial conditions required
to start a portfolio projection calculation. This includes:
1. Determining the starting value for each asset in the portfolio based on
   their defined fixed values or percentage allocations, and an optional
   override for the total portfolio value.
2. Calculating the expected monthly return rate for each asset using
   a strategy pattern based on asset type.
3. Establishing the definitive total starting value for the projection.
"""
from decimal import Decimal, InvalidOperation
import logging
from typing import List, Dict, Tuple, Optional # Added Optional

from app.models import Asset # SQLAlchemy model for assets
from app.enums import AssetType # Enum for asset types
# Import the return strategy getter function from the .return_strategies module.
# The `_` prefix suggests it's primarily for internal use within this service layer.
from .return_strategies import get_return_strategy as _get_return_strategy

# Initialize a logger for this module.
logger = logging.getLogger(__name__)

def _initialize_asset_values(
    assets: List[Asset], 
    initial_total_value_override: Optional[Decimal]
) -> Tuple[Dict[int, Decimal], Decimal]:
    """Initializes individual asset values based on their DB allocations and an optional total value override.

    The process is two-pass:
    1. Assets with `allocation_value` (fixed value) are assigned their values directly.
       The sum of these fixed values is calculated.
    2. Assets with `allocation_percentage` are processed. The total value used for
       these percentage calculations is determined by, in order of priority:
       a. `initial_total_value_override` (if provided).
       b. The sum of fixed values calculated in pass 1 (if no override).
       c. Zero, if neither of the above is available or applicable.

    Args:
        assets: A list of Asset ORM objects in the portfolio.
        initial_total_value_override: An optional Decimal value to use as the total
                                      portfolio value for initializing percentage-based allocations.

    Returns:
        A tuple containing:
            - current_asset_values (Dict[int, Decimal]): A dictionary mapping asset_id to
                                                         its initialized Decimal value.
            - final_calculated_total (Decimal): The sum of all initialized asset values.
                                                This may differ from `initial_total_value_override`
                                                if fixed values dictate a different sum or if
                                                allocations don't sum to 100% of the override.
    """
    logger.debug(f"Initializing asset values. Override total: {initial_total_value_override}")
    current_asset_values: Dict[int, Decimal] = {} # Stores asset_id -> initialized_value
    calculated_total_from_fixed_values = Decimal('0.0') # Sum of values from assets with fixed allocation_value
    assets_with_percentage_only: List[Asset] = [] # Stores assets to process in the second pass

    # First pass: Process assets with fixed `allocation_value`.
    for asset in assets:
        if asset.allocation_value is not None: # Asset has a fixed monetary value defined
            try:
                value = Decimal(asset.allocation_value)
                current_asset_values[asset.asset_id] = value
                calculated_total_from_fixed_values += value
            except InvalidOperation:
                logger.error(
                    f"Invalid allocation_value '{asset.allocation_value}' for AssetID '{asset.asset_id}'. "
                    "Setting its initial value to 0."
                )
                current_asset_values[asset.asset_id] = Decimal('0.0')
        elif asset.allocation_percentage is not None: # Asset has percentage allocation, defer to second pass
            assets_with_percentage_only.append(asset)
            # Initialize to 0; will be overwritten if percentage calculation is possible.
            current_asset_values[asset.asset_id] = Decimal('0.0') 
        else:
            # Asset has neither fixed value nor percentage. Initialize to 0.
            current_asset_values[asset.asset_id] = Decimal('0.0')
            logger.warning(
                f"AssetID '{asset.asset_id}' has neither allocation_value nor allocation_percentage. "
                "Initialized to value 0."
            )
    logger.debug(f"Pass 1 (fixed values): Sum = {calculated_total_from_fixed_values}. Assets with % only: {len(assets_with_percentage_only)}")

    # Determine the definitive total value to use for calculating percentage-based allocations.
    # Priority: Override > Sum of fixed values. If neither, effectively zero.
    definitive_total_for_percentages = initial_total_value_override 
    if definitive_total_for_percentages is None: # No override provided
        definitive_total_for_percentages = calculated_total_from_fixed_values
        logger.debug(f"Using sum of fixed values ({calculated_total_from_fixed_values}) as definitive total for percentages.")
    else: # Override was provided
        logger.debug(f"Using override total ({initial_total_value_override}) as definitive total for percentages.")
    
    # Second pass: Apply percentage allocations for relevant assets.
    if definitive_total_for_percentages > Decimal('0.0'):
        logger.debug(f"Pass 2 (percentage values): Using definitive total {definitive_total_for_percentages}.")
        for asset in assets_with_percentage_only:
            # This check is somewhat redundant as the list is populated with such assets, but safe.
            if asset.allocation_percentage is not None: 
                try:
                    # Calculate value based on percentage of the definitive total.
                    # asset.allocation_percentage is stored as, e.g., 50 for 50%.
                    percentage_value = (Decimal(asset.allocation_percentage) / Decimal('100')) * definitive_total_for_percentages
                    current_asset_values[asset.asset_id] = percentage_value
                except InvalidOperation:
                    logger.error(
                        f"Invalid allocation_percentage '{asset.allocation_percentage}' for AssetID '{asset.asset_id}'. "
                        "Setting its initial value (from percentage) to 0."
                    )
                    current_asset_values[asset.asset_id] = Decimal('0.0') # Fallback for this asset
    elif len(assets_with_percentage_only) > 0:
        # Log a warning if percentage allocations cannot be calculated due to zero/negative total.
        logger.warning(
            "Cannot calculate percentage-based allocations because the definitive total portfolio value "
            f"is zero or negative ({definitive_total_for_percentages}). Percentage-based assets will remain at 0 value."
        )

    # Final sum of all initialized asset values.
    final_calculated_total = sum(current_asset_values.values())
    logger.debug(f"Asset values initialized. Final calculated total from assets: {final_calculated_total:.2f}")
    return current_asset_values, final_calculated_total

def _calculate_all_monthly_asset_returns(assets: List[Asset]) -> Dict[int, Decimal]:
    """Calculates the expected monthly return rate for each asset.

    It uses a strategy pattern (`_get_return_strategy`) based on the asset's type
    (e.g., STOCK, BOND, REAL_ESTATE) to determine how to calculate its return.
    If an asset type is unrecognized or a calculation error occurs for an asset,
    its monthly return is defaulted to 0.

    Args:
        assets: A list of Asset ORM objects.

    Returns:
        Dict[int, Decimal]: A dictionary mapping asset_id to its calculated
                            Decimal monthly return rate (e.g., 0.005 for 0.5% monthly).
    """
    logger.debug("Calculating monthly returns for all assets.")
    monthly_asset_returns: Dict[int, Decimal] = {}
    for asset in assets:
        try:
            asset_enum_type = asset.asset_type # This should be an AssetType Enum member
            
            # Ensure asset_enum_type is correctly an AssetType Enum instance.
            # This handles cases where it might be a string from less controlled data sources,
            # though from DB it should be the correct enum type if using SQLAlchemy enums properly.
            if not isinstance(asset_enum_type, AssetType):
                try:
                    # Attempt to convert string representation to Enum member.
                    asset_enum_type = AssetType[str(asset_enum_type)] 
                except KeyError:
                    logger.error(
                        f"AssetID '{asset.asset_id}' has an unrecognized asset type: '{asset_enum_type}'. "
                        "Cannot determine return strategy. Defaulting its monthly return to 0."
                    )
                    monthly_asset_returns[asset.asset_id] = Decimal('0.0')
                    continue # Skip to next asset
            
            # Get the appropriate return calculation strategy for the asset type.
            # The `_get_return_strategy` is expected to handle unknown types gracefully if AssetType enum is exhaustive.
            strategy = _get_return_strategy(asset_enum_type) 
            monthly_return = strategy.calculate_monthly_return(asset) # Delegate to strategy
            monthly_asset_returns[asset.asset_id] = monthly_return
            logger.debug(f"AssetID '{asset.asset_id}' ({asset.name_or_ticker}), Type '{asset_enum_type.value}': Monthly return {monthly_return:.6f}")
            
        except Exception as e: # Catch-all for any error during strategy selection or calculation
            logger.exception( # Use logger.exception to include stack trace for unexpected errors
                f"Error calculating monthly return for AssetID '{asset.asset_id}' ({asset.name_or_ticker}) "
                f"via strategy. Error: {e}. Setting its monthly return to 0."
            )
            monthly_asset_returns[asset.asset_id] = Decimal('0.0') # Default to 0 on error
            
    logger.debug(f"Monthly returns calculated for {len(monthly_asset_returns)} assets.")
    return monthly_asset_returns

def initialize_projection(
    assets: List[Asset], 
    initial_total_value_override: Optional[Decimal]
) -> Tuple[Dict[int, Decimal], Dict[int, Decimal], Decimal]:
    """Initializes and returns the core components for starting a portfolio projection.

    This orchestrator function calls helpers to:
    1. Initialize the starting monetary value for each asset.
    2. Calculate the expected monthly return rate for each asset.
    3. Determine the definitive total starting value of the portfolio for the projection.

    Args:
        assets: A list of Asset ORM objects in the portfolio.
        initial_total_value_override: An optional Decimal value that, if provided,
                                      overrides any sum calculated from individual asset
                                      allocations as the projection's starting total value.
                                      It also influences how percentage-based asset
                                      allocations are initialized.
    Returns:
        A tuple containing:
            - current_asset_values (Dict[int, Decimal]): Initial values for each asset.
            - monthly_asset_returns (Dict[int, Decimal]): Expected monthly return rates for assets.
            - projection_start_total_value (Decimal): The definitive total value to begin
                                                      the projection with.
    """
    logger.info("Initializing projection state.")
    
    # 1. Initialize individual asset values based on their fixed/percentage allocations
    #    and the optional total value override.
    #    `final_calculated_total_from_assets` is the sum of these initialized asset values.
    current_asset_values, final_calculated_total_from_assets = _initialize_asset_values(
        assets, initial_total_value_override
    )

    # 2. Calculate expected monthly (decimal) returns for each asset based on their type and data.
    monthly_asset_returns = _calculate_all_monthly_asset_returns(assets)

    # 3. Determine the definitive starting total value for the projection.
    projection_start_total_value: Decimal
    if initial_total_value_override is not None:
        # If an override is provided, it takes precedence as the projection's starting total.
        projection_start_total_value = initial_total_value_override
        
        # Log a warning if the sum of individually calculated asset values
        # significantly differs from the provided override total. This might indicate
        # inconsistencies in how the portfolio is defined (e.g., allocations don't sum to 100%
        # of the override, or fixed values conflict with the override).
        # Using a small relative tolerance (e.g., 1%) or an absolute tolerance for small values.
        # max(Decimal('1.0'), ...) handles cases where override might be very small or zero to avoid large tolerance.
        discrepancy_tolerance = Decimal('0.01') * max(Decimal('1.0'), initial_total_value_override)
        if abs(final_calculated_total_from_assets - initial_total_value_override) > discrepancy_tolerance:
            logger.warning(
                f"The sum of initialized asset values ({final_calculated_total_from_assets:.2f}) differs significantly "
                f"from the provided initial_total_value_override ({initial_total_value_override:.2f}). "
                f"The override value will be used as the projection's starting total value. "
                "Individual asset values might not sum perfectly to this override if fixed allocations exist."
            )
    else:
        # If no override is provided, the sum of the initialized asset values becomes
        # the projection's starting total value.
        projection_start_total_value = final_calculated_total_from_assets
    
    logger.info(
        f"Projection initialized. Starting Total Value: {projection_start_total_value:.2f}. "
        f"Number of assets: {len(assets)}."
    )
    return current_asset_values, monthly_asset_returns, projection_start_total_value 