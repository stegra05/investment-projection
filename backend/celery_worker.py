import os
from app import create_app, celery_app as app_celery # Import the global celery_app

# Get the application environment from FLASK_CONFIG or default to 'development'
# This ensures the worker uses the same configuration as the Flask app (dev, test, prod)
# Note: Celery itself also has ways to load config, but here we leverage Flask's config via create_app.
config_name = os.getenv('FLASK_CONFIG') or 'default'

# Create the Flask app. This will execute the logic in create_app(), which includes:
# 1. Configuring the global celery_app (broker, backend, name).
# 2. Setting celery_app._flask_app_instance = flask_app_instance.
flask_app_instance = create_app(config_name)

# Optional: If you need an application context during worker startup for some Celery extensions
# or signals, you can push it. For basic task execution with our ContextTask, it might not be
# strictly necessary here, as ContextTask pushes a context per task.
# flask_app_instance.app_context().push()

# Now, the global `app.celery_app` (aliased here as `app_celery`) is configured,
# and `app.celery_app._flask_app_instance` is set.
# The Celery worker should be started by pointing to this script and the `app_celery` object.
# For example: celery -A celery_worker.app_celery worker -l INFO 