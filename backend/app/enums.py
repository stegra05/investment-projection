import enum

class AssetType(enum.Enum):
    STOCK = 'Stock'
    BOND = 'Bond'
    MUTUAL_FUND = 'Mutual Fund'
    ETF = 'ETF'
    REAL_ESTATE = 'Real Estate'
    CASH = 'Cash'
    OTHER = 'Other'

class ChangeType(enum.Enum):
    CONTRIBUTION = 'Contribution'
    WITHDRAWAL = 'Withdrawal'
    REALLOCATION = 'Reallocation'
    DIVIDEND = 'Dividend'
    INTEREST = 'Interest' 