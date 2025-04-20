import os
from dotenv import load_dotenv
from datetime import timedelta

# Load environment variables from .env file
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

class Config:
    """Base configuration class."""
    # Extend JWT lifetimes to keep active users logged in
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'
    # Use a dedicated JWT secret key, falling back to SECRET_KEY if not set
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or os.environ.get('SECRET_KEY') or 'jwt-secret-string'

    # --- JWT Cookie Configuration ---
    # Define where to look for tokens (header for access, cookie for refresh)
    JWT_TOKEN_LOCATION = ["headers", "cookies"]
    # Enable CSRF protection for cookie-based tokens (primarily refresh)
    JWT_COOKIE_CSRF_PROTECT = True
    # Set cookies to be HttpOnly
    JWT_COOKIE_HTTPONLY = True
    # Set cookies to be Secure (only sent over HTTPS) - IMPORTANT FOR PRODUCTION
    # Set to False ONLY for local HTTP development if necessary
    JWT_COOKIE_SECURE = os.environ.get('FLASK_ENV') == 'production' # True in production, False otherwise
    # Set SameSite policy for cookies (Lax is a good default)
    JWT_COOKIE_SAMESITE = 'Lax'
    # Define the path for the refresh token cookie
    JWT_REFRESH_COOKIE_PATH = '/api/v1/auth/refresh'
    # Set path for CSRF cookie (optional, defaults are usually fine)
    # JWT_ACCESS_CSRF_COOKIE_PATH = '/api/'
    # JWT_REFRESH_CSRF_COOKIE_PATH = '/api/v1/auth/refresh'
    # Note: Access tokens are intended to be sent via headers, not cookies here.

    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'app.db') # Default to SQLite if not set
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Add other configurations here, e.g., Mail settings, API keys
    # MAIL_SERVER = os.environ.get('MAIL_SERVER')
    # MAIL_PORT = int(os.environ.get('MAIL_PORT') or 25)
    # MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS') is not None
    # MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    # MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    # ADMINS = ['your-email@example.com']

    @staticmethod
    def init_app(app):
        pass

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    # Use PostgreSQL for development via Unix socket by default
    SQLALCHEMY_DATABASE_URI = os.environ.get('DEV_DATABASE_URL') or 'postgresql:///investment_projection_dev'

class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('TEST_DATABASE_URL') or \
        'sqlite:///:memory:' # Use in-memory SQLite for tests
    WTF_CSRF_ENABLED = False # Disable CSRF for tests

class ProductionConfig(Config):
    """Production configuration."""
    # Production settings might differ, e.g., database URL from production env
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'app.db')
    # Ensure DEBUG is False in production
    DEBUG = False

# Dictionary to map configuration names to classes
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig # Default to development config
} 