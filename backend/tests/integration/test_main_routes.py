import pytest
import json

# Assuming the 'main' blueprint is registered at '/api/v1'
# If not, adjust the paths below (e.g., to '/health' and '/')
# API_V1_PREFIX = "/api/v1" # This prefix is not used for main_bp routes

def test_get_api_root_index(client):
    """Test the root API endpoint (index route)."""
    # Path based on blueprint registration. If bp is at root, this would be client.get('/')
    response = client.get('/') 
    
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['message'] == "Welcome to the Investment Projection API"

def test_health_check_endpoint(client):
    """Test the health check endpoint."""
    # Path based on blueprint registration. If bp is at root, this would be client.get('/health')
    response = client.get('/health')
    
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['status'] == 'ok'

# Example of what a test for a non-existent main route might look like,
# or if the prefix assumption is wrong.
def test_non_existent_main_route(client):
    """Test a non-existent route to ensure it 404s."""
    response = client.get('/nonexistentroute123')
    assert response.status_code == 404

# If the blueprint was registered at the application root (e.g., app.register_blueprint(bp, url_prefix='/'))
# then the tests would look like:
# def test_get_api_root_index_at_app_root(client):
#     response = client.get('/') 
#     assert response.status_code == 200
#     json_data = response.get_json()
#     assert json_data['message'] == "Welcome to the Investment Projection API"

# def test_health_check_endpoint_at_app_root(client):
#     response = client.get('/health')
#     assert response.status_code == 200
#     json_data = response.get_json()
#     assert json_data['status'] == 'ok'

# For now, sticking with the assumption that 'main' blueprint is under /api/v1
# The actual success of these tests depends on how 'bp' from 'main.py' is registered in app/__init__.py
# If these tests fail with 404s, the most likely cause is the blueprint registration path.
# The client fixture from conftest.py comes from the Flask app, so it knows the routes.
# If flask_app.config['APPLICATION_ROOT'] = '/api/v1', then client.get('/') would go to /api/v1.
# If APPLICATION_ROOT is '/' and blueprint is at '/api/v1', then client.get('/api/v1/') is correct.
# The current project structure suggests individual blueprints are prefixed with /api/v1 manually.
