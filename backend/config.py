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

    # --- Talisman Security Headers Configuration ---
    # Define a basic Content Security Policy (CSP)
    # Adjust this policy based on your specific frontend needs (scripts, styles, images sources)
    # Example: Allow self, and Google Fonts/APIs
    # 'default-src': ['\'self\''],
    # 'script-src': ['\'self\'', '\'unsafe-inline\'', 'https://apis.google.com', 'https://www.google-analytics.com'],
    # 'style-src': ['\'self\'', '\'unsafe-inline\'', 'https://fonts.googleapis.com'],
    # 'font-src': ['\'self\'', 'https://fonts.gstatic.com'],
    # 'img-src': ['\'self\'', 'data:']
    # Consider using nonces or hashes instead of 'unsafe-inline' for better security
    TALISMAN_CSP = {
        'default-src': ['\'self\''],
        'script-src': ['\'self\'', '\'nonce\''], # Allows inline scripts with a nonce
        'style-src': ['\'self\'', 'https://fonts.googleapis.com', '\'unsafe-inline\''], # Allow Google fonts and inline styles (consider removing unsafe-inline)
        'font-src': ['\'self\'', 'https://fonts.gstatic.com'], # Allow Google fonts
        'img-src': ['\'self\'', 'data:'], # Allow images from self and data URIs
        'object-src': ['\'none\''], # Disallow plugins like Flash
        'base-uri': ['\'self\''],
        'frame-ancestors': ['\'none\''] # Disallow embedding in frames (stronger than X-Frame-Options)
    }
    TALISMAN_FORCE_HTTPS = True # Force HTTPS redirection
    TALISMAN_HSTS = True # Enable HTTP Strict Transport Security (HSTS)
    TALISMAN_HSTS_PRELOAD = False # Consider setting to True after verifying HSTS works correctly
    TALISMAN_HSTS_INCLUDE_SUBDOMAINS = True # Apply HSTS to subdomains
    TALISMAN_HSTS_MAX_AGE = timedelta(days=365).total_seconds() # HSTS policy duration (1 year)
    TALISMAN_SESSION_COOKIE_SECURE = True # Ensure session cookies are sent only over HTTPS
    TALISMAN_SESSION_COOKIE_HTTP_ONLY = True # Prevent client-side script access to session cookies
    TALISMAN_FRAME_OPTIONS = 'DENY' # Prevent framing (DENY is stronger than SAMEORIGIN)
    TALISMAN_REFERRER_POLICY = 'strict-origin-when-cross-origin' # Control Referer header information
    # X-Content-Type-Options: nosniff is enabled by default in Talisman
    # -----------------------------------------------

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
    SQLALCHEMY_DATABASE_URI = os.environ.get('DEV_DATABASE_URL') or 'postgresql:///investment_projection_dev'
    # Allow HTTP during development (Talisman)
    TALISMAN_FORCE_HTTPS = False
    TALISMAN_SESSION_COOKIE_SECURE = False
    # TALISMAN_CSP = {
    #     **Config.TALISMAN_CSP, # Inherit base CSP
    #     'script-src': Config.TALISMAN_CSP.get('script-src', []) + ['\'unsafe-eval\''],
    # }

class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('TEST_DATABASE_URL') or \
        'sqlite:///:memory:' # Use in-memory SQLite for tests
    WTF_CSRF_ENABLED = False # Disable CSRF for tests
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'app.db')
    DEBUG = False
    # Explicitly ensure Talisman security settings are enforced for production
    TALISMAN_FORCE_HTTPS = True
    TALISMAN_SESSION_COOKIE_SECURE = True
    TALISMAN_HSTS_PRELOAD = True

class ProductionConfig(Config):
    """Production configuration."""
    # Production settings might differ, e.g., database URL from production env
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'app.db')
    # Ensure DEBUG is False in production
    DEBUG = False
    # Explicitly ensure Talisman security settings are enforced for production
    TALISMAN_FORCE_HTTPS = True
    TALISMAN_SESSION_COOKIE_SECURE = True
    TALISMAN_HSTS_PRELOAD = True # Enable HSTS preload in production once confirmed

# Dictionary to map configuration names to classes
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig # Default to development config
} 