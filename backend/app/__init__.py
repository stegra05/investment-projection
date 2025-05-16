from flask import Flask, jsonify, current_app
import json
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
from config import Config, config as config_dict, create_file_handler, detailed_formatter, console_handler
import logging
from celery import Celery
from werkzeug.exceptions import HTTPException
import time # Added for request duration

# -----------------------------------------

# Initialize extensions that don't need the app context immediately
db = SQLAlchemy()
migrate = Migrate()
cors = CORS()
jwt = JWTManager()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)
talisman = Talisman()

# 1. Define Celery app globally
celery_app = Celery('app') # Placeholder name, will be updated

# Store the original base task class from this specific celery_app instance
OriginalCeleryTask = celery_app.Task

# Define ContextTask globally, inheriting from OriginalCeleryTask
class ContextTask(OriginalCeleryTask):
    abstract = True

    def __call__(self, *args, **kwargs):
        if not hasattr(self.app, '_flask_app_instance') or self.app._flask_app_instance is None:
            raise RuntimeError("Flask app instance not set on Celery app. Ensure create_app sets celery_app._flask_app_instance.")
        with self.app._flask_app_instance.app_context():
            return super().__call__(*args, **kwargs)

celery_app.Task = ContextTask

# 4. Import tasks AFTER celery_app and its .Task attribute are defined
#    The tasks will be registered against this celery_app instance using @celery_app.task
# Ensure background_workers.py does not cause circular imports with models if imported globally
from . import background_workers

# Import error handlers
# Ensure error_handlers.py does not cause circular imports with models if imported globally
from app.error_handlers import register_error_handlers
# --------------------------------------------------------------------------

def create_app(config_name='default'):
    app = Flask(__name__) # This is the Flask app instance
    app.config.from_object(config_dict[config_name])
    current_config = config_dict[config_name]

    # --- Logging Setup ---
    # Clear any default handlers Flask might add
    app.logger.handlers = []

    # Flask App general log
    if hasattr(current_config, 'FLASK_APP_LOG_FILE') and hasattr(current_config, 'LOG_LEVEL'):
        app_file_handler = create_file_handler(
            current_config.FLASK_APP_LOG_FILE,
            current_config.LOG_LEVEL,
            detailed_formatter
        )
        app.logger.addHandler(app_file_handler)

    # Consolidated Error log
    if hasattr(current_config, 'ERROR_LOG_FILE'):
        error_file_handler = create_file_handler(
            current_config.ERROR_LOG_FILE,
            logging.ERROR, # Only logs ERROR and CRITICAL
            detailed_formatter
        )
        app.logger.addHandler(error_file_handler)
        # Also send errors from other loggers (e.g. SQLAlchemy) to this file
        logging.getLogger().addHandler(error_file_handler)

    # Console Handler for app logger
    if hasattr(current_config, 'CONSOLE_LOG_LEVEL'):
        console_handler.setLevel(current_config.CONSOLE_LOG_LEVEL)
        app.logger.addHandler(console_handler)

    # Set app logger level
    if hasattr(current_config, 'LOG_LEVEL'):
        app.logger.setLevel(current_config.LOG_LEVEL)

    app.logger.info("Flask app logger initialized.")

    # --- SQLAlchemy Logging Configuration (Optional) ---
    sql_alchemy_logger = logging.getLogger('sqlalchemy.engine')
    sql_alchemy_logger.setLevel(current_config.LOG_LEVEL if hasattr(current_config, 'LOG_LEVEL') else logging.INFO)
    if hasattr(current_config, 'FLASK_APP_LOG_FILE') and hasattr(current_config, 'LOG_LEVEL'):
        already_has_app_handler = any(
            h.baseFilename == app_file_handler.baseFilename for h in sql_alchemy_logger.handlers
        ) or any(
            h.baseFilename == app_file_handler.baseFilename for h in sql_alchemy_logger.parent.handlers if sql_alchemy_logger.parent
        )
        if not already_has_app_handler:
             sql_alchemy_logger.addHandler(app_file_handler) # Use the same app_file_handler

    sql_alchemy_logger.info("SQLAlchemy logging configured.")
    # --- End Logging Setup ---

    # Initialize Flask extensions with the app instance
    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app, origins=app.config.get('CORS_ALLOWED_ORIGINS'),
                  methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                  allow_headers=["Content-Type", "Authorization"],
                  supports_credentials=True, max_age=3600)
    jwt.init_app(app)
    limiter.init_app(app)
    talisman.init_app(
        app,
        content_security_policy=app.config.get('TALISMAN_CSP'),
        content_security_policy_nonce_in=['script-src'],
        force_https=app.config.get('TALISMAN_FORCE_HTTPS', True),
        strict_transport_security=app.config.get('TALISMAN_HSTS', True),
        session_cookie_secure=app.config.get('TALISMAN_SESSION_COOKIE_SECURE', True),
        session_cookie_http_only=app.config.get('TALISMAN_SESSION_COOKIE_HTTP_ONLY', True),
        frame_options=app.config.get('TALISMAN_FRAME_OPTIONS', 'SAMEORIGIN'),
        referrer_policy=app.config.get('TALISMAN_REFERRER_POLICY', 'strict-origin-when-cross-origin'),
    )

    # Configure the global celery_app instance
    celery_app.main = app.import_name
    celery_app.conf.update(
        broker_url=app.config['CELERY_BROKER_URL'],
        result_backend=app.config['CELERY_RESULT_BACKEND']
    )
    celery_app._flask_app_instance = app

    # Import User model HERE, inside create_app, after db and jwt are initialized with app
    from .models.user import User

    # Define and register JWT user loader HERE
    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity = jwt_data["sub"]
        try:
            user_id = int(identity)
        except ValueError:
            app.logger.error(f"Invalid user identity format in JWT: {identity}") # Use app.logger
            return None
        return User.query.get(user_id)

    # Import and register blueprints
    from app.routes.main import bp as main_bp
    app.register_blueprint(main_bp)
    from app.routes.auth import auth_bp
    app.register_blueprint(auth_bp)
    from app.routes.portfolios import portfolios_bp
    app.register_blueprint(portfolios_bp)
    from app.routes.assets import assets_bp
    app.register_blueprint(assets_bp, url_prefix='/api/v1/portfolios/<int:portfolio_id>/assets')
    from app.routes.changes import changes_bp
    app.register_blueprint(changes_bp, url_prefix='/api/v1/portfolios/<int:portfolio_id>/changes')
    from app.routes.projections import projections_bp
    app.register_blueprint(projections_bp)
    from app.routes.analytics import analytics_bp
    app.register_blueprint(analytics_bp)
    from app.routes.tasks import tasks_bp
    app.register_blueprint(tasks_bp, url_prefix='/api/v1/tasks')

    from app.routes.user_settings_routes import user_settings_bp # Import the new blueprint
    app.register_blueprint(user_settings_bp) # Register the new blueprint

    # Register custom error handlers
    register_error_handlers(app, db)

    # --- Request Logging ---
    @app.before_request
    def before_request_logging():
        from flask import g
        g.start_time = time.monotonic()

    @app.after_request
    def after_request_logging(response):
        from flask import g, request
        duration_ms = (time.monotonic() - g.start_time) * 1000 if hasattr(g, 'start_time') else -1
        if not request.path.startswith('/static'):
            log_message = (
                f"Request: {request.remote_addr} '{request.method} {request.path} {request.scheme.upper()}/{request.environ.get('SERVER_PROTOCOL', '').split('/')[1]}' "
                f"Status: {response.status_code} Size: {response.content_length} Duration: {duration_ms:.2f}ms "
                f"Referer: '{request.referrer or '-'}' User-Agent: '{request.user_agent.string or '-'}'"
            )
            if 200 <= response.status_code < 400:
                app.logger.info(log_message)
            elif 400 <= response.status_code < 500:
                app.logger.warning(log_message)
            elif response.status_code >= 500:
                app.logger.error(log_message)
            else:
                app.logger.debug(log_message)
        return response
    # --- End Request Logging ---

    @app.route('/test/')
    def test_page():
        return '<h1>Testing the Flask Application Factory Pattern</h1>'

    return app

# Import models here AFTER the app factory definition and extension initializations
# This global import of 'models' might still be problematic if it triggers the User->db cycle
# If the error persists, this 'try-except' block for importing '.models' globally might need to be removed
# or models should only be imported within create_app or where specifically needed.
try:
    from . import models
except ImportError as e:
    logging.info(f"--- app/__init__.py: Could not import app.models (normal if models don't exist yet): {e} ---")
except Exception as e:
    logging.exception(f"--- app/__init__.py: ERROR importing app.models: {e} ---")