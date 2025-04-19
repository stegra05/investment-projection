import os
try:
    from app import create_app, db
except Exception as e:
    print(f"--- ERROR during import from app: {e} ---")
    import traceback
    traceback.print_exc()
    import sys
    sys.exit(1) # Exit if import fails

# from app.models import User # Import models if needed for shell context

# Note: config.py now handles loading .env

app = create_app(os.getenv('FLASK_CONFIG') or 'default')

@app.shell_context_processor
def make_shell_context():
    """Makes variables available in the Flask shell context."""
    context = {'db': db}
    # Add models to context if they exist
    # context['User'] = User
    return context

if __name__ == '__main__':
    # Explicitly set host, port, and ensure debug is True
    # Defaulting debug to True for development environment
    app.run(host='0.0.0.0', port=5000, debug=True) 