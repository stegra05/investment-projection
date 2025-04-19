from app import db
from sqlalchemy.sql import func
from datetime import datetime

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

    def to_dict(self, include_details=False):
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