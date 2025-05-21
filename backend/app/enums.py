"""
Defines various enumerations used throughout the application.

These enums provide a controlled set of values for specific attributes,
enhancing type safety, readability, and maintainability. They are used in
SQLAlchemy models (often with `native_enum=False` for database compatibility
if the DB doesn't support native enums well, or `native_enum=True` for better
DB-level type checking) and in Pydantic schemas for validation.
"""
import enum # Standard Python library for creating enumerations

class AssetType(enum.Enum):
    """Categorizes the types of assets a user can have in their portfolio."""
    STOCK = 'Stock'
    BOND = 'Bond'
    MUTUAL_FUND = 'Mutual Fund'
    ETF = 'ETF'  # Exchange-Traded Fund
    REAL_ESTATE = 'Real Estate'
    CASH = 'Cash' # Or cash equivalents
    CRYPTOCURRENCY = 'Cryptocurrency'
    OPTIONS = 'Options' # Stock options or other derivatives
    OTHER = 'Other' # For assets not fitting other categories

class ChangeType(enum.Enum):
    """Defines the types of planned future changes to a portfolio.
    
    These types determine how a `PlannedFutureChange` record affects
    the portfolio's value or composition.
    """
    CONTRIBUTION = 'Contribution' # Adding funds to the portfolio
    WITHDRAWAL = 'Withdrawal'   # Removing funds from the portfolio
    REALLOCATION = 'Reallocation' # Changing the allocation percentages of assets
    DIVIDEND = 'Dividend'       # Receiving dividends (can be cash or reinvested)
    INTEREST = 'Interest'       # Receiving interest payments (e.g., from bonds, cash)

class FrequencyType(enum.Enum):
    """Specifies the frequency of recurring planned changes."""
    ONE_TIME = 'ONE_TIME'     # The change occurs only once on `change_date`.
    DAILY = 'DAILY'         # The change occurs every day or every N days.
    WEEKLY = 'WEEKLY'       # The change occurs every week or every N weeks, possibly on specific days.
    MONTHLY = 'MONTHLY'     # The change occurs every month or every N months.
    YEARLY = 'YEARLY'       # The change occurs every year or every N years.

class MonthOrdinalType(enum.Enum):
    """Defines ordinal positions within a month for recurring changes.
    
    Used for rules like "the first Monday of the month" or "the last day of the month".
    """
    FIRST = 'FIRST'     # e.g., the first Monday
    SECOND = 'SECOND'   # e.g., the second Monday
    THIRD = 'THIRD'     # e.g., the third Monday
    FOURTH = 'FOURTH'   # e.g., the fourth Monday
    LAST = 'LAST'       # e.g., the last Monday, or the last day

class OrdinalDayType(enum.Enum):
    """Specifies the type of day for ordinal recurrence rules within a month or year.
    
    Examples:
    - FIRST MONDAY (MonthOrdinalType.FIRST, OrdinalDayType.MONDAY)
    - LAST DAY (MonthOrdinalType.LAST, OrdinalDayType.DAY)
    - SECOND WEEKDAY (MonthOrdinalType.SECOND, OrdinalDayType.WEEKDAY)
    """
    MONDAY = 'MONDAY'
    TUESDAY = 'TUESDAY'
    WEDNESDAY = 'WEDNESDAY'
    THURSDAY = 'THURSDAY'
    FRIDAY = 'FRIDAY'
    SATURDAY = 'SATURDAY'
    SUNDAY = 'SUNDAY'
    DAY = 'DAY'                 # Represents any calendar day (e.g., "last day of the month")
    WEEKDAY = 'WEEKDAY'         # Represents any Monday to Friday
    WEEKEND_DAY = 'WEEKEND_DAY' # Represents Saturday or Sunday

class EndsOnType(enum.Enum):
    """Defines how a recurring planned change concludes."""
    NEVER = 'NEVER'                             # The recurrence continues indefinitely.
    AFTER_OCCURRENCES = 'AFTER_OCCURRENCES'   # The recurrence stops after a specific number of occurrences.
    ON_DATE = 'ON_DATE'                         # The recurrence stops on or after a specific date.

class Currency(enum.Enum):
    """Specifies the currency for financial values."""
    USD = 'USD'  # United States Dollar
    EUR = 'EUR'  # Euro
    GBP = 'GBP'  # British Pound Sterling
    JPY = 'JPY'  # Japanese Yen
    CAD = 'CAD'  # Canadian Dollar
    AUD = 'AUD'  # Australian Dollar
    CHF = 'CHF'  # Swiss Franc
    CNY = 'CNY'  # Chinese Yuan Renminbi
    INR = 'INR'  # Indian Rupee
    BRL = 'BRL'  # Brazilian Real
    ZAR = 'ZAR'  # South African Rand
    OTHER = 'OTHER' # For other currencies

class ValueType(enum.Enum):
    """Defines whether a financial value is an absolute amount or a percentage."""
    FIXED_AMOUNT = 'FIXED_AMOUNT' # The value is a specific monetary amount
    PERCENTAGE = 'PERCENTAGE'     # The value is a percentage of another value (e.g., portfolio total, asset value)

class RecurrencePattern(enum.Enum): # Assuming this might be for more complex or alternative recurrence logic
    """Defines patterns for recurring events, potentially more detailed than FrequencyType."""
    # This might overlap with FrequencyType, consider if it's truly distinct
    # or if FrequencyType should be expanded/used. For now, adding some common patterns.
    DAILY = 'DAILY'
    WEEKLY = 'WEEKLY'
    BI_WEEKLY = 'BI_WEEKLY' # Every two weeks
    MONTHLY = 'MONTHLY'
    QUARTERLY = 'QUARTERLY'
    SEMI_ANNUALLY = 'SEMI_ANNUALLY' # Every six months
    ANNUALLY = 'ANNUALLY' # Yearly
    ONE_TIME = 'ONE_TIME' # Non-recurring