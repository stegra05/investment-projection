from app import db
from sqlalchemy.sql import func
from datetime import datetime
from decimal import Decimal
import logging

class Portfolio(db.Model):
    __tablename__ = 'portfolios'

    portfolio_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', back_populates='portfolios')
    assets = db.relationship('Asset', back_populates='portfolio', cascade='all, delete-orphan')
    planned_changes = db.relationship('PlannedFutureChange', back_populates='portfolio', cascade='all, delete-orphan')

    @property
    def total_value(self) -> Decimal:
        """Calculate the total value of the portfolio based on its assets' allocation values."""
        total = Decimal('0.00')
        if not self.assets:
            return total
        for asset in self.assets:
            if asset.allocation_value is not None:
                try:
                    total += Decimal(asset.allocation_value)
                except (InvalidOperation, TypeError) as e:
                    # Log error if conversion/addition fails, but continue calculation
                    logging.error(f"Could not add allocation_value for asset {asset.asset_id} to portfolio total: {e}. Value: '{asset.allocation_value}'")
                    # Optionally, re-raise if you want calculation to fail hard?
                    # For now, we log and continue, resulting in a potentially partial sum.
        return total

    def to_dict(self, include_details=False):
        """Serialize the Portfolio object to a dictionary.

        Args:
            include_details (bool): If True, includes related assets and
                                  planned changes in the dictionary.
                                  Defaults to False.

        Returns:
            dict: A dictionary representation of the portfolio.
        """
        data = {
            'portfolio_id': self.portfolio_id,
            'user_id': self.user_id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_details:
             data['assets'] = [asset.to_dict() for asset in self.assets]
             data['planned_changes'] = [change.to_dict() for change in self.planned_changes]
        return data 