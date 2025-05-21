"""Defines the PlannedFutureChange SQLAlchemy model."""

from app import db
from sqlalchemy.sql import func
from datetime import date
from app.enums import ChangeType, FrequencyType, MonthOrdinalType, OrdinalDayType, EndsOnType

class PlannedFutureChange(db.Model):
    """Represents a planned future change to a user's portfolio.

    This could be a one-time deposit, withdrawal, reallocation, or a recurring
    change (e.g., monthly deposit).

    Attributes:
        change_id: The unique identifier for the planned change.
        portfolio_id: The ID of the portfolio this change applies to.
        change_type: The type of change (e.g., DEPOSIT, WITHDRAWAL, REALLOCATION).
        change_date: The specific date for a one-time change, or the start date for a recurring change.
        amount: The monetary amount of the change (e.g., for deposits/withdrawals).
                Nullable for changes like 'Reallocation' where the description or
                target_allocation_json is the primary information.
        target_allocation_json: A JSON object describing the target asset allocation for
                                'REALLOCATION' type changes.
        description: A user-provided description of the change.
        created_at: The timestamp when the planned change was created.

        is_recurring: Boolean indicating if the change is recurring.
        frequency: The frequency of recurrence (e.g., ONE_TIME, DAILY, WEEKLY, MONTHLY, YEARLY).
        interval: The interval for the frequency (e.g., every 2 weeks if frequency is WEEKLY and interval is 2).
        days_of_week: For weekly recurrences, a JSON array of integers [0-6] for Mon-Sun.
        day_of_month: For monthly recurrences, the specific day of the month [1-31].
        month_ordinal: For monthly recurrences based on ordinal day (e.g., 'first', 'last').
        month_ordinal_day: The specific day for ordinal monthly recurrence (e.g., 'Monday', 'day').
        month_of_year: For yearly recurrences, the specific month [1-12].
        ends_on_type: Defines how a recurring change ends ('NEVER', 'OCCURRENCES', 'DATE').
        ends_on_occurrences: The number of occurrences after which a recurring change ends.
        ends_on_date: The specific date on which a recurring change ends.

        portfolio: The relationship to the Portfolio model.
    """
    __tablename__ = 'planned_future_changes'

    change_id = db.Column(db.Integer, primary_key=True)
    portfolio_id = db.Column(db.Integer, db.ForeignKey('portfolios.portfolio_id'), nullable=False, index=True)
    change_type = db.Column(db.Enum(ChangeType, native_enum=False), nullable=False)
    change_date = db.Column(db.Date, nullable=False)
    amount = db.Column(db.Numeric(15, 2), nullable=True) # Nullable for changes like 'Reallocation' where description is key
    target_allocation_json = db.Column(db.JSON, nullable=True) # For reallocations
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())

    # Recurrence fields
    is_recurring = db.Column(db.Boolean, default=False, nullable=False) # Indicates if the change is recurring
    frequency = db.Column(db.Enum(FrequencyType, native_enum=False), default=FrequencyType.ONE_TIME, nullable=False) # e.g., ONE_TIME, DAILY, WEEKLY, MONTHLY, YEARLY
    interval = db.Column(db.Integer, default=1, nullable=False) # e.g., every 2 weeks if frequency is WEEKLY and interval is 2
    days_of_week = db.Column(db.JSON, nullable=True) # For weekly recurrence: array of integers [0-6 for Mon-Sun]
    day_of_month = db.Column(db.Integer, nullable=True) # For monthly recurrence: [1-31]
    month_ordinal = db.Column(db.Enum(MonthOrdinalType, native_enum=False), nullable=True) # For monthly recurrence: e.g., 'first', 'last'
    month_ordinal_day = db.Column(db.Enum(OrdinalDayType, native_enum=False), nullable=True) # For monthly recurrence: e.g., 'Monday', 'day'
    month_of_year = db.Column(db.Integer, nullable=True) # For yearly recurrence: [1-12]
    ends_on_type = db.Column(db.Enum(EndsOnType, native_enum=False), default=EndsOnType.NEVER, nullable=False) # How the recurrence ends: 'NEVER', 'OCCURRENCES', 'DATE'
    ends_on_occurrences = db.Column(db.Integer, nullable=True) # Number of occurrences if ends_on_type is 'OCCURRENCES'
    ends_on_date = db.Column(db.Date, nullable=True) # End date if ends_on_type is 'DATE'

    # Relationship
    portfolio = db.relationship('Portfolio', back_populates='planned_changes')

    def to_dict(self):
        """Serialize the PlannedFutureChange object to a dictionary.

        This method is useful for converting the planned change's data into a
        JSON-serializable format, often for API responses.

        Returns:
            A dictionary representation of the PlannedFutureChange.
        """
        return {
            'change_id': self.change_id,
            'portfolio_id': self.portfolio_id,
            'change_type': self.change_type.value if self.change_type else None,
            'change_date': self.change_date.isoformat() if self.change_date else None,
            'amount': str(self.amount) if self.amount is not None else None,
            'target_allocation_json': self.target_allocation_json,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_recurring': self.is_recurring,
            'frequency': self.frequency.value if self.frequency else None,
            'interval': self.interval,
            'days_of_week': self.days_of_week,
            'day_of_month': self.day_of_month,
            'month_ordinal': self.month_ordinal.value if self.month_ordinal else None,
            'month_ordinal_day': self.month_ordinal_day.value if self.month_ordinal_day else None,
            'month_of_year': self.month_of_year,
            'ends_on_type': self.ends_on_type.value if self.ends_on_type else None,
            'ends_on_occurrences': self.ends_on_occurrences,
            'ends_on_date': self.ends_on_date.isoformat() if self.ends_on_date else None,
        } 

    def __repr__(self):
        """Provide a developer-friendly string representation of the object."""
        return f'<PlannedFutureChange {self.change_id} ({self.change_type} on {self.change_date})>' 