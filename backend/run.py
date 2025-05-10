import os
import logging

logging.basicConfig(level=logging.INFO) # Or configure as needed

try:
    from app import create_app, db
except Exception as e:
    logging.exception("Fatal error creating Flask app")
    exit(1)

# from app.models import User

# Note: config.py now handles loading .env

app = create_app(os.getenv('FLASK_CONFIG') or 'default')

@app.shell_context_processor
def make_shell_context():
    """Makes variables available in the Flask shell context."""
    context = {'db': db}
    # context['User'] = User
    return context

if __name__ == '__main__':
    # Explicitly set host, port, and ensure debug is True
    # Defaulting debug to True for development environment
    app.run(host='0.0.0.0', port=5000, debug=True) 