"""
Configuration for default asset return assumptions.

This module defines the default annual percentage returns used by the projection
engine when an asset does not have a user-specified `manual_expected_return`.
These defaults are categorized by `AssetType`.
"""
from decimal import Decimal # For precise financial calculations
from app.enums import AssetType # Enum defining different types of assets

# DEFAULT_ANNUAL_RETURNS
# This dictionary maps each AssetType to a default assumed annual return percentage.
# Values are expressed as Decimal objects representing percentages (e.g., Decimal('8.0') means 8.0%).
# These defaults are used by return calculation strategies (e.g., StandardAnnualReturnStrategy)
# when an asset instance does not have its `manual_expected_return` field set.
#
# For certain asset types like OPTIONS or OTHER, a default of 0.0% might be appropriate
# as their returns are highly speculative or variable, encouraging users to provide
# manual estimates for more meaningful projections.
DEFAULT_ANNUAL_RETURNS: dict[AssetType, Decimal] = {
    AssetType.STOCK: Decimal('8.0'),          # Default annual return for stocks (e.g., broad market index)
    AssetType.BOND: Decimal('4.0'),           # Default for bonds (e.g., aggregate bond index)
    AssetType.MUTUAL_FUND: Decimal('7.5'),    # Default for mutual funds (can vary widely)
    AssetType.ETF: Decimal('7.8'),            # Default for ETFs (often similar to underlying index/assets)
    AssetType.REAL_ESTATE: Decimal('5.0'),    # Default for real estate investments (e.g., rental yield + appreciation)
    AssetType.CASH: Decimal('1.5'),           # Default for cash and cash equivalents (e.g., savings accounts, money market)
    AssetType.CRYPTOCURRENCY: Decimal('15.0'),# Default for cryptocurrencies (highly speculative, example value)
    AssetType.OPTIONS: Decimal('0.0'),        # Default for options (speculative, often 0% or requires manual input)
    AssetType.OTHER: Decimal('0.0'),          # Default for other miscellaneous assets (requires manual input)
} 
# Note: These default values are illustrative and should be reviewed and adjusted
# based on financial research, long-term historical averages, and the specific
# assumptions desired for the application's projections.