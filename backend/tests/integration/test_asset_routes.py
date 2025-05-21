import pytest
import json
from app.models.user import User
from app.models.portfolio import Portfolio
from app.models.asset import Asset
from app.enums import AssetTypes, Currencies 
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


# === Test Create Asset (POST /portfolios/<portfolio_id>/assets/) ===
def test_create_asset_success(client, test_portfolio_for_assets, auth_user_1_asset_test, session):
    user1, headers_user1 = auth_user_1_asset_test
    portfolio_id = test_portfolio_for_assets.id

    asset_data = {
        'name_or_ticker': 'Bitcoin', # Field name from AssetCreateSchema
        'asset_type': AssetTypes.CRYPTO.value,
        'currency': Currencies.USD.value,
        'current_value': Decimal('50000.00'),
        'quantity': Decimal('1.5'),
        'allocation_percentage': Decimal('10.00') # Optional, but good to test
    }
    response = client.post(assets_base_url(portfolio_id), json=asset_data, headers=headers_user1)
    
    assert response.status_code == 201
    json_data = response.get_json()
    assert json_data['name_or_ticker'] == 'Bitcoin'
    assert json_data['asset_type'] == AssetTypes.CRYPTO.value
    assert json_data['portfolio_id'] == portfolio_id
    assert 'asset_id' in json_data # Changed from 'id' to 'asset_id' to match AssetSchema

    asset = session.query(Asset).filter_by(asset_id=json_data['asset_id']).first()
    assert asset is not None
    assert asset.name_or_ticker == 'Bitcoin'
    assert asset.portfolio_id == portfolio_id
    assert asset.allocation_percentage == Decimal('10.00')

def test_create_asset_default_allocation(client, test_portfolio_for_assets, auth_user_1_asset_test, session):
    user1, headers_user1 = auth_user_1_asset_test
    portfolio_id = test_portfolio_for_assets.id
    asset_data = { # No allocation_percentage or allocation_value
        'name_or_ticker': 'Ethereum',
        'asset_type': AssetTypes.CRYPTO.value,
        'currency': Currencies.USD.value,
        'current_value': Decimal('3000.00') 
    }
    response = client.post(assets_base_url(portfolio_id), json=asset_data, headers=headers_user1)
    assert response.status_code == 201
    json_data = response.get_json()
    assert json_data['name_or_ticker'] == 'Ethereum'
    assert json_data['allocation_percentage'] == Decimal('0.00') # Defaulted

    asset_db = session.query(Asset).filter_by(asset_id=json_data['asset_id']).first()
    assert asset_db is not None
    assert asset_db.allocation_percentage == Decimal('0.00')


def test_create_asset_portfolio_not_found_by_decorator(client, auth_user_1_asset_test):
    _ , headers_user1 = auth_user_1_asset_test
    asset_data = {'name_or_ticker': 'Test', 'asset_type': 'STOCK', 'currency': 'USD', 'current_value': 100}
    # verify_portfolio_ownership decorator handles this
    response = client.post(assets_base_url(99999), json=asset_data, headers=headers_user1)
    assert response.status_code == 404 
    assert "Portfolio with id 99999 not found" in response.get_json()['message']

def test_create_asset_unauthorized_portfolio_by_decorator(client, test_portfolio_for_assets, auth_user_2_asset_test):
    _ , headers_user2 = auth_user_2_asset_test
    portfolio_id = test_portfolio_for_assets.id # This portfolio belongs to user_1

    asset_data = {'name_or_ticker': 'Unauthorized', 'asset_type': 'STOCK', 'currency': 'USD', 'current_value': 100}
    # verify_portfolio_ownership decorator handles this
    response = client.post(assets_base_url(portfolio_id), json=asset_data, headers=headers_user2)
    assert response.status_code == 403 
    assert "User does not have permission" in response.get_json()['message']

def test_create_asset_missing_required_data(client, test_portfolio_for_assets, auth_user_1_asset_test):
    _ , headers_user1 = auth_user_1_asset_test
    portfolio_id = test_portfolio_for_assets.id
    asset_data = {'asset_type': AssetTypes.STOCK.value} # Missing name_or_ticker, currency, current_value
    response = client.post(assets_base_url(portfolio_id), json=asset_data, headers=headers_user1)
    assert response.status_code == 400 # Pydantic validation error from AssetCreateSchema
    json_data = response.get_json()
    assert 'errors' in json_data
    error_fields = [err['loc'][0] for err in json_data['errors'] if 'loc' in err and err['loc']]
    assert 'name_or_ticker' in error_fields
    assert 'currency' in error_fields
    assert 'current_value' in error_fields

# === Tests for Update Asset (PUT /portfolios/<portfolio_id>/assets/<asset_id>/) ===
def test_update_asset_success(client, test_portfolio_for_assets, auth_user_1_asset_test, session):
    user1, headers_user1 = auth_user_1_asset_test
    portfolio_id = test_portfolio_for_assets.id
    asset = Asset(portfolio_id=portfolio_id, name_or_ticker='Old Name', asset_type=AssetTypes.STOCK, currency=Currencies.USD, current_value=Decimal('100'))
    session.add(asset)
    session.commit()
    asset_id = asset.asset_id

    update_data = {'name_or_ticker': 'New Updated Name', 'current_value': Decimal('150.50')}
    response = client.put(specific_asset_url(portfolio_id, asset_id), json=update_data, headers=headers_user1)
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['name_or_ticker'] == 'New Updated Name'
    assert json_data['current_value'] == "150.50" # Pydantic serializes Decimal to string by default

    session.refresh(asset)
    assert asset.name_or_ticker == 'New Updated Name'
    assert asset.current_value == Decimal('150.50')

def test_update_asset_portfolio_or_asset_not_found(client, test_portfolio_for_assets, auth_user_1_asset_test):
    _ , headers_user1 = auth_user_1_asset_test
    portfolio_id = test_portfolio_for_assets.id
    # Test with non-existent asset_id
    response_asset_nf = client.put(specific_asset_url(portfolio_id, 999888), json={'name_or_ticker': 'Update Fail'}, headers=headers_user1)
    assert response_asset_nf.status_code == 404 # From get_owned_child_or_404
    assert "Asset with ID 999888 not found in portfolio" in response_asset_nf.get_json()['message']

    # Test with non-existent portfolio_id (decorator handles this)
    response_portfolio_nf = client.put(specific_asset_url(888999, 1), json={'name_or_ticker': 'Update Fail'}, headers=headers_user1)
    assert response_portfolio_nf.status_code == 404
    assert "Portfolio with id 888999 not found" in response_portfolio_nf.get_json()['message']


def test_update_asset_unauthorized_portfolio(client, test_portfolio_for_assets, auth_user_1_asset_test, auth_user_2_asset_test, session):
    user1, _ = auth_user_1_asset_test
    _ , headers_user2 = auth_user_2_asset_test
    portfolio_id_user1 = test_portfolio_for_assets.id # Belongs to user1
    
    asset_user1 = Asset(portfolio_id=portfolio_id_user1, name_or_ticker='User1 Asset Update', asset_type=AssetTypes.STOCK, currency=Currencies.USD, current_value=Decimal('100'))
    session.add(asset_user1)
    session.commit()
    asset_id_user1 = asset_user1.asset_id

    # User2 tries to update asset in User1's portfolio
    response = client.put(specific_asset_url(portfolio_id_user1, asset_id_user1), json={'name_or_ticker': 'Hacked Update'}, headers=headers_user2)
    assert response.status_code == 403 # From @verify_portfolio_ownership

# === Tests for Delete Asset (DELETE /portfolios/<portfolio_id>/assets/<asset_id>/) ===
def test_delete_asset_success(client, test_portfolio_for_assets, auth_user_1_asset_test, session):
    user1, headers_user1 = auth_user_1_asset_test
    portfolio_id = test_portfolio_for_assets.id
    asset_to_delete = Asset(portfolio_id=portfolio_id, name_or_ticker='Deletable', asset_type=AssetTypes.REAL_ESTATE, currency=Currencies.GBP, current_value=Decimal('100000'))
    session.add(asset_to_delete)
    session.commit()
    asset_id = asset_to_delete.asset_id

    response = client.delete(specific_asset_url(portfolio_id, asset_id), headers=headers_user1)
    assert response.status_code == 200
    assert response.get_json()['message'] == 'Asset deleted successfully'

    deleted_asset_db = session.query(Asset).filter_by(asset_id=asset_id).first()
    assert deleted_asset_db is None

def test_delete_asset_unauthorized(client, test_portfolio_for_assets, auth_user_1_asset_test, auth_user_2_asset_test, session):
    user1, _ = auth_user_1_asset_test
    _    , headers_user2 = auth_user_2_asset_test
    portfolio_id_user1 = test_portfolio_for_assets.id
    
    asset_user1 = Asset(portfolio_id=portfolio_id_user1, name_or_ticker='User1 Asset Delete', asset_type=AssetTypes.STOCK, currency=Currencies.USD, current_value=Decimal('100'))
    session.add(asset_user1)
    session.commit()
    asset_id_user1 = asset_user1.asset_id

    response = client.delete(specific_asset_url(portfolio_id_user1, asset_id_user1), headers=headers_user2)
    assert response.status_code == 403 # From @verify_portfolio_ownership

def test_delete_asset_not_found(client, test_portfolio_for_assets, auth_user_1_asset_test):
    _ , headers_user1 = auth_user_1_asset_test
    portfolio_id = test_portfolio_for_assets.id
    response = client.delete(specific_asset_url(portfolio_id, 87654), headers=headers_user1)
    assert response.status_code == 404 # From get_owned_child_or_404
    assert "Asset with ID 87654 not found in portfolio" in response.get_json()['message']


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
