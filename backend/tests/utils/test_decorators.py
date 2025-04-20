import pytest
from flask import Flask, jsonify, Blueprint
from app.utils.decorators import handle_api_errors
from app import db as _db # Use the actual db instance alias from conftest
from pydantic import BaseModel, ValidationError
from unittest.mock import patch, MagicMock

# --- Test Setup ---

# Simple Pydantic model for testing validation
class TestSchema(BaseModel):
    name: str
    value: int

# Create a minimal Flask app and blueprint for testing decorators
@pytest.fixture(scope="module")
def decorator_test_app():
    app = Flask(__name__)
    app.config['TESTING'] = True
    # Add a dummy secret key for session handling if needed by extensions
    app.config['SECRET_KEY'] = 'test-secret-key'

    # Mock db session for testing commit/rollback without real DB interaction
    # We use the shared _db object but replace its session attribute
    _db.session = MagicMock()

    test_bp = Blueprint('test_bp', __name__)

    @test_bp.route('/success', methods=['POST'])
    @handle_api_errors(schema=TestSchema)
    def success_route(validated_data):
        # Simulate successful operation
        return jsonify({"message": "Success!", "received": validated_data.model_dump()}), 200

    @test_bp.route('/validation_error', methods=['POST'])
    @handle_api_errors(schema=TestSchema)
    def validation_error_route(validated_data):
        # This part shouldn't be reached if validation fails
        return jsonify({"message": "Should not reach here"}), 200

    @test_bp.route('/general_error', methods=['POST'])
    @handle_api_errors()
    def general_error_route(json_data):
        # Simulate an unexpected error
        raise Exception("Something broke!")

    @test_bp.route('/no_body_error', methods=['POST'])
    @handle_api_errors()
    def no_body_error_route(json_data):
        return jsonify({"message": "Success?"}), 200

    app.register_blueprint(test_bp)
    return app

@pytest.fixture
def decorator_client(decorator_test_app):
    return decorator_test_app.test_client()

# --- Test Cases for handle_api_errors ---

def test_handle_api_errors_success(decorator_client):
    """Test decorator successful execution with valid data and schema."""
    valid_data = {"name": "Test Name", "value": 123}
    _db.session.reset_mock() # Reset mock before call

    response = decorator_client.post('/success', json=valid_data)

    assert response.status_code == 200
    data = response.get_json()
    assert data['message'] == "Success!"
    assert data['received'] == valid_data
    _db.session.commit.assert_called_once()
    _db.session.rollback.assert_not_called()

def test_handle_api_errors_validation_failure(decorator_client):
    """Test decorator handles Pydantic ValidationError."""
    invalid_data = {"name": "Test Name"} # Missing 'value'
    _db.session.reset_mock()

    response = decorator_client.post('/validation_error', json=invalid_data)

    assert response.status_code == 400
    # Check response.data for abort description as get_json() might be None for aborts
    response_text = response.data.decode('utf-8')
    # Check for content of the error message within the HTML response
    assert "missing" in response_text and "value" in response_text # Check for keywords from the Pydantic error
    _db.session.commit.assert_not_called()
    _db.session.rollback.assert_not_called() # Rollback not called for validation errors before execution

def test_handle_api_errors_general_exception(decorator_client):
    """Test decorator handles generic exceptions during route execution."""
    any_data = {"data": "doesnt matter"}
    _db.session.reset_mock()

    response = decorator_client.post('/general_error', json=any_data)

    assert response.status_code == 500
    # Check response.data for abort description
    response_text = response.data.decode('utf-8')
    # Check for content of the error message within the HTML response
    assert "An unexpected error occurred: Something broke!" in response_text
    _db.session.commit.assert_not_called()
    _db.session.rollback.assert_called_once()

def test_handle_api_errors_no_json_body(decorator_client):
    """Test decorator handles requests with no JSON body."""
    _db.session.reset_mock()

    # Send without json=... -> This will now correctly trigger a 415 from the decorator
    response = decorator_client.post('/no_body_error', data="not json", content_type='text/plain')

    assert response.status_code == 415 # Expect 415 Unsupported Media Type
    # Check response.data for abort description
    response_text = response.data.decode('utf-8')
    # Check for content of the error message within the HTML response
    assert "Unsupported Media Type: Request must be application/json." in response_text
    _db.session.commit.assert_not_called()

# Note: Testing verify_portfolio_ownership directly is complex due to mocking
# get_jwt_identity and DB queries. It's effectively tested via
# the portfolio route tests (e.g., test_get_portfolio_details_forbidden,
# test_update_portfolio_forbidden, etc.) which cover its 401, 403, 404 cases. 