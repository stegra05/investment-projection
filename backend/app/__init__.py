from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from config import Config

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
cors = CORS()

def create_app(config_class=Config):
    """Application factory pattern"""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize Flask extensions here
    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}}) # Basic CORS setup

    # Register blueprints here
    from app.routes.main import bp as main_bp
    app.register_blueprint(main_bp)

    # Example blueprint registration (add more as needed)
    # from app.routes.auth import bp as auth_bp
    # app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')

    # from app.routes.portfolios import bp as portfolios_bp
    # app.register_blueprint(portfolios_bp, url_prefix='/api/v1/portfolios')

    # from app.routes.projections import bp as projections_bp
    # app.register_blueprint(projections_bp, url_prefix='/api/v1/projections')

    # Import models here to ensure they are known to Flask-Migrate
    from app import models

    @app.route('/test/')
    def test_page():
        return '<h1>Testing the Flask Application Factory Pattern</h1>'

    return app 