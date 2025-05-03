from abc import ABC, abstractmethod
from decimal import Decimal, InvalidOperation

# Assuming models and enums are accessible via app package or direct import path
# Adjust import paths if necessary based on your project structure
from app.models import Asset
from app.enums import AssetType


# --- Return Calculation Strategy ---

class AbstractReturnCalculationStrategy(ABC):
    """Abstract base class for asset return calculation strategies."""
    @abstractmethod
    def calculate_monthly_return(self, asset: Asset) -> Decimal:
        """Calculates the expected monthly return rate for a given asset."""
        pass

class StandardAnnualReturnStrategy(AbstractReturnCalculationStrategy):
    """Calculates monthly return based on annual return (manual or default)."""

    DEFAULT_ANNUAL_RETURNS = {
        AssetType.STOCK: Decimal('8.0'),
        AssetType.BOND: Decimal('4.0'),
        AssetType.MUTUAL_FUND: Decimal('7.5'),
        AssetType.ETF: Decimal('7.8'),
        AssetType.REAL_ESTATE: Decimal('5.0'),
        AssetType.CASH: Decimal('1.5'),
        AssetType.CRYPTOCURRENCY: Decimal('15.0'), # High potential, high risk
        AssetType.OPTIONS: Decimal('0.0'),       # Require manual input for meaningful projection
        AssetType.OTHER: Decimal('0.0'),         # Require manual input
    }

    def calculate_monthly_return(self, asset: Asset) -> Decimal:
        r_annual_percent = None
        # Prioritize manual return
        if asset.manual_expected_return is not None:
            try:
                r_annual_percent = Decimal(asset.manual_expected_return)
            except (InvalidOperation, TypeError):
                print(f"Warning: Invalid manual_expected_return for asset {asset.asset_id}. Using default.")
                asset_type = asset.asset_type
                # Ensure asset_type is an Enum member before using it as a key
                if not isinstance(asset_type, AssetType):
                    try:
                        asset_type = AssetType[str(asset_type)] # Try converting string to Enum
                    except KeyError:
                         print(f"Error: Unrecognized asset type '{asset_type}' for asset {asset.asset_id} during default return lookup.")
                         return Decimal('0.0') # Cannot determine default
                r_annual_percent = self.DEFAULT_ANNUAL_RETURNS.get(asset_type, Decimal('0.0'))
        else:
            asset_type = asset.asset_type
            # Ensure asset_type is an Enum member before using it as a key
            if not isinstance(asset_type, AssetType):
                try:
                    asset_type = AssetType[str(asset_type)] # Try converting string to Enum
                except KeyError:
                     print(f"Error: Unrecognized asset type '{asset_type}' for asset {asset.asset_id} during default return lookup.")
                     return Decimal('0.0') # Cannot determine default

            r_annual_percent = self.DEFAULT_ANNUAL_RETURNS.get(asset_type, Decimal('0.0'))
            if asset_type in [AssetType.OPTIONS, AssetType.OTHER] and r_annual_percent == Decimal('0.0'):
                 print(f"Info: Asset {asset.asset_id} type '{asset_type.name}' has no manual return. Projection assumes 0% growth. Provide 'manual_expected_return' for custom projection.")

        r_annual = r_annual_percent / Decimal('100')

        # Calculate monthly return from annual return: (1 + R_annual)^(1/12) - 1
        monthly_return = Decimal('0.0')
        if r_annual > Decimal('-1.0'): # Avoid issues with (1 + r_annual) being negative
            try:
                # Using Decimal's power method: x.power(y) is x**y
                # (1 + r_annual).power(Decimal('1.0') / Decimal('12.0')) - Decimal('1.0')
                 monthly_return = (Decimal('1.0') + r_annual) ** (Decimal('1.0') / Decimal('12.0')) - Decimal('1.0')
            except InvalidOperation as e:
                print(f"Warning: Could not calculate monthly return for asset {asset.asset_id} from annual return {r_annual*100}%. Error: {e}. Defaulting monthly return to 0.")
                monthly_return = Decimal('0.0')
        else:
             # Handle extremely negative annual returns (e.g., -100% or less) - monthly equivalent is -100%
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
             print(f"Error: Unrecognized asset type '{asset_type}' provided to get_return_strategy. Using standard strategy as fallback.")
             return _standard_strategy # Fallback

    strategy = _strategy_registry.get(asset_type)
    if not strategy:
        print(f"Warning: No return calculation strategy found for asset type {asset_type.name}. Using standard strategy as fallback.")
        return _standard_strategy # Fallback to standard strategy
    return strategy 