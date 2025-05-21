import pytest
import json
from app.models.user import User
from app.models.portfolio import Portfolio
from app.models.asset import Asset
from app.enums import AssetType, Currency 
from app import db 
from decimal import Decimal

# Fixtures for authenticated users (can be moved to conftest.py if shared)
@pytest.fixture
def auth_user_1_asset_test(client, user_factory, session):
    email = 'assetowner1_assets@example.com'
    user = session.query(User).filter_by(email=email).first()
    if not user:
        user = user_factory(email=email, password='password123', username='assetowner1_assets')
    
    login_response = client.post('/api/v1/auth/login', json={'email': email, 'password': 'password123'})
    access_token = login_response.get_json()['access_token']
    return user, {'Authorization': f'Bearer {access_token}'}

@pytest.fixture
def auth_user_2_asset_test(client, user_factory, session):
    email = 'assetowner2_assets@example.com'
    user = session.query(User).filter_by(email=email).first()
    if not user:
        user = user_factory(email=email, password='password456', username='assetowner2_assets')
    
    login_response = client.post('/api/v1/auth/login', json={'email': email, 'password': 'password456'})
    access_token = login_response.get_json()['access_token']
    return user, {'Authorization': f'Bearer {access_token}'}

@pytest.fixture
def test_portfolio_for_assets(session, auth_user_1_asset_test):
    user1, _ = auth_user_1_asset_test
    portfolio = Portfolio(name="Asset Test Portfolio", user_id=user1.id, currency="USD")
    session.add(portfolio)
    session.commit()
    return portfolio

# Base URL for assets of a given portfolio
def assets_base_url(portfolio_id):
    return f'/api/v1/portfolios/{portfolio_id}/assets/'

def specific_asset_url(portfolio_id, asset_id):
    return f'/api/v1/portfolios/{portfolio_id}/assets/{asset_id}/'


# === Test POST /portfolios/{portfolio_id}/assets ===
def test_create_asset_success(auth_client, portfolio_factory, session):
    user = auth_client.user
    portfolio = portfolio_factory(user=user)
    asset_data = {
        "name": "New Test Asset",
        "asset_type": AssetType.STOCK.value,
        "currency": Currency.USD.value,
        "current_value": 1000.00,
        "quantity": 10.5,
        "expected_annual_return": 7.5, # Percentage
        "target_allocation_percentage": 50.0 # Percentage
    }
    response = auth_client.post(f'/portfolios/{portfolio.portfolio_id}/assets', json=asset_data)
    assert response.status_code == 201
    data = response.get_json()
    assert data['name'] == "New Test Asset"
    assert data['portfolio_id'] == portfolio.portfolio_id
    assert data['asset_type'] == AssetType.STOCK.value

def test_create_asset_default_allocation(auth_client, portfolio_factory, session):
    user = auth_client.user
    portfolio = portfolio_factory(user=user)
    asset_data = {
        "name": "Asset With Default Allocation",
        "asset_type": AssetType.BOND.value,
        "currency": Currency.EUR.value,
        "current_value": 500.00
        # No target_allocation_percentage, should default to 0 or handle as per model/service logic
    }
    response = auth_client.post(f'/portfolios/{portfolio.portfolio_id}/assets', json=asset_data)
    assert response.status_code == 201
    data = response.get_json()
    assert data['name'] == "Asset With Default Allocation"
    assert data['target_allocation_percentage'] is not None # Check based on actual default behavior

def test_create_asset_portfolio_not_found_by_decorator(auth_client):
    asset_data = {"name": "Test Asset", "asset_type": "STOCK", "currency": "USD", "current_value": 100}
    response = auth_client.post('/portfolios/99999/assets', json=asset_data)
    assert response.status_code == 404 # Due to @verify_portfolio_ownership

def test_create_asset_unauthorized_portfolio_by_decorator(auth_client, user_factory, portfolio_factory, session):
    other_user = user_factory(username='otherassetuser', email='otherasset@example.com')
    other_portfolio = portfolio_factory(user=other_user)
    asset_data = {"name": "Test Asset", "asset_type": "STOCK", "currency": "USD", "current_value": 100}
    response = auth_client.post(f'/portfolios/{other_portfolio.portfolio_id}/assets', json=asset_data)
    assert response.status_code == 403 # Due to @verify_portfolio_ownership

def test_create_asset_missing_required_data(auth_client, portfolio_factory):
    user = auth_client.user
    portfolio = portfolio_factory(user=user)
    asset_data = {"asset_type": AssetType.STOCK.value} # Missing name, currency, current_value
    response = auth_client.post(f'/portfolios/{portfolio.portfolio_id}/assets', json=asset_data)
    assert response.status_code == 400 # Validation error

# === Test PUT /portfolios/{portfolio_id}/assets/{asset_id} ===
def test_update_asset_success(auth_client, portfolio_factory, session):
    user = auth_client.user
    portfolio = portfolio_factory(user=user)
    asset = Asset(name="Original Name", asset_type=AssetType.STOCK, currency=Currency.USD, current_value=100, portfolio_id=portfolio.portfolio_id)
    session.add(asset)
    session.commit()

    update_data = {"name": "Updated Asset Name", "current_value": 150.00}
    response = auth_client.put(f'/portfolios/{portfolio.portfolio_id}/assets/{asset.asset_id}', json=update_data)
    assert response.status_code == 200
    data = response.get_json()
    assert data['name'] == "Updated Asset Name"
    assert data['current_value'] == 150.00

def test_update_asset_portfolio_or_asset_not_found(auth_client):
    # Test with non-existent portfolio
    response_portfolio_nf = auth_client.put('/portfolios/99999/assets/1', json={"name": "Fail"})
    assert response_portfolio_nf.status_code == 404

    # Test with existing portfolio but non-existent asset
    portfolio = portfolio_factory(user=auth_client.user) # Need portfolio_factory and auth_client.user
    session.commit() # Ensure portfolio is saved
    response_asset_nf = auth_client.put(f'/portfolios/{portfolio.portfolio_id}/assets/99999', json={"name": "Fail"})
    assert response_asset_nf.status_code == 404

def test_update_asset_unauthorized_portfolio(auth_client, user_factory, portfolio_factory, session):
    other_user = user_factory(username='otherupdateuser', email='otherupdate@example.com')
    other_portfolio = portfolio_factory(user=other_user)
    asset_other = Asset(name="Other's Asset", asset_type=AssetType.STOCK, currency=Currency.USD, current_value=50, portfolio_id=other_portfolio.portfolio_id)
    session.add(asset_other)
    session.commit()

    response = auth_client.put(f'/portfolios/{other_portfolio.portfolio_id}/assets/{asset_other.asset_id}', json={"name": "Attempted Update"})
    assert response.status_code == 403

# === Test DELETE /portfolios/{portfolio_id}/assets/{asset_id} ===
def test_delete_asset_success(auth_client, portfolio_factory, session):
    user = auth_client.user
    portfolio = portfolio_factory(user=user)
    asset_to_delete = Asset(name="To Delete", asset_type=AssetType.STOCK, currency=Currency.USD, current_value=200, portfolio_id=portfolio.portfolio_id)
    session.add(asset_to_delete)
    session.commit()
    asset_id_del = asset_to_delete.asset_id

    response = auth_client.delete(f'/portfolios/{portfolio.portfolio_id}/assets/{asset_id_del}')
    assert response.status_code == 200
    assert response.get_json()['message'] == "Asset deleted successfully"
    assert Asset.query.get(asset_id_del) is None

def test_delete_asset_unauthorized(auth_client, user_factory, portfolio_factory, session):
    other_user = user_factory(username='otherdeleteuser', email='otherdelete@example.com')
    other_portfolio = portfolio_factory(user=other_user)
    asset_other_del = Asset(name="Other's Asset To Delete", asset_type=AssetType.STOCK, currency=Currency.USD, current_value=50, portfolio_id=other_portfolio.portfolio_id)
    session.add(asset_other_del)
    session.commit()

    response = auth_client.delete(f'/portfolios/{other_portfolio.portfolio_id}/assets/{asset_other_del.asset_id}')
    assert response.status_code == 403

def test_delete_asset_not_found(auth_client, portfolio_factory, session):
    user = auth_client.user
    portfolio = portfolio_factory(user=user)
    # Non-existent asset ID
    response = auth_client.delete(f'/portfolios/{portfolio.portfolio_id}/assets/99998')
    assert response.status_code == 404


# Note: GET routes (list assets, get specific asset) are NOT in the provided assets.py
# If they were, tests would look like this (adapted from example):
# def test_get_assets_for_portfolio(client, test_portfolio_for_assets, auth_user_1_asset_test, session):
#     # ... setup ...
#     # response = client.get(assets_base_url(portfolio_id), headers=headers_user1)
#     # ... assertions ...
#     pass

# def test_get_specific_asset_success(client, test_portfolio_for_assets, auth_user_1_asset_test, session):
#     # ... setup ...
#     # response = client.get(specific_asset_url(portfolio_id, asset.id), headers=headers_user1)
#     # ... assertions ...
#     pass
