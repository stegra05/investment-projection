"""
Application Entry Point.

This script serves as the main entry point to run the Flask development server.
It creates the Flask application instance using the `create_app` factory,
configures the Flask shell context, and starts the development server if the
script is executed directly.

The configuration used to create the app (e.g., development, production) is
determined by the `FLASK_CONFIG` environment variable. If not set, it defaults
to 'default' (which typically maps to development settings).

Usage:
    To run the development server:
        python run.py
    (Ensure necessary environment variables like FLASK_CONFIG, DATABASE_URL, etc.,
     are set, often via a .env file loaded by `config.py` or `app/__init__.py`).

    To open the Flask shell:
        flask shell
        (This provides an interactive Python environment with `db` and potentially
         other application components pre-imported via `make_shell_context`).
"""
import os
import logging # Standard Python logging

# Optional: Basic logging configuration at the very start if needed for early issues.
# However, detailed logging is typically configured within `create_app` via `Config.init_app`.
# Example: logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s: %(message)s')

try:
    # Import the application factory and database instance from the 'app' package.
    # `create_app` is responsible for all app initialization, including extensions.
    from app import create_app, db 
except Exception as e:
    # Log a fatal error and exit if `create_app` or `db` cannot be imported.
    # This usually indicates a problem with the application structure or core dependencies.
    logging.critical("Fatal error during initial import (create_app or db): %s", e, exc_info=True)
    # Exit with a non-zero status code to indicate failure.
    exit(1) 

# Example: To make specific models available in `flask shell`, uncomment and import them.
# from app.models import User, Portfolio # etc.

# Note on .env loading:
# The `config.py` module is expected to handle loading of .env files using `python-dotenv`.
# This ensures environment variables are available when `create_app` is called.

# Create the Flask application instance.
# The configuration (e.g., 'development', 'testing', 'production') is determined by the
# `FLASK_CONFIG` environment variable. If `FLASK_CONFIG` is not set, it defaults to 'default',
# which usually maps to a development configuration in `config.py`.
app = create_app(os.getenv('FLASK_CONFIG') or 'default')

@app.shell_context_processor
def make_shell_context() -> dict:
    """Configures the Flask shell context.
    
    This function is automatically called by Flask when `flask shell` is run.
    It returns a dictionary of variables that will be automatically imported
    and available in the Flask shell, simplifying debugging and interaction
    with application components.

    Returns:
        A dictionary mapping variable names to their instances for the shell context.
    """
    # Provide 'db' (the SQLAlchemy instance) in the shell.
    context = {'db': db}
    # Example: To add models to the shell context:
    # context['User'] = User
    # context['Portfolio'] = Portfolio
    # This allows direct interaction with User.query, db.session, etc., in the shell.
    app.logger.debug("Flask shell context created with 'db'.") # Log when shell context is made
    return context

# This block executes only if the script is run directly (e.g., `python run.py`).
# It will not run if the script is imported by another module (e.g., by a WSGI server like Gunicorn).
if __name__ == '__main__':
    # Start the Flask development server.
    # Host '0.0.0.0' makes the server accessible externally (e.g., within a Docker container or local network).
    # Port 5000 is a common default for Flask.
    # `debug=True` enables Flask's debug mode, which provides helpful error pages and auto-reloads on code changes.
    # IMPORTANT: Debug mode should NEVER be enabled in a production environment due to security risks.
    # The debug setting here might be overridden by the app's configuration (e.g., `app.config['DEBUG']`).
    # It's generally better to control debug mode via the Flask configuration loaded by `create_app`.
    # However, for explicit local running, setting it here can be convenient.
    # Consider using `app.config.get('DEBUG', True)` to respect the loaded config's debug setting.
    
    # Determine host, port, and debug status from app config if available, or use defaults.
    # This makes `run.py` more consistent with the app's loaded configuration.
    run_host = app.config.get('FLASK_RUN_HOST', '0.0.0.0')
    run_port = app.config.get('FLASK_RUN_PORT', 5000)
    # `debug` should ideally be sourced from `app.config['DEBUG']` set by the environment config.
    # Forcing `debug=True` here is typical for a `run.py` intended for development.
    # For production, a WSGI server (Gunicorn, uWSGI) would be used instead of `app.run()`.
    is_debug_mode = app.config.get('DEBUG', True) # Default to True if not in app.config
    
    app.logger.info(f"Starting Flask development server on http://{run_host}:{run_port}/ with debug mode: {is_debug_mode}")
    app.run(host=run_host, port=run_port, debug=is_debug_mode)