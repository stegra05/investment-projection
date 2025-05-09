import enum

class AssetType(enum.Enum):
    STOCK = 'Stock'
    BOND = 'Bond'
    MUTUAL_FUND = 'Mutual Fund'
    ETF = 'ETF'
    REAL_ESTATE = 'Real Estate'
    CASH = 'Cash'
    CRYPTOCURRENCY = 'Cryptocurrency'
    OPTIONS = 'Options'
    OTHER = 'Other'

class ChangeType(enum.Enum):
    CONTRIBUTION = 'Contribution'
    WITHDRAWAL = 'Withdrawal'
    REALLOCATION = 'Reallocation'
    DIVIDEND = 'Dividend'
    INTEREST = 'Interest' 

class FrequencyType(enum.Enum):
    ONE_TIME = 'ONE_TIME'
    DAILY = 'DAILY'
    WEEKLY = 'WEEKLY'
    MONTHLY = 'MONTHLY'
    YEARLY = 'YEARLY'

class MonthOrdinalType(enum.Enum):
    FIRST = 'FIRST'
    SECOND = 'SECOND'
    THIRD = 'THIRD'
    FOURTH = 'FOURTH'
    LAST = 'LAST'

class OrdinalDayType(enum.Enum):
    MONDAY = 'MONDAY'
    TUESDAY = 'TUESDAY'
    WEDNESDAY = 'WEDNESDAY'
    THURSDAY = 'THURSDAY'
    FRIDAY = 'FRIDAY'
    SATURDAY = 'SATURDAY'
    SUNDAY = 'SUNDAY'
    DAY = 'DAY'
    WEEKDAY = 'WEEKDAY'
    WEEKEND_DAY = 'WEEKEND_DAY'

class EndsOnType(enum.Enum):
    NEVER = 'NEVER'
    AFTER_OCCURRENCES = 'AFTER_OCCURRENCES'
    ON_DATE = 'ON_DATE' 