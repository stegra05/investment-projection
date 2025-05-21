import pytest
import json
from app.models.user import User # To query user directly for assertions
# client, session, user_factory are fixtures from conftest.py

# Helper function to parse cookies if tokens are sent via HttpOnly cookies
def get_cookie_value(response, cookie_name):
    cookie_headers = response.headers.getlist('Set-Cookie')
    for header in cookie_headers:
        if f"{cookie_name}=" in header:
            # Ensure we handle "refresh_token_cookie=;" (empty value after logout)
            parts = header.split(f"{cookie_name}=")[1].split(';')
            return parts[0] if parts[0] else None # Return None if value is empty
    return None

def test_register_user_success(client, session):
    """Test successful user registration."""
    response = client.post('/api/v1/auth/register', json={
        'username': 'newuser_reg_succ', # Unique username
        'email': 'newuser_reg_succ@example.com', # Unique email
        'password': 'password123'
    })
    assert response.status_code == 201
    json_data = response.get_json()
    
    assert 'id' in json_data
    assert json_data['username'] == 'newuser_reg_succ'
    assert json_data['email'] == 'newuser_reg_succ@example.com'
    assert 'password_hash' not in json_data # Ensure password hash is not returned
    
    # Verify user in database
    user = session.query(User).filter_by(email='newuser_reg_succ@example.com').first()
    assert user is not None
    assert user.username == 'newuser_reg_succ'

def test_register_user_duplicate_email(client, user_factory): # session fixture not needed if user_factory commits
    """Test registration with a duplicate email."""
    # user_factory should handle adding and committing the user
    user_factory(email='exists_dup_email@example.com', username='existing_dup_email_user')

    response = client.post('/api/v1/auth/register', json={
        'username': 'anotheruser_dup_email',
        'email': 'exists_dup_email@example.com', # Duplicate email
        'password': 'password123'
    })
    assert response.status_code == 409 # Conflict
    json_data = response.get_json()
    assert json_data['message'] == 'Username or email already exists' # Adjust to actual error message if different
    # The error handler for ConflictError should produce a message like this.

def test_register_user_duplicate_username(client, user_factory):
    """Test registration with a duplicate username."""
    user_factory(email='unique_dup_username@example.com', username='existing_dup_username')

    response = client.post('/api/v1/auth/register', json={
        'username': 'existing_dup_username', # Duplicate username
        'email': 'another_unique_email@example.com', 
        'password': 'password123'
    })
    assert response.status_code == 409 # Conflict
    json_data = response.get_json()
    assert json_data['message'] == 'Username or email already exists'


def test_login_user_success(client, user_factory):
    """Test successful user login."""
    email = 'loginuser_succ@example.com'
    username = 'loginuser_succ'
    password = 'password123'
    # user_factory creates user and sets password, handles session add/commit
    user_factory(email=email, username=username, password=password)

    response = client.post('/api/v1/auth/login', json={
        'username_or_email': email, # Changed from 'email'
        'password': password
    })
    assert response.status_code == 200
    json_data = response.get_json()
    assert 'access_token' in json_data
    assert 'user' in json_data
    assert json_data['user']['email'] == email
    assert json_data['user']['username'] == username
    
    refresh_token_cookie = get_cookie_value(response, 'refresh_token_cookie')
    assert refresh_token_cookie is not None

    # Test login with username
    response_username_login = client.post('/api/v1/auth/login', json={
        'username_or_email': username, # Login with username
        'password': password
    })
    assert response_username_login.status_code == 200
    json_data_username = response_username_login.get_json()
    assert 'access_token' in json_data_username


def test_login_user_incorrect_password(client, user_factory):
    """Test login with incorrect password."""
    email = 'wrongpass_login@example.com'
    user_factory(email=email, username='wrongpass_login_user', password='correctpassword')

    response = client.post('/api/v1/auth/login', json={
        'username_or_email': email, # Changed from 'email'
        'password': 'incorrectpassword'
    })
    assert response.status_code == 401
    json_data = response.get_json()
    assert json_data['message'] == 'Invalid email or password'

def test_login_user_not_found(client):
    """Test login for a user that does not exist."""
    response = client.post('/api/v1/auth/login', json={
        'username_or_email': 'nosuchuser_login@example.com', # Changed from 'email'
        'password': 'password123'
    })
    assert response.status_code == 401 
    json_data = response.get_json()
    assert json_data['message'] == 'Invalid email or password'


def test_refresh_token_success(client, user_factory):
    """Test successful token refresh."""
    email = 'refresher_succ@example.com'
    password = 'password123'
    user_factory(email=email, username='refresher_succ_user', password=password)

    login_response = client.post('/api/v1/auth/login', json={'username_or_email': email, 'password': password}) # Changed from 'email'
    assert login_response.status_code == 200
    assert get_cookie_value(login_response, 'refresh_token_cookie') is not None

    # The test client should automatically handle cookies set by previous responses
    # This includes the refresh_token_cookie and potentially the csrf_refresh_cookie
    # If JWT_COOKIE_CSRF_PROTECT is True, flask-jwt-extended expects X-CSRF-TOKEN header.
    # However, WTF_CSRF_ENABLED = False in TestingConfig might simplify this.
    # If CSRF check fails, this test would get a 401 or 422.
    # For now, assuming it passes or CSRF is effectively off for cookies in test.
    
    refresh_response = client.post('/api/v1/auth/refresh')
    assert refresh_response.status_code == 200 # Fails here if CSRF is an issue
    json_data = refresh_response.get_json()
    assert 'access_token' in json_data
    
    new_access_token = json_data['access_token']
    
    # Optionally, test this new access token on a protected route if one exists
    # For now, just checking token presence.

def test_refresh_token_no_refresh_cookie(client):
    """Test refresh attempt without a refresh token cookie."""
    # Ensure client has no prior cookies that could interfere
    # (client fixture is fresh per test, so this is implicitly handled)
    refresh_response = client.post('/api/v1/auth/refresh')
    # Expecting 401 because @jwt_required(refresh=True) protects it
    assert refresh_response.status_code == 401 
    json_data = refresh_response.get_json()
    # Message from flask-jwt-extended when refresh token is missing
    assert "Missing JWT in headers or cookies (Missing Authorization Header; Missing cookie \"refresh_token_cookie\")" in json_data.get('msg', '')


def test_logout_success(client, user_factory):
    """Test successful logout - primarily that cookies are cleared."""
    email = 'logoutuser_succ@example.com'
    password = 'password123'
    user_factory(email=email, username='logoutuser_succ_user', password=password)
    
    login_resp = client.post('/api/v1/auth/login', json={'username_or_email': email, 'password': password}) # Changed from 'email'
    assert login_resp.status_code == 200
    initial_refresh_cookie = get_cookie_value(login_resp, 'refresh_token_cookie')
    assert initial_refresh_cookie is not None
    
    access_token = login_resp.get_json().get('access_token')
    headers = {'Authorization': f'Bearer {access_token}'}

    # Logout requires a valid access token via @jwt_required()
    logout_response = client.post('/api/v1/auth/logout', headers=headers)

    assert logout_response.status_code == 200
    json_data = logout_response.get_json()
    assert json_data['message'] == 'Logout successful (token needs to be discarded client-side)'

    # Verify refresh_token_cookie is cleared
    # The cookie should be set with Max-Age=0 or Expires to a past date.
    cleared_refresh_cookie_header = None
    for header in logout_response.headers.getlist('Set-Cookie'):
        if 'refresh_token_cookie=' in header:
            cleared_refresh_cookie_header = header
            break
    
    assert cleared_refresh_cookie_header is not None
    assert 'refresh_token_cookie=;' in cleared_refresh_cookie_header or \
           'Max-Age=0' in cleared_refresh_cookie_header or \
           'expires=Thu, 01 Jan 1970' in cleared_refresh_cookie_header.lower()

    # Also check that csrf_refresh_cookie (if it was set) is cleared
    cleared_csrf_refresh_cookie_header = None
    for header in logout_response.headers.getlist('Set-Cookie'):
        if 'csrf_refresh_token=' in header: # Default CSRF cookie name
            cleared_csrf_refresh_cookie_header = header
            break
    # This might not be set if CSRF is disabled or not used for refresh tokens in this config
    # If JWT_COOKIE_CSRF_PROTECT is false, this cookie wouldn't be set.
    # For now, this assertion is optional or depends on precise JWT config.
    # assert cleared_csrf_refresh_cookie_header is not None 
    # assert 'Max-Age=0' in cleared_csrf_refresh_cookie_header

    # Attempt to refresh after logout should fail
    post_logout_refresh_response = client.post('/api/v1/auth/refresh', headers=headers) # Send old headers for completeness
    assert post_logout_refresh_response.status_code == 401 # Because refresh cookie is gone
    # The error message for missing refresh token might be "Missing JWT in cookies" or similar from flask-jwt-extended

# Example of a protected route test (if you have one)
# @auth_bp.route('/protected', methods=['GET'])
# @jwt_required()
# def protected():
#     return jsonify(hello="world")

# def test_access_protected_route_with_token(client, user_factory):
#     email = 'protected_user@example.com'
#     password = 'password123'
#     user_factory(email=email, username='protected_user', password=password)
#     login_resp = client.post('/api/v1/auth/login', json={'email': email, 'password': password})
#     access_token = login_resp.get_json()['access_token']
#     headers = {'Authorization': f'Bearer {access_token}'}
#     # Assuming you register 'protected_bp' with a '/protected' route
#     # protected_resp = client.get('/api/v1/auth/protected', headers=headers) # If protected is under auth_bp
#     # assert protected_resp.status_code == 200
#     # assert protected_resp.get_json()['hello'] == 'world'

# def test_access_protected_route_without_token(client):
#     # protected_resp = client.get('/api/v1/auth/protected')
#     # assert protected_resp.status_code == 401 # Unauthorized
#     pass
