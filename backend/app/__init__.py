from flask import Flask, jsonify
import json
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
# Import Flask-Limiter
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
# Import the config dictionary along with the base Config class
from config import Config, config
from werkzeug.exceptions import HTTPException

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
cors = CORS()
jwt = JWTManager()
# Initialize Limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"] # Default limits for all routes
)

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
    cors.init_app(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000"],  # Frontend development server
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "max_age": 3600  # Cache preflight requests for 1 hour
        }
    })
    
    jwt.init_app(app)
    # Initialize Limiter with app context
    limiter.init_app(app)

    # Register blueprints here
    from app.routes.main import bp as main_bp
    app.register_blueprint(main_bp)

    # Register the auth blueprint
    from app.routes.auth import auth_bp
    app.register_blueprint(auth_bp)

    # Register the portfolio blueprint (base routes)
    from app.routes.portfolios import portfolios_bp
    app.register_blueprint(portfolios_bp)

    # Register the assets blueprint (nested under portfolios)
    from app.routes.assets import assets_bp
    app.register_blueprint(assets_bp, url_prefix='/api/v1/portfolios/<int:portfolio_id>/assets')

    # Register the planned changes blueprint (nested under portfolios)
    from app.routes.changes import changes_bp
    app.register_blueprint(changes_bp, url_prefix='/api/v1/portfolios/<int:portfolio_id>/changes')

    # Register the projections blueprint
    from app.routes.projections import projections_bp
    app.register_blueprint(projections_bp)

    # Register the analytics blueprint
    from app.routes.analytics import analytics_bp
    app.register_blueprint(analytics_bp)

    # Register the tasks blueprint
    from app.routes.tasks import tasks_bp
    app.register_blueprint(tasks_bp)

    # --- Custom JSON Error Handlers ---
    @app.errorhandler(HTTPException)
    def handle_exception(e):
        """Return JSON instead of HTML for HTTP errors."""
        # Start with the correct headers and status code from the exception
        response = e.get_response()
        # Replace the body with JSON
        response.data = json.dumps({
            "code": e.code,
            "name": e.name,
            "description": e.description,
        })
        response.content_type = "application/json"
        return response

    @app.errorhandler(404) # Specific handler for 404 if needed
    def handle_404_error(e):
        return jsonify(error=str(e.description or "Not Found")), 404

    @app.errorhandler(500) # Specific handler for 500 if needed
    def handle_500_error(e):
        # Log the original exception for debugging
        original_exception = getattr(e, "original_exception", None)
        app.logger.error(
            f"Internal Server Error: {e.description}",
            exc_info=original_exception or e
        )
        # Ensure the session is rolled back in case of internal errors
        try:
            db.session.rollback()
            app.logger.info("Database session rolled back due to 500 error.")
        except Exception as rollback_error:
            app.logger.error(f"Error during database rollback after 500 error: {rollback_error}", exc_info=rollback_error)

        return jsonify(error=str(e.description or "Internal Server Error")), 500
    
    @app.errorhandler(400) # Handler for Bad Request
    def handle_400_error(e):
        return jsonify(error=str(e.description or "Bad Request")), 400

    @app.errorhandler(401) # Handler for Unauthorized
    def handle_401_error(e):
        return jsonify(error=str(e.description or "Unauthorized")), 401

    @app.errorhandler(403) # Handler for Forbidden
    def handle_403_error(e):
        return jsonify(error=str(e.description or "Forbidden")), 403

    # --- End Custom Error Handlers ---

    @app.route('/test/')
    def test_page():
        return '<h1>Testing the Flask Application Factory Pattern</h1>'

    return app

# Import models here AFTER the app factory definition and extension initializations
# This makes them known to Flask-Migrate without being inside the factory function,
# potentially avoiding circular import issues during app discovery by `flask run`.
try:
    from . import models # Use relative import
except ImportError as e:
    # This might happen during initial setup before models.py exists
    print(f"--- app/__init__.py: Could not import app.models (normal if models don't exist yet): {e} ---")
except Exception as e:
    print(f"--- app/__init__.py: ERROR importing app.models: {e} ---")
    import traceback
    traceback.print_exc() 