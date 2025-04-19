from app import db
# Remove werkzeug imports and add bcrypt
# from werkzeug.security import generate_password_hash, check_password_hash
import bcrypt
from sqlalchemy.sql import func

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True, nullable=False)
    email = db.Column(db.String(120), index=True, unique=True, nullable=False)
    # Ensure the hash length accommodates bcrypt (String(128) is sufficient, often String(60) is used)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())

    # Add relationships here later, e.g.:
    # portfolios = db.relationship('Portfolio', backref='owner', lazy='dynamic')

    # Relationship
    portfolios = db.relationship('Portfolio', back_populates='user', lazy='dynamic')

    def set_password(self, password):
        # Encode password to bytes, generate salt, and hash
        pwhash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        # Store the hash as a decoded string
        self.password_hash = pwhash.decode('utf-8')

    def check_password(self, password):
        # Encode the plaintext password and the stored hash to bytes for comparison
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def __repr__(self):
        return f'<User {self.username}>' 