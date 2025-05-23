"""Defines the Portfolio SQLAlchemy model."""

from app import db
from sqlalchemy.sql import func
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
import logging

logger = logging.getLogger(__name__)

class Portfolio(db.Model):
    """Represents a user's investment portfolio.

    A portfolio is a collection of assets and can have planned future changes
    (like deposits, withdrawals, or reallocations).

    Attributes:
        portfolio_id: The unique identifier for the portfolio.
        user_id: The ID of the user who owns this portfolio.
        name: The name of the portfolio (e.g., "Retirement Fund", "Tech Stocks").
        description: A more detailed description of the portfolio.
        created_at: The timestamp when the portfolio was created.
        updated_at: The timestamp when the portfolio was last updated.

        user: Relationship to the User model.
        assets: Relationship to the Asset model (assets contained in this portfolio).
        planned_changes: Relationship to the PlannedFutureChange model (changes scheduled for this portfolio).
    """
    __tablename__ = 'portfolios'

    portfolio_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = db.relationship('User', back_populates='portfolios')
    assets = db.relationship('Asset', back_populates='portfolio', cascade='all, delete-orphan')
    planned_changes = db.relationship('PlannedFutureChange', back_populates='portfolio', cascade='all, delete-orphan')

    @property
    def total_value(self) -> Decimal:
        """Calculates the total current value of the portfolio by summing fixed values.

        This property sums the `allocation_value` (fixed monetary value) of all
        assets directly associated with this portfolio. Assets defined with
        `allocation_percentage` are NOT included in this sum, as their actual
        value is relative to a total portfolio value that must be defined or
        calculated elsewhere (e.g., during projection initialization).

        If an asset's `allocation_value` is invalid (e.g., not a valid number),
        an error is logged, and that asset's value is skipped in the sum.
        The calculation proceeds with the remaining valid asset values.

        Returns:
            Decimal: The total value of assets with fixed allocation_value.
        """
        total = Decimal('0.00')
        if not self.assets: # Early exit if there are no assets
            return total
        for asset in self.assets:
            if asset.allocation_value is not None: # Only sum assets with a direct value defined
                try:
                    total += Decimal(asset.allocation_value)
                except (InvalidOperation, TypeError) as e:
                    # Log error if conversion or addition fails for a specific asset's value
                    logger.error(
                        f"PortfolioID '{self.portfolio_id}': Could not process "
                        f"allocation_value for AssetID '{asset.asset_id}' during total_value "
                        f"calculation: {e}. Value: '{asset.allocation_value}'"
                    )
                    # Optionally, re-raise if strict calculation is needed.
                    # Current behavior: log and continue, resulting in a sum of valid values.
        return total

    def to_dict(self, include_details: bool = False) -> dict:
        """Serialize the Portfolio object to a dictionary.

        Args:
            include_details (bool): If True, includes lists of serialized assets
                                  and planned changes. Assets are serialized using
                                  `Asset.to_dict()` and planned changes using
                                  `PlannedFutureChange.to_dict()`. Defaults to False.

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

    def __repr__(self):
        """Provide a developer-friendly string representation of the object."""
        return f'<Portfolio {self.portfolio_id} ({self.name})>' 