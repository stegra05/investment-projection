from decimal import Decimal
from app.enums import AssetType

DEFAULT_ANNUAL_RETURNS = {
    AssetType.STOCK: Decimal('8.0'),
    AssetType.BOND: Decimal('4.0'),
    AssetType.MUTUAL_FUND: Decimal('7.5'),
    AssetType.ETF: Decimal('7.8'),
    AssetType.REAL_ESTATE: Decimal('5.0'),
    AssetType.CASH: Decimal('1.5'),
    AssetType.CRYPTOCURRENCY: Decimal('15.0'),
    AssetType.OPTIONS: Decimal('0.0'),
    AssetType.OTHER: Decimal('0.0'),
} 