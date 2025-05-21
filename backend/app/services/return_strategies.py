"""
Service module defining strategies for calculating asset returns.

This module employs a strategy pattern to determine how the expected monthly
return for an asset should be calculated. It defines an abstract base class
for return calculation strategies and provides a concrete implementation
(`StandardAnnualReturnStrategy`) that derives monthly returns from annual
returns (either manually set on the asset or defaulted by asset type).

A factory function `get_return_strategy` is provided to retrieve the appropriate
strategy for a given asset type. Default annual returns are sourced from
`app.config.return_config`.
"""
from abc import ABC, abstractmethod # For defining abstract strategy classes
from decimal import Decimal, InvalidOperation # For precise financial calculations
import logging # For logging warnings and errors
from typing import List, Dict, Any, Callable, Optional

# Import necessary models and enums from the application package.
from app.models import Asset
from app.enums import AssetType
# Import default annual return configurations.
from app.config.return_config import DEFAULT_ANNUAL_RETURNS 

# Initialize a logger for this module.
logger = logging.getLogger(__name__) 

# --- Abstract Return Calculation Strategy ---

class AbstractReturnCalculationStrategy(ABC):
    """Defines the interface for asset return calculation strategies.

    Concrete strategies must implement the `calculate_monthly_return` method.
    """
    @abstractmethod
    def calculate_monthly_return(self, asset: Asset) -> Decimal:
        """Calculates the expected monthly return rate for a given asset.

        Args:
            asset: The Asset ORM object for which to calculate the return.

        Returns:
            A Decimal representing the expected monthly return rate (e.g., 0.005 for 0.5%).
        """
        pass

# --- Concrete Return Calculation Strategy ---

class StandardAnnualReturnStrategy(AbstractReturnCalculationStrategy):
    """Calculates monthly return based on an annual return figure.

    The annual return is sourced primarily from the asset's `manual_expected_return`
    field. If this is not set or invalid, it falls back to a default annual return
    defined in `app.config.return_config.DEFAULT_ANNUAL_RETURNS` based on the
    asset's type. The annual return is then converted to an equivalent monthly return.
    """

    # DEFAULT_ANNUAL_RETURNS is imported from `app.config.return_config`
    # and is used as a class-level or module-level constant.

    def calculate_monthly_return(self, asset: Asset) -> Decimal:
        """Calculates monthly return from annual return (manual or default).

        The formula used for conversion is: (1 + R_annual)^(1/12) - 1.
        Handles cases like invalid manual inputs or unrecognized asset types by
        logging issues and defaulting to 0% or a configured default. Also handles
        extreme annual returns (e.g., -100% or less).

        Args:
            asset: The Asset ORM object.

        Returns:
            The calculated Decimal monthly return rate.
        """
        r_annual_percent: Decimal # Expected annual return as a percentage (e.g., 7.5 for 7.5%)
        
        # 1. Determine the annual return percentage to use.
        # Prioritize the asset's manually set expected return.
        if asset.manual_expected_return is not None:
            try:
                r_annual_percent = Decimal(asset.manual_expected_return)
                logger.debug(f"AssetID '{asset.asset_id}': Using manual annual return {r_annual_percent}%.")
            except (InvalidOperation, TypeError):
                logger.warning(
                    f"AssetID '{asset.asset_id}': Invalid manual_expected_return '{asset.manual_expected_return}'. "
                    "Attempting to use default return for type '{asset.asset_type.value if asset.asset_type else 'Unknown'}'.")
                # Fallback to default if manual is invalid
                asset_type_enum = self._get_asset_type_enum(asset)
                if asset_type_enum is None: return Decimal('0.0') # Unrecognized type, return 0
                r_annual_percent = DEFAULT_ANNUAL_RETURNS.get(asset_type_enum, Decimal('0.0'))
                logger.debug(f"AssetID '{asset.asset_id}': Fell back to default annual return {r_annual_percent}% for type '{asset_type_enum.value}'.")
        else:
            # No manual return provided, use default based on asset type.
            asset_type_enum = self._get_asset_type_enum(asset)
            if asset_type_enum is None: return Decimal('0.0') # Unrecognized type, return 0
            r_annual_percent = DEFAULT_ANNUAL_RETURNS.get(asset_type_enum, Decimal('0.0'))
            logger.debug(f"AssetID '{asset.asset_id}': No manual return, using default {r_annual_percent}% for type '{asset_type_enum.value}'.")

            # Log info for asset types that often require manual input for meaningful projections if they default to 0%.
            if asset_type_enum in [AssetType.OPTIONS, AssetType.OTHER] and r_annual_percent == Decimal('0.0'):
                 logger.info(
                     f"AssetID '{asset.asset_id}' (Type: {asset_type_enum.name}) is using a default annual return of 0%. "
                     "Consider providing a 'manual_expected_return' for these types for more specific projections."
                 )
        
        # Convert annual percentage to a decimal fraction (e.g., 7.5% -> 0.075).
        r_annual_decimal_fraction = r_annual_percent / Decimal('100')

        # 2. Convert annual decimal fraction to monthly decimal fraction.
        # Formula: monthly_return = (1 + r_annual_decimal_fraction)^(1/12) - 1
        
        # Handle extreme cases for annual returns:
        # If annual return is -100% (r_annual_decimal_fraction = -1.0), the value becomes 0.
        # (1 + (-1))^(1/12) - 1 = 0^(1/12) - 1 = 0 - 1 = -1 (i.e., -100% monthly loss).
        # If annual return is less than -100% (e.g., -200%), (1 + r_annual_decimal_fraction) is negative.
        # Taking a fractional power of a negative number is problematic (can result in complex numbers).
        # For financial reality, if annual loss is >= 100%, monthly loss is also considered 100%.
        if r_annual_decimal_fraction <= Decimal('-1.0'):
             logger.warning(f"AssetID '{asset.asset_id}': Annual return is {r_annual_percent}%. Monthly return capped at -100%.")
             return Decimal('-1.0') # Represents -100% monthly return (total loss)

        try:
            # Calculate (1 + R_annual)^(1/12)
            base_for_power = Decimal('1.0') + r_annual_decimal_fraction
            # Using Decimal's __pow__ operator for precision.
            monthly_factor = base_for_power ** (Decimal('1.0') / Decimal('12.0'))
            monthly_return_decimal_fraction = monthly_factor - Decimal('1.0')
        except InvalidOperation as e:
            # This might occur for very unusual base_for_power values with fractional exponents,
            # though `r_annual_decimal_fraction > -1.0` check should prevent most.
            logger.error(
                f"AssetID '{asset.asset_id}': Could not calculate monthly return from annual return {r_annual_percent}%. "
                f"Mathematical error: {e}. Defaulting monthly return to 0."
            )
            monthly_return_decimal_fraction = Decimal('0.0')
            
        logger.debug(f"AssetID '{asset.asset_id}': Calculated monthly return {monthly_return_decimal_fraction:.6f}")
        return monthly_return_decimal_fraction

    def _get_asset_type_enum(self, asset: Asset) -> Optional[AssetType]:
        """Safely gets the AssetType enum member for an asset.
        
        Handles cases where asset.asset_type might be a string or unrecognized.
        Returns None if the type cannot be resolved to a valid AssetType enum member.
        """
        asset_type = asset.asset_type
        if isinstance(asset_type, AssetType): # Already an enum member
            return asset_type
        if isinstance(asset_type, str): # If it's a string, try to convert to enum
            try:
                return AssetType[asset_type]
            except KeyError:
                logger.error(f"AssetID '{asset.asset_id}': Unrecognized asset type string '{asset_type}' during default return lookup.")
                return None
        else: # Type is something unexpected
            logger.error(f"AssetID '{asset.asset_id}': Asset type is not a string or AssetType enum: '{type(asset_type)}'.")
            return None


# --- Strategy Factory / Registry ---

# Instantiate concrete strategies. Currently, only one standard strategy exists.
# This structure allows for easy addition of new strategies (e.g., for specific asset classes
# that might have different return calculation logic).
_standard_strategy = StandardAnnualReturnStrategy()

# A registry mapping AssetType enum members to their corresponding strategy instances.
# This provides a central place to define which strategy applies to which asset type.
_strategy_registry: Dict[AssetType, AbstractReturnCalculationStrategy] = {
    # By default, all asset types use the StandardAnnualReturnStrategy.
    # This can be customized, e.g.:
    # AssetType.STOCK: StockSpecificStrategy(),
    # AssetType.BOND: BondSpecificStrategy(),
    asset_type: _standard_strategy for asset_type in AssetType 
}

def get_return_strategy(asset_type: AssetType) -> AbstractReturnCalculationStrategy:
    """Factory function to retrieve the appropriate return calculation strategy for a given asset type.

    Args:
        asset_type: The AssetType enum member for which to get the strategy.

    Returns:
        An instance of a class implementing AbstractReturnCalculationStrategy.
        Defaults to `StandardAnnualReturnStrategy` if a specific strategy for the
        type is not found or if the provided `asset_type` is unrecognized (after attempting conversion).
    """
    # Ensure asset_type is an actual AssetType enum member, not a string or other type.
    if not isinstance(asset_type, AssetType):
        try:
            # Attempt to convert if a string representation of the enum member name was passed.
            asset_type = AssetType[str(asset_type)] 
        except (KeyError, TypeError): # Catch if not a valid string name or not convertible
             logger.error(
                 f"Unrecognized asset type '{str(asset_type)}' (type: {type(asset_type)}) "
                 "passed to get_return_strategy. Using standard strategy as fallback."
             )
             return _standard_strategy # Fallback to standard strategy for unrecognized types

    # Retrieve the strategy from the registry.
    strategy = _strategy_registry.get(asset_type)
    if not strategy:
        # This case should ideally not be reached if _strategy_registry is comprehensive
        # for all members of AssetType.
        logger.warning(
            f"No specific return calculation strategy found for asset type '{asset_type.name}'. "
            "Using standard strategy as fallback."
        )
        return _standard_strategy # Fallback to standard strategy
        
    return strategy 