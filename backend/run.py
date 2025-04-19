import os
from app import create_app, db
# from app.models import User # Import models if needed for shell context

# Load environment variables before creating the app
# dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
# if os.path.exists(dotenv_path):
#     from dotenv import load_dotenv
#     load_dotenv(dotenv_path)
# Note: config.py now handles loading .env, so this might be redundant

app = create_app(os.getenv('FLASK_CONFIG') or 'default')

@app.shell_context_processor
def make_shell_context():
    """Makes variables available in the Flask shell context."""
    context = {'db': db}
    # Add models to context if they exist
    # context['User'] = User
    return context

if __name__ == '__main__':
    app.run(debug=True) # Enable debug mode for development 