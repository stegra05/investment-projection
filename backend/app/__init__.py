from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
# Import the config dictionary along with the base Config class
from config import Config, config

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
cors = CORS()
jwt = JWTManager()

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
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}}) # Basic CORS setup
    jwt.init_app(app)

    # Register blueprints here
    from app.routes.main import bp as main_bp
    app.register_blueprint(main_bp)

    # Register the auth blueprint
    from app.routes.auth import auth_bp
    app.register_blueprint(auth_bp)

    # Register the portfolio blueprint
    from app.routes.portfolios import portfolios_bp
    app.register_blueprint(portfolios_bp)

    # Register the projections blueprint
    from app.routes.projections import projections_bp
    app.register_blueprint(projections_bp)

    # Import models here to ensure they are known to Flask-Migrate
    try:
        from app import models
    except Exception as e:
        print(f"--- app/__init__.py: ERROR importing app.models: {e} ---")
        import traceback
        traceback.print_exc()

    @app.route('/test/')
    def test_page():
        return '<h1>Testing the Flask Application Factory Pattern</h1>'

    return app 