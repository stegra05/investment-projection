from app import db
from sqlalchemy.sql import func
from app.enums import AssetType
from sqlalchemy.orm import validates

class Asset(db.Model):
    __tablename__ = 'assets'

    asset_id = db.Column(db.Integer, primary_key=True)
    portfolio_id = db.Column(db.Integer, db.ForeignKey('portfolios.portfolio_id'), nullable=False, index=True)
    asset_type = db.Column(db.Enum(AssetType), nullable=False)
    name_or_ticker = db.Column(db.String(50), nullable=True)
    # Add constraint later if needed: CheckConstraint('(allocation_percentage IS NULL AND allocation_value IS NOT NULL) OR (allocation_percentage IS NOT NULL AND allocation_value IS NULL)', name='check_allocation_exclusive')
    allocation_percentage = db.Column(db.Numeric(5, 2), nullable=True)
    allocation_value = db.Column(db.Numeric(15, 2), nullable=True)
    manual_expected_return = db.Column(db.Numeric(5, 2), nullable=True) # e.g., 7.50 for 7.5%
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())

    # --- Validation ---
    @validates('allocation_percentage')
    def validate_allocation_percentage(self, key, value):
        """Validate allocation percentage.

        Ensures that if allocation_percentage is set, allocation_value is
        cleared to maintain exclusivity between the two allocation methods.
        Allows setting the value to None.
        """
        if value is not None:
            if self.allocation_value is not None:
                 self.allocation_value = None # Clear the other value
            # Optional: Add range validation if not handled elsewhere (e.g., Pydantic/DB constraint)
            # if not (0 <= value <= 100):
            #     raise ValueError("Allocation percentage must be between 0 and 100.")
        return value

    @validates('allocation_value')
    def validate_allocation_value(self, key, value):
        """Validate allocation value.

        Ensures that if allocation_value is set, allocation_percentage is
        cleared to maintain exclusivity between the two allocation methods.
        Allows setting the value to None.
        """
        if value is not None:
            if self.allocation_percentage is not None:
                self.allocation_percentage = None # Clear the other value
            # Optional: Add non-negative validation if not handled elsewhere
            # if value < 0:
            #     raise ValueError("Allocation value cannot be negative.")
        return value

    # Relationship
    portfolio = db.relationship('Portfolio', back_populates='assets')

    def to_dict(self):
        """Serialize the Asset object to a dictionary."""
        return {
            'asset_id': self.asset_id,
            'portfolio_id': self.portfolio_id,
            'asset_type': self.asset_type.value if self.asset_type else None,
            'name_or_ticker': self.name_or_ticker,
            'allocation_percentage': str(self.allocation_percentage) if self.allocation_percentage is not None else None,
            'allocation_value': str(self.allocation_value) if self.allocation_value is not None else None,
            'manual_expected_return': str(self.manual_expected_return) if self.manual_expected_return is not None else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        } 