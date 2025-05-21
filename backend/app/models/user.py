"""Defines the User SQLAlchemy model."""

from .. import db
# Werkzeug imports were previously removed in favor of bcrypt for password hashing.
import bcrypt
from sqlalchemy.sql import func
from sqlalchemy import Numeric # Used for Numeric type columns

class User(db.Model):
    """Represents a user of the application.

    Attributes:
        id: The unique identifier for the user.
        username: The user's chosen username. Must be unique.
        email: The user's email address. Must be unique.
        password_hash: The hashed version of the user's password.
        created_at: The timestamp when the user account was created.
        default_inflation_rate: The user's preferred default inflation rate for projections,
                                stored as a Numeric (e.g., 0.02 for 2%).

        portfolios: Relationship to the Portfolio model, representing all portfolios
                    owned by this user. Loaded dynamically.
    """
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True, nullable=False)
    email = db.Column(db.String(120), index=True, unique=True, nullable=False)
    # Password hash length should be sufficient for bcrypt hashes (typically 60 characters, but 255 provides ample room).
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    # Example: Store 2.5% as 0.0250. Precision 5, scale 4.
    default_inflation_rate = db.Column(db.Numeric(5, 4), nullable=True)

    # Relationship to Portfolios
    # 'lazy="dynamic"' means the portfolios are loaded as a query, not directly as a list.
    # This is useful if you expect a user to have many portfolios and you want to filter them further.
    portfolios = db.relationship('Portfolio', back_populates='user', lazy='dynamic')

    def set_password(self, password: str):
        """Hashes the provided plain-text password using bcrypt and stores the hash.

        Args:
            password (str): The plain-text password to hash.
        """
        # Encode the password to bytes, required by bcrypt
        password_bytes = password.encode('utf-8')
        # Generate a salt and hash the password
        salt = bcrypt.gensalt()
        pwhash_bytes = bcrypt.hashpw(password_bytes, salt)
        # Decode the hash back to a string for database storage
        self.password_hash = pwhash_bytes.decode('utf-8')

    def check_password(self, password: str) -> bool:
        """Checks if the provided plain-text password matches the stored hash.

        Args:
            password (str): The plain-text password to check.

        Returns:
            bool: True if the password matches, False otherwise.
        """
        # Encode both the provided password and the stored hash to bytes for bcrypt comparison
        password_bytes = password.encode('utf-8')
        stored_hash_bytes = self.password_hash.encode('utf-8')
        return bcrypt.checkpw(password_bytes, stored_hash_bytes)

    def __repr__(self):
        """Provide a developer-friendly string representation of the User object."""
        return f'<User {self.username}>' 