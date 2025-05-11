from flask import Flask, jsonify
import json
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
from config import Config, config
from celery import Celery
from werkzeug.exceptions import HTTPException

# -----------------------------------------

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
cors = CORS()
jwt = JWTManager()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"] # Default limits for all routes
)
talisman = Talisman()

# Celery initialization function
def make_celery(app_name=__name__):
    # Use a default broker and backend if not found in config,
    # or rely on Celery to pick up from app.config
    # This basic setup assumes Celery config is loaded into Flask app.config
    return Celery(app_name)

celery_app = make_celery()

# Import error handlers
from app.error_handlers import register_error_handlers
# --------------------------------------------------------------------------

def create_app(config_name='default'): # Changed argument name for clarity
    """Application factory pattern"""
    app = Flask(__name__)
    # Look up the config class from the dictionary using the name
    app.config.from_object(config[config_name])
    # Explicitly configure JWT to use the Authorization header with 'Bearer' prefix
    app.config['JWT_HEADER_NAME'] = 'Authorization'
    app.config['JWT_HEADER_TYPE'] = 'Bearer'

    # Initialize Flask extensions here
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Configure CORS with more specific settings
    cors.init_app(app, origins="http://localhost:3000", 
                  methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
                  allow_headers=["Content-Type", "Authorization"], 
                  supports_credentials=True, max_age=3600)
    
    jwt.init_app(app)
    # Initialize Limiter with app context
    limiter.init_app(app)
    # Initialize Talisman with app context and configuration
    talisman.init_app(
        app,
        content_security_policy=app.config.get('TALISMAN_CSP'),
        content_security_policy_nonce_in=['script-src'], # Example: enable nonces for scripts
        force_https=app.config.get('TALISMAN_FORCE_HTTPS', True), # Enforce HTTPS based on config
        strict_transport_security=app.config.get('TALISMAN_HSTS', True), # Enable HSTS based on config
        session_cookie_secure=app.config.get('TALISMAN_SESSION_COOKIE_SECURE', True),
        session_cookie_http_only=app.config.get('TALISMAN_SESSION_COOKIE_HTTP_ONLY', True),
        frame_options=app.config.get('TALISMAN_FRAME_OPTIONS', 'SAMEORIGIN'),
        referrer_policy=app.config.get('TALISMAN_REFERRER_POLICY', 'strict-origin-when-cross-origin'),
        # Add other Talisman options as needed
    )

    # Update Celery configuration with Flask app config
    # Celery will use CELERY_BROKER_URL and CELERY_RESULT_BACKEND from app.config
    celery_app.conf.update(
        broker_url=app.config['CELERY_BROKER_URL'],
        result_backend=app.config['CELERY_RESULT_BACKEND']
        # Add other Celery settings if needed
    )
    # Make tasks run within Flask application context
    TaskBase = celery_app.Task
    class ContextTask(TaskBase):
        abstract = True
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return TaskBase.__call__(self, *args, **kwargs)
    celery_app.Task = ContextTask


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

    # ---------------------------------------

    # --- Register Custom Error Handlers ---
    register_error_handlers(app, db) # Pass app and db instances
    # --- End Custom Error Handlers ---

    @app.route('/test/')
    def test_page():
        return '<h1>Testing the Flask Application Factory Pattern</h1>'

    return app

# Import models here AFTER the app factory definition and extension initializations
# This makes them known to Flask-Migrate without being inside the factory function,
# potentially avoiding circular import issues during app discovery by `flask run`.
try:
    from . import models
except ImportError as e:
    # This might happen during initial setup before models.py exists
    print(f"--- app/__init__.py: Could not import app.models (normal if models don\'t exist yet): {e} ---")
except Exception as e:
    print(f"--- app/__init__.py: ERROR importing app.models: {e} ---")
    import traceback
    traceback.print_exc() 