"""
Blueprint for main application routes.

This includes basic health checks and an index route.
These routes are typically not part of the core API versioning (e.g., /api/v1/)
and are used for general application status or welcome messages.
"""
from flask import Blueprint, jsonify

# Define the blueprint: 'main'. No URL prefix is applied here,
# so routes will be at the application root (e.g., /health).
bp = Blueprint('main', __name__)

@bp.route('/health')
def health_check():
    """Provides a basic health check for the application.

    This endpoint can be used by monitoring services (like load balancers,
    Kubernetes, etc.) to verify that the application is running and responsive.

    Returns:
        JSON response with status "ok" and a 200 status code.
    """
    return jsonify({"status": "ok"}), 200

@bp.route('/')
def index():
    """Serves as the main landing page or welcome message for the API.

    Returns:
        JSON response with a welcome message and a 200 status code.
    """
    # This can be expanded to provide links to documentation or other resources.
    return jsonify({"message": "Welcome to the Investment Projection API"}), 200 