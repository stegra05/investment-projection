from app import db
from sqlalchemy.sql import func
from datetime import date
from app.enums import ChangeType

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
        } 

    def __repr__(self):
        return f'<PlannedFutureChange {self.change_id} ({self.change_type} on {self.change_date})>' 