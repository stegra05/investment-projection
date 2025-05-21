"""
Application Configuration Management.

This module defines configuration classes for different environments (Development,
Testing, Production) and a base `Config` class from which they inherit.
Configurations are loaded from environment variables (sourced from a .env file
using python-dotenv) and provide settings for Flask, SQLAlchemy, Celery, JWT,
CORS, Talisman (security headers), and logging.

Key features:
-   Environment-specific configurations.
-   Loading sensitive data from environment variables.
-   Centralized logging setup (file and console handlers).
-   Security configurations for JWT, CORS, and HTTP headers via Talisman.
-   Celery broker and result backend configuration.
-   Database URI configuration.

The `config` dictionary at the end maps string names (e.g., 'development')
to their respective configuration classes, allowing the application factory
to select the appropriate configuration based on the `FLASK_CONFIG` environment
variable.
"""
import os
from dotenv import load_dotenv # For loading environment variables from .env files
from datetime import timedelta # For setting time-based configurations (e.g., JWT expiry)
import logging # Python's standard logging library
from logging.handlers import TimedRotatingFileHandler # For rotating log files
import sys # For directing console logs to stderr/stdout
from pathlib import Path # For constructing file paths in an OS-agnostic way

# Determine the base directory of the application (backend/config.py -> backend/)
# This is used for locating the .env file and the logs directory.
base_dir = Path(__file__).resolve().parent.parent # Go up one level from config.py to app's root (backend/)
# Load environment variables from a .env file located in the base directory.
# This allows sensitive configurations (like secret keys, database URLs) to be
# kept out of version control.
load_dotenv(base_dir / '.env')

# --- Logging Configuration Setup ---
# Define the directory where log files will be stored.
LOGS_DIR = base_dir / 'logs'
LOGS_DIR.mkdir(parents=True, exist_ok=True) # Create logs directory if it doesn't exist.

# Define log formatters for different levels of detail.
detailed_formatter = logging.Formatter(
    '%(asctime)s %(levelname)s [%(name)s:%(module)s:%(funcName)s:%(lineno)d] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S' # Added datefmt for consistency
)
simple_formatter = logging.Formatter('%(asctime)s %(levelname)s: %(message)s', datefmt='%Y-%m-%d %H:%M:%S')

# --- Utility Function for Creating File Handlers ---
def create_file_handler(filename: str, level: int, formatter: logging.Formatter) -> TimedRotatingFileHandler:
    """Creates a timed rotating file handler for logging.

    Args:
        filename: The name of the log file (will be placed in LOGS_DIR).
        level: The logging level for this handler (e.g., logging.INFO, logging.ERROR).
        formatter: The logging.Formatter to use for messages in this handler.

    Returns:
        A configured TimedRotatingFileHandler instance.
    """
    handler = TimedRotatingFileHandler(
        filename=str(LOGS_DIR / filename), # Construct full path to log file
        when='midnight',    # Rotate logs at midnight
        interval=1,         # Rotate daily
        backupCount=7,      # Keep 7 days of old log files
        encoding='utf-8'    # Use UTF-8 encoding for log files
    )
    handler.setFormatter(formatter)
    handler.setLevel(level)
    return handler

# --- Console Handler Configuration (Global Instance) ---
# This handler directs logs to standard error (stderr).
# Its level and formatter can be customized per configuration environment (Dev, Prod, etc.).
console_handler = logging.StreamHandler(sys.stderr) # Log to stderr
console_handler.setFormatter(detailed_formatter) # Default to detailed, can be changed by specific configs

class Config:
    """Base configuration class. Defines common settings for all environments.
    
    Specific environment configurations (Development, Testing, Production)
    will inherit from this class and can override these settings.
    """
    # --- Security Keys ---
    # SECRET_KEY: Used by Flask for session management, CSRF protection (if using Flask-WTF), etc.
    # Should be a long, random string. Loaded from environment variable or defaults to an insecure value.
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'a-very-insecure-default-secret-key-pls-change'
    # JWT_SECRET_KEY: Dedicated secret key for signing JWTs. It's good practice to use a separate
    # key for JWTs than the main Flask SECRET_KEY. Falls back to SECRET_KEY or another default.
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or SECRET_KEY or 'a-very-insecure-default-jwt-key-pls-change'

    # --- JWT Configuration (Flask-JWT-Extended) ---
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7) # Access tokens expire after 7 days (adjust as needed)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30) # Refresh tokens expire after 30 days
    
    # Where Flask-JWT-Extended should look for JWTs (e.g., headers, cookies, query string).
    # Using headers for access tokens and cookies for refresh tokens is a common pattern.
    JWT_TOKEN_LOCATION = ["headers", "cookies"]
    JWT_COOKIE_CSRF_PROTECT = True  # Enable CSRF protection for refresh tokens sent via cookies.
    JWT_COOKIE_HTTPONLY = True      # Refresh cookies are HttpOnly (not accessible via client-side JS).
    # JWT_COOKIE_SECURE: True ensures cookies are only sent over HTTPS. Critical for production.
    # Dynamically set based on FLASK_ENV; False for non-production to allow HTTP development.
    JWT_COOKIE_SECURE = os.environ.get('FLASK_ENV') == 'production' 
    JWT_COOKIE_SAMESITE = 'Lax'     # Mitigates CSRF; 'Lax' is a good default. 'Strict' for more security.
    # Path for which the refresh token cookie is valid. Should match your refresh token endpoint.
    JWT_REFRESH_COOKIE_PATH = '/api/v1/auth/refresh' 
    # Optional: Define paths for CSRF cookies if needed (defaults are usually fine).
    # JWT_ACCESS_CSRF_COOKIE_PATH = '/api/' # Path for access CSRF cookie (if using CSRF with header tokens)
    # JWT_REFRESH_CSRF_COOKIE_PATH = '/api/v1/auth/refresh' # Path for refresh CSRF cookie

    # --- CORS (Cross-Origin Resource Sharing) Configuration (Flask-CORS) ---
    # A comma-separated string of allowed origins from environment, defaulting to localhost:3000 (common for React dev).
    CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(',')
    
    # --- SQLAlchemy (Database) Configuration ---
    # Database connection URI. Loaded from environment or defaults to a local SQLite database.
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + str(base_dir / 'app.db') # Default to app.db in the base directory
    SQLALCHEMY_TRACK_MODIFICATIONS = False # Disable Flask-SQLAlchemy event system if not used, saves resources.

    # --- Celery (Background Task Queue) Configuration ---
    # URL for the Celery message broker (e.g., Redis, RabbitMQ).
    CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL') or 'redis://localhost:6379/0'
    # URL for the Celery result backend (where task results are stored).
    CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND') or 'redis://localhost:6379/0'

    # --- Talisman (HTTP Security Headers) Configuration ---
    # Content Security Policy (CSP): Helps prevent XSS attacks.
    # This is a basic policy; it should be tailored to the specific needs of the frontend.
    # Using 'nonce' for script-src allows whitelisting specific inline scripts via a server-generated nonce.
    TALISMAN_CSP = {
        'default-src': ['\'self\''], # Default source for content: only allow from same origin.
        'script-src': [
            '\'self\'', 
            '\'nonce\'' # Allow inline scripts that have a server-generated nonce.
            # Add other trusted script sources if needed, e.g., CDNs for analytics.
        ],
        'style-src': [
            '\'self\'', 
            'https://fonts.googleapis.com', # Allow Google Fonts stylesheets.
            '\'unsafe-inline\'' # Allow inline styles. For stricter security, remove and use classes/external CSS.
        ],
        'font-src': ['\'self\'', 'https://fonts.gstatic.com'], # Allow fonts from self and Google Fonts.
        'img-src': ['\'self\'', 'data:'], # Allow images from self and data URIs (e.g., embedded images).
        'object-src': ['\'none\''], # Disallow plugins like Flash, Silverlight.
        'base-uri': ['\'self\''],   # Restricts URLs that can be used in a document's <base> element.
        'frame-ancestors': ['\'none\''] # Disallows embedding the site in iframes (clickjacking protection).
    }
    TALISMAN_FORCE_HTTPS = os.environ.get('FLASK_ENV') == 'production' # Redirect HTTP to HTTPS in production.
    TALISMAN_HSTS = True  # Enable HTTP Strict Transport Security (HSTS).
    TALISMAN_HSTS_PRELOAD = False # Set to True after careful testing and submission to HSTS preload lists.
    TALISMAN_HSTS_INCLUDE_SUBDOMAINS = True # Apply HSTS to all subdomains.
    TALISMAN_HSTS_MAX_AGE = timedelta(days=365).total_seconds() # HSTS policy duration (e.g., 1 year).
    TALISMAN_SESSION_COOKIE_SECURE = os.environ.get('FLASK_ENV') == 'production' # Session cookies only over HTTPS in prod.
    TALISMAN_SESSION_COOKIE_HTTP_ONLY = True # Session cookies not accessible via client-side JS.
    TALISMAN_FRAME_OPTIONS = 'DENY' # Equivalent to CSP frame-ancestors 'none'; DENY is strongest.
    TALISMAN_REFERRER_POLICY = 'strict-origin-when-cross-origin' # Controls Referer header behavior.
    # X-Content-Type-Options: nosniff is enabled by default in Talisman, preventing MIME-type sniffing.
    
    # --- Logging Settings (Defaults) ---
    LOG_LEVEL = logging.INFO # Default overall log level for the application.
    FLASK_APP_LOG_FILE = 'flask_app.log' # General Flask application logs.
    CELERY_WORKER_LOG_FILE = 'celery_worker.log' # Logs specific to Celery workers.
    ERROR_LOG_FILE = 'errors.log' # Consolidated file for ERROR and CRITICAL messages.
    CONSOLE_LOG_LEVEL = logging.INFO # Default log level for console output.

    # --- Other Application Configurations (Examples) ---
    # MAIL_SERVER = os.environ.get('MAIL_SERVER')
    # ... (other mail settings, API keys, etc.)

    @staticmethod
    def init_app(app):
        """Initializes application-wide logging based on the configuration.
        
        This method is called from the application factory (`create_app`) to
        set up log handlers for the Flask app and other relevant loggers.

        Args:
            app: The Flask application instance.
        """
        # General Flask application log file handler.
        app_file_handler = create_file_handler(
            Config.FLASK_APP_LOG_FILE, 
            app.config.get('LOG_LEVEL', Config.LOG_LEVEL), # Use app's config if overridden
            detailed_formatter
        )
        app.logger.addHandler(app_file_handler)

        # Note: Celery worker logging is primarily configured via Celery signals
        # in `celery_worker.py` to ensure it uses the Flask app's config.
        # Defining a handler here could be for non-Celery parts of the app that might
        # want to log to a file designated for Celery, which is uncommon.

        # Consolidated error log file handler (captures ERROR and CRITICAL).
        error_file_handler = create_file_handler(
            Config.ERROR_LOG_FILE,
            logging.ERROR, # Ensure this handler only processes ERROR and CRITICAL logs.
            detailed_formatter
        )
        app.logger.addHandler(error_file_handler) # Add to Flask app's logger.
        # Optionally, add to other loggers if you want their errors here too:
        logging.getLogger('celery').addHandler(error_file_handler) # Capture Celery errors.
        # logging.getLogger().addHandler(error_file_handler) # Add to root logger to catch all errors (can be noisy).

        # Configure the global console handler's level based on the app's config.
        console_handler.setLevel(app.config.get('CONSOLE_LOG_LEVEL', Config.CONSOLE_LOG_LEVEL))
        app.logger.addHandler(console_handler) # Add configured console handler to Flask app logger.
        
        # Set the overall log level for the Flask application logger.
        # Handlers will further filter based on their individual levels.
        app.logger.setLevel(app.config.get('LOG_LEVEL', Config.LOG_LEVEL))
        app.logger.info(f"Application logging initialized for '{app.config.get('ENV', 'unknown')}' environment.")

class DevelopmentConfig(Config):
    """Configuration settings for development environment."""
    DEBUG = True # Enable Flask's debug mode.
    # Database URI: Prioritize Docker's DATABASE_URL, then specific DEV_DATABASE_URL, then a local default.
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
                              os.environ.get('DEV_DATABASE_URL') or \
                              'postgresql://user:password@localhost:5432/investment_projection_dev' # Example PostgreSQL
    
    # Relax some security settings for easier local development.
    TALISMAN_FORCE_HTTPS = False # Allow HTTP for local development.
    TALISMAN_SESSION_COOKIE_SECURE = False # Allow session cookies over HTTP locally.
    # Example of modifying CSP for development (e.g., to allow 'unsafe-eval' for some JS libraries' dev modes):
    # TALISMAN_CSP = {
    #     **Config.TALISMAN_CSP, # Inherit base CSP rules
    #     'script-src': Config.TALISMAN_CSP.get('script-src', []) + ['\'unsafe-eval\''], # Add 'unsafe-eval'
    # }
    LOG_LEVEL = logging.DEBUG # More verbose logging in development.
    CONSOLE_LOG_LEVEL = logging.DEBUG # Detailed console output in development.

class TestingConfig(Config):
    """Configuration settings for testing environment."""
    TESTING = True # Enable Flask's testing mode.
    # Use a separate database for testing, often in-memory SQLite for speed.
    # `cache=shared` is important for some in-memory SQLite use cases with multiple connections.
    SQLALCHEMY_DATABASE_URI = os.environ.get('TEST_DATABASE_URL') or \
        'sqlite:///file:testdb?mode=memory&cache=shared&uri=true' 
    WTF_CSRF_ENABLED = False # Disable CSRF protection in forms for simpler testing.
    DEBUG = True # Often useful to have debug mode on for tests to get more error details.
    RATELIMIT_ENABLED = False # Disable rate limiting during tests.
    
    # Flask specific settings helpful for testing client interactions.
    SERVER_NAME = 'localhost.test' # Dummy server name, useful for URL generation in tests.
    APPLICATION_ROOT = '/'
    PREFERRED_URL_SCHEME = 'http' # Assume tests run over HTTP.

    # Celery settings for testing:
    CELERY_TASK_ALWAYS_EAGER = True  # Execute Celery tasks synchronously in the same process for tests.
    CELERY_TASK_STORE_EAGER_RESULT = True # Ensure results of eager tasks are available.

    # Relax Talisman security for testing environment.
    TALISMAN_FORCE_HTTPS = False
    TALISMAN_SESSION_COOKIE_SECURE = False
    LOG_LEVEL = logging.DEBUG # Verbose logging for tests.
    CONSOLE_LOG_LEVEL = logging.DEBUG # Verbose console output for tests.

class ProductionConfig(Config):
    """Configuration settings for production environment.
    
    This class emphasizes security and performance. It expects critical
    configurations (like database URLs, secret keys) to be set via
    environment variables and includes checks for their presence.
    """
    # Database URI must be provided via environment variable in production.
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') 
    # Celery broker and result backend must be provided via environment variables.
    CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL')
    CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND')

    DEBUG = False # Ensure Flask debug mode is OFF in production.
    
    # Enforce strict security headers in production.
    TALISMAN_FORCE_HTTPS = True 
    TALISMAN_SESSION_COOKIE_SECURE = True
    TALISMAN_HSTS_PRELOAD = True # Recommended for production after thorough testing.
    
    LOG_LEVEL = logging.INFO # Less verbose logging than debug for production.
    CONSOLE_LOG_LEVEL = logging.WARNING # Reduce console noise in production, log warnings and above.

    def __init__(self):
        """Initializes ProductionConfig and performs critical checks.
        
        Logs critical errors if essential production configurations are missing
        or insecurely set. This helps catch deployment issues early.
        """
        super().__init__() # Initialize base Config settings.
        
        # --- Critical Configuration Checks for Production ---
        if not self.SQLALCHEMY_DATABASE_URI:
            logging.critical("PRODUCTION FATAL: DATABASE_URL environment variable is not set.")
            # Consider raising an exception or sys.exit(1) if app cannot run without DB.
            # Example: raise ValueError("PRODUCTION FATAL: DATABASE_URL is not set.")
        elif self.SQLALCHEMY_DATABASE_URI.startswith('postgresql://') and 'sslmode=require' not in self.SQLALCHEMY_DATABASE_URI:
            # Example check for PostgreSQL SSL. Adapt for other databases.
            logging.warning(
                "PRODUCTION SECURITY: SQLALCHEMY_DATABASE_URI for PostgreSQL does not explicitly specify 'sslmode=require'. "
                "Ensure database connections are secure."
            )

        if not self.CELERY_BROKER_URL:
            logging.critical("PRODUCTION FATAL: CELERY_BROKER_URL environment variable is not set.")
        elif self.CELERY_BROKER_URL.startswith('redis://'): # Check for unencrypted Redis
            logging.warning(
                "PRODUCTION SECURITY: CELERY_BROKER_URL uses 'redis://' (unencrypted). "
                "Strongly consider 'rediss://' for secure connections in production."
            )

        if not self.CELERY_RESULT_BACKEND:
            logging.critical("PRODUCTION FATAL: CELERY_RESULT_BACKEND environment variable is not set.")
        elif self.CELERY_RESULT_BACKEND.startswith('redis://'): # Check for unencrypted Redis
            logging.warning(
                "PRODUCTION SECURITY: CELERY_RESULT_BACKEND uses 'redis://' (unencrypted). "
                "Strongly consider 'rediss://' for secure connections in production."
            )
        
        # Check for default or missing secret keys.
        if not self.SECRET_KEY or self.SECRET_KEY == 'a-very-insecure-default-secret-key-pls-change':
            logging.critical("PRODUCTION SECURITY: SECRET_KEY is not set or is set to the default insecure value.")
        
        if (not self.JWT_SECRET_KEY or 
            self.JWT_SECRET_KEY == 'a-very-insecure-default-jwt-key-pls-change' or 
            self.JWT_SECRET_KEY == self.SECRET_KEY):
             logging.warning(
                "PRODUCTION SECURITY: JWT_SECRET_KEY is not set, uses a default insecure value, or is the same as SECRET_KEY. "
                "Using a unique, strong JWT_SECRET_KEY is highly recommended."
            )

# Dictionary mapping configuration names (e.g., 'development') to their respective classes.
# This is used by the application factory to load the correct configuration.
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig # Default configuration if FLASK_CONFIG is not set.
} 