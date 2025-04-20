import pytest
import json
from app.models import User
from flask_jwt_extended import decode_token # To inspect token contents

# --- Registration Tests ---

def test_register_success(client, db):
    """Test successful user registration."""
    response = client.post('/api/v1/auth/register', json={
        'username': 'newuser',
        'email': 'new@example.com',
        'password': 'ComplexP@ssw0rd!'
    })
    assert response.status_code == 201
    data = response.get_json()
    assert data['message'] == "User registered successfully"

    # Verify user exists in DB
    user = User.query.filter_by(username='newuser').first()
    assert user is not None
    assert user.email == 'new@example.com'
    assert user.check_password('ComplexP@ssw0rd!')

def test_register_missing_fields(client):
    """Test registration with missing fields."""
    response = client.post('/api/v1/auth/register', json={
        'username': 'missing_fields_user'
        # Missing email and password
    })
    assert response.status_code == 400
    data = response.get_json()
    assert "Missing username, email, or password" in data['message']

def test_register_weak_password(client):
    """Test registration with a weak password."""
    response = client.post('/api/v1/auth/register', json={
        'username': 'weakpassuser',
        'email': 'weak@example.com',
        'password': 'short'
    })
    assert response.status_code == 400
    data = response.get_json()
    assert "Password must be at least" in data['message'] # Check for length requirement message

def test_register_duplicate_username(client, test_user):
    """Test registration with a duplicate username."""
    response = client.post('/api/v1/auth/register', json={
        'username': test_user.username, # Use existing username
        'email': 'newdup@example.com',
        'password': 'ComplexP@ssw0rd!'
    })
    assert response.status_code == 409
    data = response.get_json()
    assert "Username or email already exists" in data['message']

def test_register_duplicate_email(client, test_user):
    """Test registration with a duplicate email."""
    response = client.post('/api/v1/auth/register', json={
        'username': 'newdupuser',
        'email': test_user.email, # Use existing email
        'password': 'ComplexP@ssw0rd!'
    })
    assert response.status_code == 409
    data = response.get_json()
    assert "Username or email already exists" in data['message']

# --- Login Tests ---

def test_login_success_username(client, test_user):
    """Test successful login using username."""
    response = client.post('/api/v1/auth/login', json={
        'username': test_user.username,
        'password': 'password' # Password from test_user fixture
    })
    assert response.status_code == 200
    data = response.get_json()
    assert 'access_token' in data
    assert data['message'] == "Login successful."
    assert data['user']['username'] == test_user.username
    assert data['user']['email'] == test_user.email
    assert 'Set-Cookie' in response.headers # Check for refresh token cookie
    assert 'refresh_token_cookie' in response.headers['Set-Cookie']
    assert 'HttpOnly' in response.headers['Set-Cookie']

def test_login_success_email(client, test_user):
    """Test successful login using email."""
    response = client.post('/api/v1/auth/login', json={
        'email': test_user.email,
        'password': 'password'
    })
    assert response.status_code == 200
    data = response.get_json()
    assert 'access_token' in data
    assert 'Set-Cookie' in response.headers

def test_login_incorrect_password(client, test_user):
    """Test login with incorrect password."""
    response = client.post('/api/v1/auth/login', json={
        'username': test_user.username,
        'password': 'wrongpassword'
    })
    assert response.status_code == 401
    data = response.get_json()
    assert "Invalid email or password" in data['message']

def test_login_nonexistent_user(client):
    """Test login with a user that does not exist."""
    response = client.post('/api/v1/auth/login', json={
        'username': 'nosuchuser',
        'password': 'password'
    })
    assert response.status_code == 401 # Should be 401 for security (don't reveal user existence)
    data = response.get_json()
    assert "Invalid email or password" in data['message']

def test_login_missing_fields(client):
    """Test login with missing fields."""
    response = client.post('/api/v1/auth/login', json={
        'username': 'testuser'
        # Missing password
    })
    assert response.status_code == 400
    data = response.get_json()
    assert "Missing username/email or password" in data['message']

# --- Refresh Token Test ---

def test_refresh_success(client, test_user):
    """Test successfully refreshing an access token."""
    # 1. Login to get cookies and initial token
    login_res = client.post('/api/v1/auth/login', json={
        'username': test_user.username,
        'password': 'password'
    })
    assert login_res.status_code == 200
    initial_access_token = login_res.get_json()['access_token']

    # 2. Make request to refresh endpoint (cookies are handled by test client)
    #    Need to include CSRF header if enabled (often needed for refresh cookie)
    #    Assuming CSRF is not strictly enforced in default testing config or
    #    that flask_jwt_extended handles it implicitly with cookies.
    #    If CSRF is needed, you might need to extract the CSRF token first.
    refresh_res = client.post('/api/v1/auth/refresh')
    assert refresh_res.status_code == 200
    refresh_data = refresh_res.get_json()
    assert 'access_token' in refresh_data
    new_access_token = refresh_data['access_token']

    # 3. Verify the new token is different and valid
    assert new_access_token != initial_access_token
    decoded_token = decode_token(new_access_token)
    assert decoded_token['sub'] == str(test_user.id)
    assert decoded_token['type'] == 'access' # Check token type

def test_refresh_requires_refresh_token(client):
    """Test refresh endpoint requires a valid refresh token (cookie)."""
    # Try accessing refresh without logging in (no cookie)
    refresh_res = client.post('/api/v1/auth/refresh')
    # Expect 401 Unauthorized (or 422 if CSRF fails)
    assert refresh_res.status_code == 401
    assert "Missing cookie" in refresh_res.get_json().get("msg", "") # Adjust based on actual error

def test_refresh_with_access_token(client, test_user):
    """Test refresh endpoint rejects access tokens."""
    # 1. Login to get an access token
    login_res = client.post('/api/v1/auth/login', json={
        'username': test_user.username,
        'password': 'password'
    })
    access_token = login_res.get_json()['access_token']
    headers = {
        'Authorization': f'Bearer {access_token}'
    }

    # 2. Attempt refresh using the access token in header
    refresh_res = client.post('/api/v1/auth/refresh', headers=headers)
    # Expect 422 Unprocessable Entity as only refresh tokens are valid
    assert refresh_res.status_code == 422
    assert "Only refresh tokens are allowed" in refresh_res.get_json().get("msg", "")


# --- Logout Test ---

def test_logout_success(client, test_user):
    """Test successful logout (requires valid access token)."""
    # 1. Login to get access token
    login_res = client.post('/api/v1/auth/login', json={
        'username': test_user.username,
        'password': 'password'
    })
    access_token = login_res.get_json()['access_token']
    headers = {
        'Authorization': f'Bearer {access_token}'
    }

    # 2. Call logout with the token
    logout_res = client.post('/api/v1/auth/logout', headers=headers)
    assert logout_res.status_code == 200
    assert "Logout successful" in logout_res.get_json()['message']
    # Note: This doesn't test token invalidation (requires blocklist). It tests endpoint access.
    # TODO: Check if refresh cookie is unset in the response headers if implemented
    # assert 'refresh_token_cookie=;' in logout_res.headers.getlist('Set-Cookie')

def test_logout_requires_auth(client):
    """Test that logout endpoint requires authentication."""
    logout_res = client.post('/api/v1/auth/logout')
    assert logout_res.status_code == 401 # Unauthorized
    assert "Missing Authorization Header" in logout_res.get_json().get("msg", "") 