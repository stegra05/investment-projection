"""
Celery worker entry point and configuration script.

This script is responsible for:
1.  Creating a Flask application instance using a specific configuration
    (e.g., development, production) determined by an environment variable.
    This ensures that the Celery worker operates within a context similar
    to the Flask web application, including access to Flask configurations,
    extensions, and application context for tasks.
2.  Importing the globally defined Celery application instance (`celery_app`)
    from the main `app` package. The `create_app` function is expected to
    configure this `celery_app` instance with broker URLs, result backends, etc.,
    and importantly, link it to the created Flask app instance.
3.  Setting up Celery worker logging. It uses Celery signals (`after_setup_logger`
    and `after_setup_task_logger`) to configure Celery's loggers with handlers
    defined in the Flask application's configuration (`config.py`). This allows
    Celery logs to be managed consistently with Flask app logs (e.g., written
    to the same files, using the same formats).

To run a Celery worker using this script, you would typically use a command like:
   celery -A backend.celery_worker.app_celery worker -l INFO --concurrency=4

Where:
- `backend.celery_worker.app_celery` points to the Celery application instance
  (`app_celery`) within this script (assuming `backend` is in PYTHONPATH).
- `-l INFO` sets the initial log level (which might be further adjusted by the
  signal-based logging setup herein).
- `--concurrency=4` specifies the number of worker processes.

The `flask_app_instance` created here is primarily to ensure that `app_celery`
is properly initialized and associated with a Flask app context, which is
especially important for tasks that need to access Flask's `current_app` or
extensions like SQLAlchemy.
"""
import os
# Import create_app factory and the global celery_app instance from the main app package.
from app import create_app, celery_app as app_celery 
import logging
from celery.signals import after_setup_logger, after_setup_task_logger # Celery signals for logging setup
# Import Flask app configurations and logging utility functions from `config.py`.
from config import config as flask_configs, create_file_handler, detailed_formatter, console_handler

# Determine the Flask configuration to use (e.g., 'development', 'production', 'testing').
# This is crucial for the Celery worker to operate with the same settings as the web app.
# It defaults to 'default' (usually development) if FLASK_CONFIG environment variable is not set.
config_name = os.getenv('FLASK_CONFIG') or 'default'
current_flask_config = flask_configs[config_name] # Get the specific config class/object

# Create a Flask application instance using the determined configuration.
# The `create_app` factory function is expected to:
#   1. Initialize the Flask app.
#   2. Configure the `app_celery` instance (e.g., set broker URL, result backend).
#   3. Associate `app_celery` with this Flask app instance (e.g., `app_celery.flask_app = flask_app_instance`).
#   4. Initialize Flask application logging, which will be used as a basis for Celery logging.
flask_app_instance = create_app(config_name)
# Note: `flask_app_instance` itself isn't directly used further in this script beyond this setup,
# but its creation ensures `app_celery` is configured and linked. Tasks that need app context
# will typically create their own context or use `ContextTask`.


@after_setup_logger.connect        # Signal for configuring Celery's main logger
@after_setup_task_logger.connect   # Signal for configuring Celery's task-specific loggers
def setup_celery_logging(logger: logging.Logger, **kwargs):
    """Configures Celery worker and task loggers using Flask app's logging settings.
    
    This function is connected to Celery signals that are emitted after Celery
    sets up its default loggers. It then modifies these loggers to use handlers
    (e.g., file handlers, console handlers) defined in the Flask app's configuration,
    ensuring consistent logging behavior between the Flask app and Celery workers.

    Args:
        logger: The Celery logger instance to configure (either the main worker
                logger or a task logger).
        **kwargs: Additional keyword arguments passed by the Celery signal.
    """
    # It's important not to aggressively clear all existing handlers (`logger.handlers = []`)
    # without understanding them, as Celery might have set up handlers for its own
    # internal status reporting (e.g., worker startup messages to console).
    # Instead, we add our configured handlers. If specific default handlers need removal,
    # it should be done selectively.
    
    # Add Celery Worker general log file handler, if configured in Flask config.
    if hasattr(current_flask_config, 'CELERY_WORKER_LOG_FILE') and hasattr(current_flask_config, 'LOG_LEVEL'):
        celery_file_handler = create_file_handler(
            current_flask_config.CELERY_WORKER_LOG_FILE, # Path to the Celery worker log file
            current_flask_config.LOG_LEVEL,             # Log level for this handler
            detailed_formatter                          # Shared detailed log formatter
        )
        logger.addHandler(celery_file_handler)
        logger.info(f"Celery worker file logging configured at: {current_flask_config.CELERY_WORKER_LOG_FILE}")

    # Add Consolidated Error log file handler (shared with Flask app), if configured.
    # This handler will capture ERROR and CRITICAL messages from Celery as well.
    if hasattr(current_flask_config, 'ERROR_LOG_FILE'):
        error_file_handler = create_file_handler(
            current_flask_config.ERROR_LOG_FILE,
            logging.ERROR, # This handler specifically logs ERROR and CRITICAL messages
            detailed_formatter
        )
        logger.addHandler(error_file_handler)
        logger.info(f"Celery error logging configured to: {current_flask_config.ERROR_LOG_FILE}")

    # Add Console Handler, if configured for Celery.
    # This allows Celery logs to also appear on the console, respecting configured levels.
    if hasattr(current_flask_config, 'CONSOLE_LOG_LEVEL'):
        # Recreate a new StreamHandler to avoid issues with shared state if `console_handler`
        # from `config.py` is modified elsewhere or has a global level set by Flask app.
        # This ensures this handler's level is set specifically for Celery's logger.
        local_console_handler = logging.StreamHandler(console_handler.stream) # Use same stream (e.g., sys.stderr)
        local_console_handler.setFormatter(console_handler.formatter) # Use same formatter
        local_console_handler.setLevel(current_flask_config.CONSOLE_LOG_LEVEL) # Set level from config
        logger.addHandler(local_console_handler)
        logger.info(f"Celery console logging configured with level: {current_flask_config.CONSOLE_LOG_LEVEL}")
    
    # Set the overall level for the Celery logger instance itself.
    # Handlers added above will further filter messages based on their own levels.
    if hasattr(current_flask_config, 'LOG_LEVEL'):
        logger.setLevel(current_flask_config.LOG_LEVEL)
        logger.info(f"Celery logger level set to: {current_flask_config.LOG_LEVEL}")
    
    # `logger.propagate = False` prevents log messages handled by this logger
    # from being passed up to the root logger. This is often desired when you have
    # a fully configured logger with its own set of handlers to avoid duplicate logging.
    logger.propagate = False 
    logger.info("Celery logging setup complete via Flask config signals.")


# Optional: If an application context is needed during worker startup (e.g., for certain
# Celery extensions or signals that require access to `current_app`), it can be pushed here.
# However, for basic task execution, especially when using Celery's `ContextTask` (which
# pushes an app context for each task run), this might not be strictly necessary at worker startup.
# Example:
# with flask_app_instance.app_context():
#     # Code that needs app context during worker initialization
#     pass
# current_app.logger.info("Flask app context was available during Celery worker startup (if pushed).")

# At this point, the global `app.celery_app` (aliased here as `app_celery`)
# has been configured by `create_app()`, and its `_flask_app_instance` attribute
# (or similar mechanism like `celery.flask_app`) should be set.
# The Celery worker process is started by pointing to this script and the `app_celery` object.
# For example, the command would be something like:
#   celery -A backend.celery_worker.app_celery worker -l INFO --concurrency=X
#
# Note on Log Levels:
# The log level specified on the Celery command line (e.g., `-l INFO`) sets an initial
# level for Celery's root logger and worker components. The `after_setup_logger` and
# `after_setup_task_logger` signals fire after this initial setup. The code in
# `setup_celery_logging` then further refines the logging configuration, potentially
# overriding or adding to what the command line specified, especially for specific handlers
# and the overall logger level if `logger.setLevel` is called.
# It's generally recommended to manage log levels via configuration (code or config files)
# for consistency across environments, rather than relying solely on command-line flags
# for production setups.
flask_app_instance.logger.info(f"Celery worker script initialized with Flask config '{config_name}'. `app_celery` is ready.")