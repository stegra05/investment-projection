import pytest
from flask import json, url_for
from app.models import Portfolio, User # Keep existing imports
from app import db # <-- ADD THIS IMPORT
from tests.utils import get_auth_headers # Keep existing imports

def test_get_portfolio_details_success(logged_in_client, test_portfolio, test_user):
    response = logged_in_client.get(f"/portfolios/{test_portfolio.id}")
    assert response.status_code == 200
    data = response.json()
    assert data['name'] == test_portfolio.name
    assert data['user_id'] == test_user.id
    assert 'assets' in data # Should be included by default per schema
    # Check for the aliased field name used in JSON serialization
    assert 'changes' in data
    # assert 'planned_changes' in data # Original assertion checking the Python field name

def test_get_portfolio_details_not_found(logged_in_client, test_user):
    response = logged_in_client.get(f"/portfolios/{99999}")
    assert response.status_code == 404 

def test_create_portfolio_missing_name(logged_in_client, test_portfolio, test_user):
    response = logged_in_client.post('/api/v1/portfolios', headers=headers, json=portfolio_data)
    assert response.status_code == 400 # Bad Request due to validation schema
    data = response.get_json()
    assert 'validation_error' in data
    # Check that the validation error list contains an error for the 'name' field
    assert isinstance(data['validation_error'], list)
    assert len(data['validation_error']) > 0
    assert data['validation_error'][0]['loc'][0] == 'name'
    # assert 'name' in data['validation_error'] # Original assertion 

def test_create_portfolio_invalid_data(logged_in_client, test_user):
    # ... existing code ... 

def test_update_portfolio_success(logged_in_client, test_user, test_portfolio, db): # <-- ADD db FIXTURE
    """Test successfully updating a portfolio."""
    headers = get_auth_headers(test_user)
    update_data = {
# ... existing code ...
    # Verify in DB
    db.session.refresh(test_portfolio) # Refresh object from DB
    assert test_portfolio.name == update_data['name']
    assert test_portfolio.description == update_data['description']


def test_update_portfolio_partial_patch(logged_in_client, test_user, test_portfolio, db): # <-- ADD db FIXTURE
    """Test partially updating a portfolio using PATCH (should also work with PUT if schema allows)."""
    headers = get_auth_headers(test_user)
    update_data = {
# ... existing code ...
    # Verify in DB
    db.session.refresh(test_portfolio)
    assert test_portfolio.name == original_name
    assert test_portfolio.description == update_data['description']

# ... existing code ... 