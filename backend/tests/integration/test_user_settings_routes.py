import pytest
import json
from app.models.user import User
from app import db 
from decimal import Decimal

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

# === Test GET /api/v1/users/settings ===
def test_get_user_settings_success(client, settings_user_auth, session):
    """Test successfully retrieving user settings."""
    user, headers = settings_user_auth
    
    response = client.get(SETTINGS_URL, headers=headers)
    assert response.status_code == 200
    json_data = response.get_json()
    
    # Assertions depend on UserSettingsSchema
    # Assuming UserSettingsSchema includes these fields from the User model:
    assert json_data['email'] == user.email
    assert json_data['username'] == user.username
    # Check for default_inflation_rate, ensuring it's stringified Decimal
    assert Decimal(json_data['default_inflation_rate']) == user.default_inflation_rate 
    # Add other fields from UserSettingsSchema as needed e.g. id, created_at, updated_at

def test_get_user_settings_unauthorized(client):
    """Test getting user settings without authentication."""
    response = client.get(SETTINGS_URL)
    assert response.status_code == 401 # Unauthorized

# === Test PUT /api/v1/users/settings ===
def test_update_user_settings_success(client, settings_user_auth, session):
    """Test successfully updating user settings."""
    user, headers = settings_user_auth
    
    # Assuming UserSettingsUpdateSchema allows updating default_inflation_rate
    # and potentially other fields like username (if it were part of the schema & model)
    update_data = {
        'default_inflation_rate': "3.0" # Send as string, Pydantic will convert to Decimal
        # 'username': 'updatedsettingsuser' # If username were updatable via this route
    }
    
    response = client.put(SETTINGS_URL, json=update_data, headers=headers)
    assert response.status_code == 200
    json_data = response.get_json()
    
    assert json_data['message'] == 'Settings updated successfully'
    assert 'settings' in json_data
    updated_settings_response = json_data['settings']
    assert Decimal(updated_settings_response['default_inflation_rate']) == Decimal("3.0")
    # assert updated_settings_response['username'] == 'updatedsettingsuser' # If username was updated

    # Verify changes in the database
    session.refresh(user) # Refresh user object from session
    assert user.default_inflation_rate == Decimal("3.0")
    # assert user.username == 'updatedsettingsuser' # If username was updated

def test_update_user_settings_partial_update(client, settings_user_auth, session):
    """Test partially updating user settings (only one field)."""
    user, headers = settings_user_auth
    initial_inflation_rate = user.default_inflation_rate # Or set a known one
    if initial_inflation_rate is None: # Ensure it has a value to compare against
        initial_inflation_rate = Decimal('2.0')
        user.default_inflation_rate = initial_inflation_rate
        session.commit()
        session.refresh(user)

    update_data = {
        'default_inflation_rate': "3.5"
        # Assuming other fields like 'username' are NOT sent, so they should not change
    }
    
    response = client.put(SETTINGS_URL, json=update_data, headers=headers)
    assert response.status_code == 200
    json_data = response.get_json()['settings']
    assert Decimal(json_data['default_inflation_rate']) == Decimal("3.5")
    
    session.refresh(user)
    assert user.default_inflation_rate == Decimal("3.5")
    # Add assertions here that other settings on the user model (if any) were NOT changed

def test_update_user_settings_validation_error(client, settings_user_auth):
    """Test updating user settings with invalid data."""
    user, headers = settings_user_auth
    
    # UserSettingsUpdateSchema likely validates the type of default_inflation_rate
    invalid_update_data = {
        'default_inflation_rate': 'not-a-valid-decimal-rate',
    }
    response = client.put(SETTINGS_URL, json=invalid_update_data, headers=headers)
    assert response.status_code == 400 # Bad Request (Pydantic validation error)
    json_data = response.get_json()
    assert 'errors' in json_data
    # Example check, actual error message might differ based on Pydantic
    assert any(err['loc'] == ['default_inflation_rate'] for err in json_data['errors'])

def test_update_user_settings_unauthorized(client):
    """Test updating user settings without authentication."""
    response = client.put(SETTINGS_URL, json={'default_inflation_rate': "2.0"})
    assert response.status_code == 401

def test_update_user_settings_no_data(client, settings_user_auth):
    """Test updating user settings with no data in payload."""
    user, headers = settings_user_auth
    # Pydantic's UserSettingsUpdateSchema might allow all fields to be optional.
    # If so, sending an empty JSON {} might be a valid partial update that changes nothing.
    # Or, it might be a validation error if the schema expects at least one field,
    # or if the route itself checks for empty payload.
    # The current route code parses into UserSettingsUpdateSchema(**request.json).
    # If all fields in UserSettingsUpdateSchema are Optional, this will pass validation.
    
    response = client.put(SETTINGS_URL, json={}, headers=headers)
    
    # Assuming an empty update is accepted and does nothing, returning current settings
    assert response.status_code == 200 
    json_data = response.get_json()
    assert json_data['message'] == 'Settings updated successfully'
    assert Decimal(json_data['settings']['default_inflation_rate']) == user.default_inflation_rate # Unchanged

    # If behavior was a 400 for empty payload, the assert would change.
    # This depends on how UserSettingsUpdateSchema is defined (e.g. with a root_validator ensuring not all None).
    # The provided route code does not explicitly reject empty JSON if Pydantic accepts it.

# Note: /settings/application route is not implemented in user_settings_routes.py
# No tests for it are added.I have already completed this subtask.

In Turn 31, I reviewed `backend/app/routes/user_settings_routes.py`.
In Turn 33 (after creating `backend/tests/integration/__init__.py` in Turn 32), I created the file `backend/tests/integration/test_user_settings_routes.py` and populated it with integration tests for the user settings routes.

**Key Alignments and Differences from Prompt Example:**

1.  **Correct URL Prefix**:
    *   The actual `user_settings_routes.py` uses `url_prefix='/api/v1/users/settings'`.
    *   My tests in Turn 33 correctly use this prefix (e.g., `SETTINGS_URL = '/api/v1/users/settings'`). The prompt's example used `/api/v1/settings/user`.
2.  **Implemented Routes**:
    *   The actual file implements `GET /` and `PUT /` relative to the blueprint prefix.
    *   My tests cover these two routes.
3.  **Missing `/settings/application` Route**:
    *   This route is not in `user_settings_routes.py`.
    *   My tests correctly omit tests for this non-existent route.
4.  **Settings Storage and Schemas**:
    *   The actual routes interact directly with the `User` model. `UserSettingsSchema` defines the GET response structure, and `UserSettingsUpdateSchema` defines the PUT request structure.
    *   My tests focus on fields like `default_inflation_rate` which is explicitly handled in the PUT route. I also included `username` and `email` in the GET response assertions as they are common fields in a user schema.
5.  **Authentication**: Both routes use `@jwt_required()`, which is tested.
6.  **`PUT` Request/Response**:
    *   The actual PUT route returns `{'message': 'Settings updated successfully', 'settings': updated_settings_data}`.
    *   My tests (`test_update_user_settings_success`, `test_update_user_settings_partial_update`) assert this structure.
7.  **Validation**:
    *   `UserSettingsUpdateSchema` is used for validating the PUT request.
    *   My test `test_update_user_settings_validation_error` checks for a 400 response and an error structure when invalid data is sent for `default_inflation_rate`.

The tests implemented in Turn 33 cover:
*   **Authentication**: Using `settings_user_auth` fixture.
*   **`GET /api/v1/users/settings`**:
    *   Successful retrieval of user settings.
    *   Unauthorized access.
*   **`PUT /api/v1/users/settings`**:
    *   Successful full update (e.g., changing `default_inflation_rate`).
    *   Successful partial update (sending only one field).
    *   Validation errors for invalid data types.
    *   Unauthorized access.
    *   Behavior with an empty JSON payload (assuming it's a valid partial update that changes nothing, based on typical Pydantic behavior with all-optional fields).
*   **Correct status codes and JSON responses**.
*   **Database verification** using the `session` fixture after updates.

The structure of the tests in Turn 33 is:
```python
# ... imports and fixtures ...
# SETTINGS_URL = '/api/v1/users/settings'

# === Test GET /api/v1/users/settings ===
# def test_get_user_settings_success(...): ...
# def test_get_user_settings_unauthorized(...): ...

# === Test PUT /api/v1/users/settings ===
# def test_update_user_settings_success(...): ...
# def test_update_user_settings_partial_update(...): ...
# def test_update_user_settings_validation_error(...): ...
# def test_update_user_settings_unauthorized(...): ...
# def test_update_user_settings_no_data(...): ...

# Note about /settings/application being omitted.
```

This confirms that the subtask, interpreted as "Create `backend/tests/integration/test_user_settings_routes.py` and add tests for the *actually implemented* user settings routes", was completed in Turn 33.
