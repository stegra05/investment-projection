from abc import ABC, abstractmethod
from decimal import Decimal, InvalidOperation
import logging # Added logging

# Assuming models and enums are accessible via app package or direct import path
# Adjust import paths if necessary based on your project structure
from app.models import Asset
from app.enums import AssetType
from app.config.return_config import DEFAULT_ANNUAL_RETURNS # Import from new config file

logger = logging.getLogger(__name__) # Added logger instantiation

# --- Return Calculation Strategy ---

class AbstractReturnCalculationStrategy(ABC):
    """Abstract base class for asset return calculation strategies."""
    @abstractmethod
    def calculate_monthly_return(self, asset: Asset) -> Decimal:
        """Calculates the expected monthly return rate for a given asset."""
        pass

class StandardAnnualReturnStrategy(AbstractReturnCalculationStrategy):
    """Calculates monthly return based on annual return (manual or default)."""

    # DEFAULT_ANNUAL_RETURNS is now imported from app.config.return_config
    # Removed the hardcoded DEFAULT_ANNUAL_RETURNS dictionary here

    def calculate_monthly_return(self, asset: Asset) -> Decimal:
        r_annual_percent = None
        # Prioritize manual return
        if asset.manual_expected_return is not None:
            try:
                r_annual_percent = Decimal(asset.manual_expected_return)
            except (InvalidOperation, TypeError):
                logger.warning(f"PortfolioID '{asset.portfolio_id}', AssetID '{asset.asset_id}': Invalid manual_expected_return. Using default.")
                asset_type = asset.asset_type
                # Ensure asset_type is an Enum member before using it as a key
                if not isinstance(asset_type, AssetType):
                    try:
                        asset_type = AssetType[str(asset_type)]
                    except KeyError:
                         logger.error(f"PortfolioID '{asset.portfolio_id}', AssetID '{asset.asset_id}': Unrecognized asset type '{asset_type}' during default return lookup.")
                         return Decimal('0.0') # Cannot determine default
                r_annual_percent = DEFAULT_ANNUAL_RETURNS.get(asset_type, Decimal('0.0'))
        else:
            asset_type = asset.asset_type
            # Ensure asset_type is an Enum member before using it as a key
            if not isinstance(asset_type, AssetType):
                try:
                    asset_type = AssetType[str(asset_type)]
                except KeyError:
                     logger.error(f"PortfolioID '{asset.portfolio_id}', AssetID '{asset.asset_id}': Unrecognized asset type '{asset_type}' during default return lookup.")
                     return Decimal('0.0') # Cannot determine default

            r_annual_percent = DEFAULT_ANNUAL_RETURNS.get(asset_type, Decimal('0.0'))
            if asset_type in [AssetType.OPTIONS, AssetType.OTHER] and r_annual_percent == Decimal('0.0') and asset.manual_expected_return is None:
                 logger.info(
                     f"PortfolioID '{asset.portfolio_id}', AssetID '{asset.asset_id}' of type '{asset_type.name}' "
                     f"is using a default annual return of 0% as no 'manual_expected_return' was provided. "
                     f"Consider providing a manual return for a more meaningful projection for these asset types."
                 )
            elif asset_type in [AssetType.OPTIONS, AssetType.OTHER] and r_annual_percent == Decimal('0.0'): # Original condition if manual_expected_return was invalid and fell back to 0
                logger.info(f"PortfolioID '{asset.portfolio_id}', AssetID '{asset.asset_id}' type '{asset_type.name}' has a default return of 0% (possibly due to invalid manual input). Projection assumes 0% growth. Provide a valid 'manual_expected_return' for custom projection.")

        r_annual = r_annual_percent / Decimal('100')

        # Calculate monthly return from annual return: (1 + R_annual)^(1/12) - 1
        monthly_return = Decimal('0.0')
        # The condition r_annual > Decimal('-1.0') (i.e., annual return > -100%) is crucial.
        # If r_annual is -1.0 (i.e., -100%), then (1 + r_annual) is 0.
        # 0 to any positive power is 0, so monthly_return would be (0)^(1/12) - 1 = -1.
        # If r_annual < -1.0 (e.g., -2.0 or -200%), (1 + r_annual) becomes negative.
        # Calculating a fractional power of a negative number can lead to complex numbers
        # or errors, depending on the math library.
        # Therefore, we handle these cases separately.
        if r_annual > Decimal('-1.0'): # Handles annual returns greater than -100%
            try:
                # Using Decimal's power method: x.power(y) is x**y
                # (1 + r_annual).power(Decimal('1.0') / Decimal('12.0')) - Decimal('1.0')
                 monthly_return = (Decimal('1.0') + r_annual) ** (Decimal('1.0') / Decimal('12.0')) - Decimal('1.0')
            except InvalidOperation as e:
                logger.warning(f"PortfolioID '{asset.portfolio_id}', AssetID '{asset.asset_id}': Could not calculate monthly return from annual return {r_annual*100}%. Error: {e}. Defaulting monthly return to 0.")
                monthly_return = Decimal('0.0')
        else: # Handles annual returns of -100% or less
             # If annual return is -100% or less, the value is completely wiped out or more.
             # The equivalent monthly return is -100% (total loss).
             monthly_return = Decimal('-1.0')

        return monthly_return

# --- Strategy Factory/Registry ---

# Instantiate strategies (can be extended later)
_standard_strategy = StandardAnnualReturnStrategy()

# Map AssetType to strategy instances
# For now, all types use the standard strategy. This can be customized.
_strategy_registry = {
    asset_type: _standard_strategy for asset_type in AssetType
}

def get_return_strategy(asset_type: AssetType) -> AbstractReturnCalculationStrategy:
    """Gets the appropriate return calculation strategy for the asset type."""
    # Ensure asset_type is an Enum member before lookup
    if not isinstance(asset_type, AssetType):
        try:
            asset_type = AssetType[str(asset_type)] # Try converting string to Enum
        except KeyError:
             logger.error(f"Unrecognized asset type '{asset_type}' provided to get_return_strategy. Using standard strategy as fallback. Portfolio context not directly available here.")
             return _standard_strategy

    strategy = _strategy_registry.get(asset_type)
    if not strategy:
        logger.warning(f"No return calculation strategy found for asset type {asset_type.name}. Using standard strategy as fallback. Portfolio context not directly available here.")
        return _standard_strategy
    return strategy 