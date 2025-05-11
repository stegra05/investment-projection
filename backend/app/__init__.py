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
# The name 'app' here for the Celery app is conventional if it's the main app for the 'app' Python package.
# However, using 'celery_app' consistently avoids confusion with Flask's 'app'.
# The first argument to Celery is typically the main module name of the app.
# If this file is app/__init__.py, then 'app' as the module name is correct.
# Let's use a placeholder name first, to be updated in create_app.
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
            # When calling super(), it correctly calls the __call__ of OriginalCeleryTask
            return super().__call__(*args, **kwargs)

# Set the custom task class on the global celery_app
celery_app.Task = ContextTask

# 4. Import tasks AFTER celery_app and its .Task attribute are defined
#    The tasks will be registered against this celery_app instance using @celery_app.task
from . import background_workers

# Import error handlers
from app.error_handlers import register_error_handlers
# --------------------------------------------------------------------------

def create_app(config_name='default'):
    app = Flask(__name__) # This is the Flask app instance
    app.config.from_object(config[config_name])

    # Initialize Flask extensions with the app instance
    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app, origins="http://localhost:3000", 
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
    # Update its main name and configuration from the Flask app
    celery_app.main = app.import_name # Set Celery app name based on Flask app
    celery_app.conf.update(
        broker_url=app.config['CELERY_BROKER_URL'],
        result_backend=app.config['CELERY_RESULT_BACKEND']
        # You can add other Celery config items from app.config here
    )
    
    # Set the Flask app instance directly on the celery_app object
    celery_app._flask_app_instance = app
    
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

    # Register custom error handlers
    register_error_handlers(app, db)

    @app.route('/test/')
    def test_page():
        return '<h1>Testing the Flask Application Factory Pattern</h1>'

    return app

# Import models here AFTER the app factory definition and extension initializations
try:
    from . import models
except ImportError as e:
    print(f"--- app/__init__.py: Could not import app.models (normal if models don't exist yet): {e} ---")
except Exception as e:
    print(f"--- app/__init__.py: ERROR importing app.models: {e} ---")
    import traceback
    traceback.print_exc()