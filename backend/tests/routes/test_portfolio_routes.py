import pytest
import json
from app.models import Portfolio, User
from flask_jwt_extended import create_access_token

# Helper to get auth headers
def get_auth_headers(user):
    access_token = create_access_token(identity=str(user.id))
    return {'Authorization': f'Bearer {access_token}'}

# --- GET /portfolios Tests ---

def test_get_portfolios_success(logged_in_client, test_user, test_portfolio):
    """Test successfully retrieving portfolios for the logged-in user."""
    # test_portfolio fixture already created one portfolio for test_user
    headers = get_auth_headers(test_user)
    response = logged_in_client.get('/api/v1/portfolios', headers=headers)

    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) >= 1 # Should have at least the one from the fixture
    # Check if the portfolio created by the fixture is present
    portfolio_found = any(p['portfolio_id'] == test_portfolio.portfolio_id for p in data)
    assert portfolio_found
    # Check basic structure of the first portfolio item
    if data:
        assert 'portfolio_id' in data[0]
        assert 'name' in data[0]
        assert 'user_id' in data[0]
        assert data[0]['user_id'] == test_user.id

def test_get_portfolios_no_auth(client):
    """Test that getting portfolios requires authentication."""
    response = client.get('/api/v1/portfolios')
    assert response.status_code == 401 # Unauthorized

# --- POST /portfolios Tests ---

def test_create_portfolio_success(logged_in_client, test_user):
    """Test successfully creating a new portfolio."""
    headers = get_auth_headers(test_user)
    portfolio_data = {
        'name': 'New Investment Portfolio',
        'description': 'My new collection of assets.'
    }
    response = logged_in_client.post('/api/v1/portfolios', headers=headers, json=portfolio_data)

    assert response.status_code == 201
    data = response.get_json()
    assert data['name'] == portfolio_data['name']
    assert data['description'] == portfolio_data['description']
    assert data['user_id'] == test_user.id
    assert 'portfolio_id' in data

    # Verify in DB
    portfolio = Portfolio.query.get(data['portfolio_id'])
    assert portfolio is not None
    assert portfolio.name == portfolio_data['name']
    assert portfolio.user_id == test_user.id

def test_create_portfolio_missing_name(logged_in_client, test_user):
    """Test creating a portfolio with missing required field (name)."""
    headers = get_auth_headers(test_user)
    portfolio_data = {
        'description': 'Nameless portfolio'
    }
    response = logged_in_client.post('/api/v1/portfolios', headers=headers, json=portfolio_data)
    assert response.status_code == 400 # Bad Request due to validation schema
    data = response.get_json()
    assert 'validation_error' in data
    assert 'name' in data['validation_error'] # Field name should be in error details

def test_create_portfolio_no_auth(client):
    """Test that creating a portfolio requires authentication."""
    portfolio_data = {'name': 'Unauthorized Portfolio'}
    response = client.post('/api/v1/portfolios', json=portfolio_data)
    assert response.status_code == 401 # Unauthorized

# --- GET /portfolios/<id> Tests ---

def test_get_portfolio_details_success(logged_in_client, test_user, test_portfolio):
    """Test getting details of a specific portfolio owned by the user."""
    headers = get_auth_headers(test_user)
    response = logged_in_client.get(f'/api/v1/portfolios/{test_portfolio.portfolio_id}', headers=headers)

    assert response.status_code == 200
    data = response.get_json()
    assert data['portfolio_id'] == test_portfolio.portfolio_id
    assert data['name'] == test_portfolio.name
    assert data['user_id'] == test_user.id
    assert 'assets' in data # Should be included by default per schema
    assert 'planned_changes' in data

def test_get_portfolio_details_not_found(logged_in_client, test_user):
    """Test getting details for a non-existent portfolio ID."""
    headers = get_auth_headers(test_user)
    response = logged_in_client.get('/api/v1/portfolios/9999', headers=headers)
    assert response.status_code == 404

def test_get_portfolio_details_forbidden(logged_in_client, db, test_portfolio):
    """Test getting details of a portfolio owned by another user."""
    # Create another user
    other_user = User(username='otheruser', email='other@example.com')
    other_user.set_password('password')
    db.session.add(other_user)
    db.session.commit()

    # Log in as other_user
    other_access_token = create_access_token(identity=str(other_user.id))
    other_headers = {'Authorization': f'Bearer {other_access_token}'}

    # Try to access test_portfolio (owned by test_user)
    response = logged_in_client.get(f'/api/v1/portfolios/{test_portfolio.portfolio_id}', headers=other_headers)
    assert response.status_code == 403 # Forbidden

def test_get_portfolio_details_no_auth(client, test_portfolio):
    """Test that getting portfolio details requires authentication."""
    response = client.get(f'/api/v1/portfolios/{test_portfolio.portfolio_id}')
    assert response.status_code == 401 # Unauthorized

# --- PUT /portfolios/<id> Tests ---

def test_update_portfolio_success(logged_in_client, test_user, test_portfolio):
    """Test successfully updating a portfolio."""
    headers = get_auth_headers(test_user)
    update_data = {
        'name': 'Updated Portfolio Name',
        'description': 'Updated description here.'
    }
    response = logged_in_client.put(f'/api/v1/portfolios/{test_portfolio.portfolio_id}', headers=headers, json=update_data)

    assert response.status_code == 200
    data = response.get_json()
    assert data['portfolio_id'] == test_portfolio.portfolio_id
    assert data['name'] == update_data['name']
    assert data['description'] == update_data['description']

    # Verify in DB
    db.session.refresh(test_portfolio) # Refresh object from DB
    assert test_portfolio.name == update_data['name']
    assert test_portfolio.description == update_data['description']

def test_update_portfolio_partial_patch(logged_in_client, test_user, test_portfolio):
    """Test partially updating a portfolio using PATCH (should also work with PUT if schema allows)."""
    headers = get_auth_headers(test_user)
    update_data = {
        'description': 'Only description updated.'
    }
    original_name = test_portfolio.name
    response = logged_in_client.patch(f'/api/v1/portfolios/{test_portfolio.portfolio_id}', headers=headers, json=update_data)

    assert response.status_code == 200
    data = response.get_json()
    assert data['portfolio_id'] == test_portfolio.portfolio_id
    assert data['name'] == original_name # Name should remain unchanged
    assert data['description'] == update_data['description']

    # Verify in DB
    db.session.refresh(test_portfolio)
    assert test_portfolio.name == original_name
    assert test_portfolio.description == update_data['description']

def test_update_portfolio_forbidden(logged_in_client, db, test_portfolio):
    """Test updating a portfolio owned by another user."""
    # Create and log in as another user
    other_user = User(username='otheruser2', email='other2@example.com')
    other_user.set_password('password')
    db.session.add(other_user)
    db.session.commit()
    other_headers = get_auth_headers(other_user)

    update_data = {'name': 'Forbidden Update'}
    response = logged_in_client.put(f'/api/v1/portfolios/{test_portfolio.portfolio_id}', headers=other_headers, json=update_data)
    assert response.status_code == 403 # Forbidden

def test_update_portfolio_not_found(logged_in_client, test_user):
    """Test updating a non-existent portfolio."""
    headers = get_auth_headers(test_user)
    update_data = {'name': 'Wont Update'}
    response = logged_in_client.put('/api/v1/portfolios/9999', headers=headers, json=update_data)
    assert response.status_code == 404 # Not Found

def test_update_portfolio_no_auth(client, test_portfolio):
    """Test that updating requires authentication."""
    update_data = {'name': 'Unauthorized Update'}
    response = client.put(f'/api/v1/portfolios/{test_portfolio.portfolio_id}', json=update_data)
    assert response.status_code == 401 # Unauthorized

# --- DELETE /portfolios/<id> Tests ---

def test_delete_portfolio_success(logged_in_client, test_user, test_portfolio):
    """Test successfully deleting a portfolio."""
    headers = get_auth_headers(test_user)
    portfolio_id_to_delete = test_portfolio.portfolio_id

    response = logged_in_client.delete(f'/api/v1/portfolios/{portfolio_id_to_delete}', headers=headers)
    assert response.status_code == 200
    data = response.get_json()
    assert "Portfolio deleted successfully" in data['message']

    # Verify in DB
    deleted_portfolio = Portfolio.query.get(portfolio_id_to_delete)
    assert deleted_portfolio is None

def test_delete_portfolio_forbidden(logged_in_client, db, test_portfolio):
    """Test deleting a portfolio owned by another user."""
    # Create and log in as another user
    other_user = User(username='otheruser3', email='other3@example.com')
    other_user.set_password('password')
    db.session.add(other_user)
    db.session.commit()
    other_headers = get_auth_headers(other_user)

    response = logged_in_client.delete(f'/api/v1/portfolios/{test_portfolio.portfolio_id}', headers=other_headers)
    assert response.status_code == 403 # Forbidden

def test_delete_portfolio_not_found(logged_in_client, test_user):
    """Test deleting a non-existent portfolio."""
    headers = get_auth_headers(test_user)
    response = logged_in_client.delete('/api/v1/portfolios/9999', headers=headers)
    assert response.status_code == 404 # Not Found

def test_delete_portfolio_no_auth(client, test_portfolio):
    """Test that deleting requires authentication."""
    response = client.delete(f'/api/v1/portfolios/{test_portfolio.portfolio_id}')
    assert response.status_code == 401 # Unauthorized 