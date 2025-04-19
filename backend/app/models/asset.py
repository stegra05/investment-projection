from app import db
from sqlalchemy.sql import func

class Asset(db.Model):
    __tablename__ = 'assets'

    asset_id = db.Column(db.Integer, primary_key=True)
    portfolio_id = db.Column(db.Integer, db.ForeignKey('portfolios.portfolio_id'), nullable=False, index=True)
    asset_type = db.Column(db.String(50), nullable=False)
    name_or_ticker = db.Column(db.String(50), nullable=True)
    # Add constraint later if needed: CheckConstraint('(allocation_percentage IS NULL AND allocation_value IS NOT NULL) OR (allocation_percentage IS NOT NULL AND allocation_value IS NULL)', name='check_allocation_exclusive')
    allocation_percentage = db.Column(db.Numeric(5, 2), nullable=True)
    allocation_value = db.Column(db.Numeric(15, 2), nullable=True)
    manual_expected_return = db.Column(db.Numeric(5, 2), nullable=True) # e.g., 7.50 for 7.5%
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())

    # Relationship
    portfolio = db.relationship('Portfolio', back_populates='assets')

    def to_dict(self):
        return {
            'asset_id': self.asset_id,
            'portfolio_id': self.portfolio_id,
            'asset_type': self.asset_type,
            'name_or_ticker': self.name_or_ticker,
            'allocation_percentage': str(self.allocation_percentage) if self.allocation_percentage is not None else None,
            'allocation_value': str(self.allocation_value) if self.allocation_value is not None else None,
            'manual_expected_return': str(self.manual_expected_return) if self.manual_expected_return is not None else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        } 