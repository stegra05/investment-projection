import pytest
import json
from app.models.user import User
from app import db 
from decimal import Decimal
from app.enums import Currency

# Fixture for an authenticated user for settings tests
@pytest.fixture
def settings_user_auth(client, user_factory, session):
    email = 'settingsuser_usr_settings@example.com'
    # Create user with an initial default_inflation_rate if User model supports it directly
    # For this test, let's assume User model has a default_inflation_rate field
    user = session.query(User).filter_by(email=email).first()
    if not user:
        user = user_factory(email=email, password='password123', username='settingsuser_usr')
        user.default_inflation_rate = Decimal('2.5') # Example initial value
        session.add(user)
        session.commit()
    else: # Ensure the rate is set if user already exists from a previous failed run
        if user.default_inflation_rate is None:
            user.default_inflation_rate = Decimal('2.5')
            session.commit()
            
    login_response = client.post('/api/v1/auth/login', json={'email': email, 'password': 'password123'})
    access_token = login_response.get_json()['access_token']
    return user, {'Authorization': f'Bearer {access_token}'}

# Base URL for user settings
SETTINGS_URL = '/api/v1/users/settings' # Corrected URL based on blueprint

# === Test GET /user/settings ===
def test_get_user_settings_success(auth_client, session):
    user = auth_client.user # User is logged in via auth_client
    # Optionally set some settings if not default
    user.default_currency = Currency.EUR
    user.default_projection_horizon_years = 15
    session.commit()

    response = auth_client.get('/user/settings')
    assert response.status_code == 200
    data = response.get_json()
    assert data['username'] == user.username
    assert data['email'] == user.email
    assert data['default_currency'] == Currency.EUR.value
    assert data['default_projection_horizon_years'] == 15

# === Test PUT /user/settings ===
def test_update_user_settings_success(auth_client, session):
    user = auth_client.user
    settings_data = {
        "email": "new_settings_email@example.com",
        "default_currency": Currency.GBP.value,
        "default_projection_horizon_years": 20,
        "default_inflation_rate": 2.5 # Percentage
    }
    response = auth_client.put('/user/settings', json=settings_data)
    assert response.status_code == 200
    data = response.get_json()
    assert data['email'] == "new_settings_email@example.com"
    assert data['default_currency'] == Currency.GBP.value
    assert data['default_projection_horizon_years'] == 20
    assert data['default_inflation_rate'] == 2.5

    session.refresh(user)
    assert user.email == "new_settings_email@example.com"
    assert user.default_inflation_rate == Decimal("2.5")

def test_update_user_settings_partial_update(auth_client, session):
    user = auth_client.user
    user.email = "original.partial@example.com" # Ensure a known starting email
    session.commit()

    partial_data = {"default_projection_horizon_years": 25}
    response = auth_client.put('/user/settings', json=partial_data)
    assert response.status_code == 200
    data = response.get_json()
    assert data['default_projection_horizon_years'] == 25
    assert data['email'] == "original.partial@example.com" # Email should not change

def test_update_user_settings_validation_error(auth_client):
    invalid_data = {"email": "not-an-email", "default_projection_horizon_years": -5}
    response = auth_client.put('/user/settings', json=invalid_data)
    assert response.status_code == 400 # Validation errors from schema

def test_update_user_settings_no_data(auth_client):
    response = auth_client.put('/user/settings', json={})
    assert response.status_code == 200 # Should succeed, making no changes
    # Optionally assert that user settings haven't changed from default auth_client user

# === Test GET /user/settings/non_existent_route ===
def test_non_existent_settings_sub_route(auth_client):
    response = auth_client.get('/user/settings/this-does-not-exist')
    assert response.status_code == 404

# Cleaned up notes and non-Python text that was here to resolve SyntaxError.

# === Test for PATCH (if it were implemented, which it is not) ===
# def test_patch_user_settings_specific_field(client, settings_user_auth, session):
#     """Hypothetical: Test PATCH to update only one specific field."""
#     user, headers = settings_user_auth
#     original_username = user.username
#     new_username = "patched_user"
#
#     update_data = {
#         'username': new_username
#     }
#
#     response = client.patch(SETTINGS_URL, json=update_data, headers=headers)
#     assert response.status_code == 200 # Assuming PATCH is supported and successful
#     json_data = response.get_json()['settings']
#     assert json_data['username'] == new_username
#     assert Decimal(json_data['default_inflation_rate']) == user.default_inflation_rate # Should be unchanged
#
#     session.refresh(user)
#     assert user.username == new_username
#     assert user.default_inflation_rate == user.default_inflation_rate # Verify others unchanged


# Final check for non-existent sub-routes, if any were planned but not made
def test_non_existent_settings_sub_route(client, settings_user_auth):
    user, headers = settings_user_auth
    response = client.get(f"{SETTINGS_URL}/nonexistent_subpath", headers=headers)
    assert response.status_code == 404

# Note: /settings/application route is not implemented in user_settings_routes.py
# No tests for it are added.
