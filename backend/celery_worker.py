import os
from app import create_app, celery_app as app_celery # Import the global celery_app
import logging
from celery.signals import after_setup_logger, after_setup_task_logger
from config import config as flask_configs, create_file_handler, detailed_formatter, console_handler

# Get the application environment from FLASK_CONFIG or default to 'development'
# This ensures the worker uses the same configuration as the Flask app (dev, test, prod)
# Note: Celery itself also has ways to load config, but here we leverage Flask's config via create_app.
config_name = os.getenv('FLASK_CONFIG') or 'default'
current_flask_config = flask_configs[config_name]

# Create the Flask app. This will execute the logic in create_app(), which includes:
# 1. Configuring the global celery_app (broker, backend, name).
# 2. Setting celery_app._flask_app_instance = flask_app_instance.
# 3. Initializing Flask app logging, which we can reference for Celery.
flask_app_instance = create_app(config_name)


@after_setup_logger.connect
@after_setup_task_logger.connect
def setup_celery_logging(logger, **kwargs):
    """Configures Celery worker and task loggers based on Flask app's logging settings."""
    # Clear any default handlers Celery might add to ensure our config takes precedence
    # However, be cautious as Celery might rely on some handlers for its own output (e.g., console for worker status)
    # A more targeted approach is to add our handlers without clearing, or clear specific ones.
    # For now, let's assume we want full control via our config file handlers.
    # logger.handlers = [] # Potentially too aggressive, monitor Celery worker output

    # Add Celery Worker general log handler
    if hasattr(current_flask_config, 'CELERY_WORKER_LOG_FILE') and hasattr(current_flask_config, 'LOG_LEVEL'):
        celery_file_handler = create_file_handler(
            current_flask_config.CELERY_WORKER_LOG_FILE,
            current_flask_config.LOG_LEVEL,
            detailed_formatter
        )
        logger.addHandler(celery_file_handler)

    # Add Consolidated Error log handler
    if hasattr(current_flask_config, 'ERROR_LOG_FILE'):
        error_file_handler = create_file_handler(
            current_flask_config.ERROR_LOG_FILE,
            logging.ERROR, # Only logs ERROR and CRITICAL
            detailed_formatter
        )
        logger.addHandler(error_file_handler)

    # Add Console Handler
    if hasattr(current_flask_config, 'CONSOLE_LOG_LEVEL'):
        # Make a copy or re-instantiate if console_handler is shared and modified elsewhere
        # For simplicity, assuming console_handler from config is suitable as is.
        # If console_handler's level was set globally, this might override it.
        # A dedicated Celery console handler or cloning might be more robust.
        local_console_handler = logging.StreamHandler(console_handler.stream) # Recreate to avoid shared state issues
        local_console_handler.setFormatter(console_handler.formatter)
        local_console_handler.setLevel(current_flask_config.CONSOLE_LOG_LEVEL)
        logger.addHandler(local_console_handler)
    
    # Set logger level based on Flask config
    if hasattr(current_flask_config, 'LOG_LEVEL'):
        logger.setLevel(current_flask_config.LOG_LEVEL)
    
    logger.propagate = False # Prevent logs from propagating to the root logger if we manage them here


# Optional: If you need an application context during worker startup for some Celery extensions
# or signals, you can push it. For basic task execution with our ContextTask, it might not be
# strictly necessary here, as ContextTask pushes a context per task.
# flask_app_instance.app_context().push()

# Now, the global `app.celery_app` (aliased here as `app_celery`) is configured,
# and `app.celery_app._flask_app_instance` is set.
# The Celery worker should be started by pointing to this script and the `app_celery` object.
# For example: celery -A celery_worker.app_celery worker -l INFO

# Note: The -l INFO on the command line might be overridden by this signal-based setup
# if the signal fires after Celery processes command line args. Check Celery docs for exact order.
# It's often better to control log levels purely from code/config for consistency. 