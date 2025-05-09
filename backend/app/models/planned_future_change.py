from app import db
from sqlalchemy.sql import func
from datetime import date
from app.enums import ChangeType, FrequencyType, MonthOrdinalType, OrdinalDayType, EndsOnType

class PlannedFutureChange(db.Model):
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
    is_recurring = db.Column(db.Boolean, default=False, nullable=False)
    frequency = db.Column(db.Enum(FrequencyType, native_enum=False), default=FrequencyType.ONE_TIME, nullable=False)
    interval = db.Column(db.Integer, default=1, nullable=False)
    days_of_week = db.Column(db.JSON, nullable=True) # Array of integers [0-6 for Mon-Sun]
    day_of_month = db.Column(db.Integer, nullable=True) # [1-31]
    month_ordinal = db.Column(db.Enum(MonthOrdinalType, native_enum=False), nullable=True)
    month_ordinal_day = db.Column(db.Enum(OrdinalDayType, native_enum=False), nullable=True)
    month_of_year = db.Column(db.Integer, nullable=True) # [1-12]
    ends_on_type = db.Column(db.Enum(EndsOnType, native_enum=False), default=EndsOnType.NEVER, nullable=False)
    ends_on_occurrences = db.Column(db.Integer, nullable=True)
    ends_on_date = db.Column(db.Date, nullable=True)

    # Relationship
    portfolio = db.relationship('Portfolio', back_populates='planned_changes')

    def to_dict(self):
        """Serialize the PlannedFutureChange object to a dictionary."""
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
        return f'<PlannedFutureChange {self.change_id} ({self.change_type} on {self.change_date})>' 