import os
from dotenv import load_dotenv
from datetime import timedelta
import logging
from logging.handlers import TimedRotatingFileHandler
import sys
from pathlib import Path

# Load environment variables from .env file
base_dir = Path(__file__).resolve().parent
load_dotenv(base_dir / '.env')

# --- Logging Configuration ---
LOGS_DIR = base_dir / 'logs'
LOGS_DIR.mkdir(parents=True, exist_ok=True)

# Define Log Formatters
detailed_formatter = logging.Formatter(
    '%(asctime)s %(levelname)s [%(name)s:%(module)s:%(funcName)s:%(lineno)d] %(message)s'
)

simple_formatter = logging.Formatter('%(asctime)s %(levelname)s: %(message)s')

# --- Base File Handler Configuration ---
def create_file_handler(filename, level, formatter):
    handler = TimedRotatingFileHandler(
        str(LOGS_DIR / filename),
        when='midnight',
        interval=1,
        backupCount=7,
        encoding='utf-8'
    )
    handler.setFormatter(formatter)
    handler.setLevel(level)
    return handler

# --- Console Handler Configuration ---
console_handler = logging.StreamHandler(sys.stderr)
console_handler.setFormatter(detailed_formatter) # Or simple_formatter for less verbosity

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

    # --- CORS Configuration ---
    # Comma-separated list of allowed origins. Defaults to localhost:3000 for development.
    CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', 'http://localhost:3000').split(',')
    # --------------------------

    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + str(base_dir / 'app.db') # Default to SQLite if not set, use pathlib & str()
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # --- Celery Configuration ---
    CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL') or 'redis://localhost:6379/0'
    CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND') or 'redis://localhost:6379/0'
    # ----------------------------

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

    # --- Logging Settings ---
    LOG_LEVEL = logging.INFO # Default log level for the application
    FLASK_APP_LOG_FILE = 'flask_app.log'
    CELERY_WORKER_LOG_FILE = 'celery_worker.log'
    ERROR_LOG_FILE = 'errors.log'
    CONSOLE_LOG_LEVEL = logging.INFO # Default log level for console output

    # Add other configurations here, e.g., Mail settings, API keys
    # MAIL_SERVER = os.environ.get('MAIL_SERVER')
    # MAIL_PORT = int(os.environ.get('MAIL_PORT') or 25)
    # MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS') is not None
    # MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    # MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    # ADMINS = ['your-email@example.com']

    @staticmethod
    def init_app(app):
        # --- Setup Logging Handlers ---
        # Flask App general log
        app_file_handler = create_file_handler(
            Config.FLASK_APP_LOG_FILE, 
            Config.LOG_LEVEL, 
            detailed_formatter
        )
        app.logger.addHandler(app_file_handler)

        # Celery Worker general log (though typically configured in Celery setup)
        # We define it here for consistency and potential use by other parts of the app
        # if they need to log to the celery file directly (uncommon).
        # Actual Celery worker logging is usually set up via Celery signals.
        celery_file_handler = create_file_handler(
            Config.CELERY_WORKER_LOG_FILE,
            Config.LOG_LEVEL,
            detailed_formatter
        )
        # This logger can be used by non-Celery parts if needed: logging.getLogger('celery_general').addHandler(celery_file_handler)


        # Consolidated Error log
        error_file_handler = create_file_handler(
            Config.ERROR_LOG_FILE,
            logging.ERROR, # Only logs ERROR and CRITICAL
            detailed_formatter
        )
        app.logger.addHandler(error_file_handler)
        logging.getLogger('celery').addHandler(error_file_handler) # Also send Celery errors here
        logging.getLogger().addHandler(error_file_handler) # Catch errors from any logger

        # Console Handler for app logger
        console_handler.setLevel(Config.CONSOLE_LOG_LEVEL)
        app.logger.addHandler(console_handler)
        
        app.logger.setLevel(Config.LOG_LEVEL)


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    # Prioritize DATABASE_URL (from Docker), then DEV_DATABASE_URL, then hardcoded default
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
                              os.environ.get('DEV_DATABASE_URL') or \
                              'postgresql:///investment_projection_dev' # Consider changing this default if needed
    # Allow HTTP during development (Talisman)
    TALISMAN_FORCE_HTTPS = False
    TALISMAN_SESSION_COOKIE_SECURE = False
    # TALISMAN_CSP = {
    #     **Config.TALISMAN_CSP, # Inherit base CSP
    #     'script-src': Config.TALISMAN_CSP.get('script-src', []) + ['\'unsafe-eval\''],
    # }
    LOG_LEVEL = logging.DEBUG
    CONSOLE_LOG_LEVEL = logging.DEBUG

class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('TEST_DATABASE_URL') or \
        'sqlite:///:memory:' # Use in-memory SQLite for tests
    WTF_CSRF_ENABLED = False # Disable CSRF for tests
    # SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
    #     'sqlite:///' + os.path.join(basedir, 'app.db') # THIS LINE IS REDUNDANT AND OVERWRITES IN-MEMORY DB
    DEBUG = True # Enable debug for more detailed error messages in tests
    # Disable Talisman HTTPS enforcement for tests
    TALISMAN_FORCE_HTTPS = False
    TALISMAN_SESSION_COOKIE_SECURE = False
    # TALISMAN_HSTS_PRELOAD = True # Not relevant for local testing
    LOG_LEVEL = logging.DEBUG # Keep logs verbose for testing
    CONSOLE_LOG_LEVEL = logging.DEBUG # Keep console verbose for testing

class ProductionConfig(Config):
    """Production configuration."""
    # Production settings might differ, e.g., database URL from production env
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') # No default to SQLite in prod
    CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL')
    CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND')

    # Ensure DEBUG is False in production
    DEBUG = False
    # Explicitly ensure Talisman security settings are enforced for production
    TALISMAN_FORCE_HTTPS = True
    TALISMAN_SESSION_COOKIE_SECURE = True
    TALISMAN_HSTS_PRELOAD = True # Enable HSTS preload in production once confirmed
    LOG_LEVEL = logging.INFO
    CONSOLE_LOG_LEVEL = logging.WARNING # Reduce console verbosity in production

    def __init__(self):
        super().__init__()
        # Check for required environment variables in production
        if not self.SQLALCHEMY_DATABASE_URI:
            logging.critical("PRODUCTION ERROR: DATABASE_URL environment variable is not set.")
            # Consider raising an exception here or exiting if critical for startup
            # raise ValueError("PRODUCTION ERROR: DATABASE_URL environment variable is not set.")
        else:
            # Example check for PostgreSQL SSL
            if self.SQLALCHEMY_DATABASE_URI.startswith('postgresql://') and 'sslmode=require' not in self.SQLALCHEMY_DATABASE_URI:
                logging.warning(
                    "PRODUCTION WARNING: SQLALCHEMY_DATABASE_URI for PostgreSQL does not explicitly specify 'sslmode=require'. "
                    "Ensure the connection is secured via other means or update the URL."
                )
            # Add checks for other database types like MySQL (e.g., ?ssl_mode=REQUIRED) if needed

        if not self.CELERY_BROKER_URL:
            logging.critical("PRODUCTION ERROR: CELERY_BROKER_URL environment variable is not set.")
        elif self.CELERY_BROKER_URL.startswith('redis://'):
            logging.warning(
                "PRODUCTION WARNING: CELERY_BROKER_URL is using 'redis://' (unencrypted). "
                "Consider using 'rediss://' for a secure connection in production."
            )

        if not self.CELERY_RESULT_BACKEND:
            logging.critical("PRODUCTION ERROR: CELERY_RESULT_BACKEND environment variable is not set.")
        elif self.CELERY_RESULT_BACKEND.startswith('redis://'):
            logging.warning(
                "PRODUCTION WARNING: CELERY_RESULT_BACKEND is using 'redis://' (unencrypted). "
                "Consider using 'rediss://' for a secure connection in production."
            )
        
        if not self.SECRET_KEY or self.SECRET_KEY == 'you-will-never-guess':
            logging.critical("PRODUCTION ERROR: SECRET_KEY is not set or is set to the default insecure value.")
        
        if not self.JWT_SECRET_KEY or self.JWT_SECRET_KEY == 'jwt-secret-string' or self.JWT_SECRET_KEY == self.SECRET_KEY:
             logging.warning(
                "PRODUCTION WARNING: JWT_SECRET_KEY is not set, is set to a default insecure value, or is the same as SECRET_KEY. "
                "It is recommended to use a separate, strong key for JWT tokens."
            )


# Dictionary to map configuration names to classes
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig # Default to development config
} 