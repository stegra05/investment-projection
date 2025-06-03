import pytest
import json
from app.models.user import User
from app.models.portfolio import Portfolio
from app.models.asset import Asset # Needed for allocation tests
from app import db # For direct db interaction
from decimal import Decimal
from app.enums import AssetType, Currency

# Helper to get auth headers
# This can remain in conftest.py if used by multiple test files,
# or be defined here if specific to portfolio tests. For now, let's assume it's here or accessible.
# For the purpose of this task, I'll define it here.
# In a real scenario, it would be in conftest.py
def get_auth_headers_for_user(client, user_factory, session, email, password='password123'):
    # Ensure user exists, or create if not
    user = session.query(User).filter_by(email=email).first()
    if not user:
        user = user_factory(email=email, password=password, username=email.split('@')[0])
        # user_factory should handle add and commit, but if not, explicit commit is needed.
        # Assuming user_factory handles commit for simplicity in this example.
    
    login_response = client.post('/api/v1/auth/login', json={'email': email, 'password': password})
    assert login_response.status_code == 200, f"Login failed for {email}: {login_response.get_data(as_text=True)}"
    access_token = login_response.get_json()['access_token']
    return {'Authorization': f'Bearer {access_token}'}, user # Return user for convenience


@pytest.fixture
def main_user_headers(client, user_factory, session):
    headers, user = get_auth_headers_for_user(client, user_factory, session, 'mainportfolioowner@example.com')
    return headers, user

@pytest.fixture
def other_user_headers(client, user_factory, session):
    headers, user = get_auth_headers_for_user(client, user_factory, session, 'otherportfolioowner@example.com')
    return headers, user


def test_create_portfolio_success(auth_client, session): # session might be needed if checking DB directly
    portfolio_data = {
        "name": "My New Awesome Portfolio",
        "description": "A portfolio for aggressive growth stocks."
    }
    response = auth_client.post('/api/v1/portfolios/', json=portfolio_data)
    assert response.status_code == 201
    data = response.get_json()
    assert data['name'] == "My New Awesome Portfolio"
    assert data['user_id'] == auth_client.user.id
    assert 'portfolio_id' in data

def test_create_portfolio_missing_name(auth_client):
    portfolio_data = {"description": "Only description provided."}
    response = auth_client.post('/api/v1/portfolios/', json=portfolio_data)
    assert response.status_code == 400 # Validation error for missing name

# === Test GET /portfolios/ ===
def test_get_portfolios_list_success(auth_client, portfolio_factory, session):
    user = auth_client.user
    portfolio1 = portfolio_factory(user=user, name="Growth Fund")
    portfolio2 = portfolio_factory(user=user, name="Retirement Savings")
    
    # Create a portfolio for another user to ensure it's not fetched
    other_user = user_factory(email='other_list@example.com', username='other_list_user') # Need user_factory from conftest
    portfolio_factory(user=other_user, name="Other User's List Portfolio")
    session.commit()

    response = auth_client.get('/api/v1/portfolios/')
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) >= 2 # At least the two created for the authenticated user
    portfolio_names = [p['name'] for p in data]
    assert "Growth Fund" in portfolio_names
    assert "Retirement Savings" in portfolio_names
    assert "Other User's List Portfolio" not in portfolio_names

# === Test GET /portfolios/{portfolio_id} ===
def test_get_specific_portfolio_success(auth_client, portfolio_factory, session):
    user = auth_client.user
    portfolio = portfolio_factory(user=user, name="Specific View Portfolio")
    session.commit()

    response = auth_client.get(f'/api/v1/portfolios/{portfolio.portfolio_id}/')
    assert response.status_code == 200
    data = response.get_json()
    assert data['name'] == "Specific View Portfolio"
    assert data['portfolio_id'] == portfolio.portfolio_id

def test_get_specific_portfolio_not_found(auth_client):
    response = auth_client.get('/api/v1/portfolios/888777/') # Non-existent ID
    assert response.status_code == 404

def test_get_specific_portfolio_unauthorized(auth_client, user_factory, portfolio_factory, session):
    other_user = user_factory(email='other_get@example.com', username='other_get_user')
    other_portfolio = portfolio_factory(user=other_user, name="Forbidden Portfolio")
    session.commit()

    response = auth_client.get(f'/api/v1/portfolios/{other_portfolio.portfolio_id}/')
    assert response.status_code == 403 # Or 404 based on decorator behavior

# === Test PUT /portfolios/{portfolio_id} ===
def test_update_portfolio_success(auth_client, portfolio_factory, session):
    user = auth_client.user
    portfolio = portfolio_factory(user=user, name="Old Portfolio Name")
    session.commit()

    update_data = {"name": "Updated Portfolio Name", "description": "New description"}
    response = auth_client.put(f'/api/v1/portfolios/{portfolio.portfolio_id}/', json=update_data)
    assert response.status_code == 200
    data = response.get_json()
    assert data['name'] == "Updated Portfolio Name"
    assert data['description'] == "New description"

def test_update_portfolio_unauthorized(auth_client, user_factory, portfolio_factory, session):
    other_user = user_factory(email='other_put@example.com', username='other_put_user')
    other_portfolio = portfolio_factory(user=other_user, name="Cannot Touch This")
    session.commit()

    update_data = {"name": "Attempted Hack"}
    response = auth_client.put(f'/api/v1/portfolios/{other_portfolio.portfolio_id}/', json=update_data)
    assert response.status_code == 403 # Or 404

# === Test DELETE /portfolios/{portfolio_id} ===
def test_delete_portfolio_success(auth_client, portfolio_factory, session):
    user = auth_client.user
    portfolio_to_delete = portfolio_factory(user=user, name="Doomed Portfolio")
    session.commit()
    portfolio_id_del = portfolio_to_delete.portfolio_id

    response = auth_client.delete(f'/api/v1/portfolios/{portfolio_id_del}/')
    assert response.status_code == 200
    assert response.get_json()['message'] == "Portfolio deleted successfully"
    assert Portfolio.query.get(portfolio_id_del) is None

def test_delete_portfolio_unauthorized(auth_client, user_factory, portfolio_factory, session):
    other_user = user_factory(email='other_delete@example.com', username='other_delete_user')
    other_portfolio = portfolio_factory(user=other_user, name="Safe From Deletion")
    session.commit()

    response = auth_client.delete(f'/api/v1/portfolios/{other_portfolio.portfolio_id}/')
    assert response.status_code == 403 # Or 404

# === Test PUT /portfolios/{portfolio_id}/allocations ===
def test_update_allocations_success(auth_client, portfolio_factory, session):
    user = auth_client.user
    portfolio = portfolio_factory(user=user)
    asset1 = Asset(portfolio_id=portfolio.portfolio_id, name_or_ticker="Stock A", asset_type=AssetType.STOCK, allocation_value=1000)
    asset2 = Asset(portfolio_id=portfolio.portfolio_id, name_or_ticker="Bond B", asset_type=AssetType.BOND, allocation_value=1000)
    session.add_all([asset1, asset2])
    session.commit()

    allocations_data = [
        {"asset_id": asset1.asset_id, "allocation_percentage": 60.0},
        {"asset_id": asset2.asset_id, "allocation_percentage": 40.0}
    ]
    response = auth_client.put(f'/api/v1/portfolios/{portfolio.portfolio_id}/allocations/', json=allocations_data)
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 2
    # Check if percentages are updated in the database or response
    updated_asset1 = Asset.query.get(asset1.asset_id)
    assert updated_asset1.allocation_percentage == Decimal("60.0")

def test_update_allocations_invalid_sum(auth_client, portfolio_factory, session):
    user = auth_client.user
    portfolio = portfolio_factory(user=user)
    asset1 = Asset(portfolio_id=portfolio.portfolio_id, name_or_ticker="Stock C", asset_type=AssetType.STOCK, allocation_value=1000)
    session.add(asset1)
    session.commit()

    allocations_data = [{"asset_id": asset1.asset_id, "allocation_percentage": 110.0}] # Sum > 100
    response = auth_client.put(f'/api/v1/portfolios/{portfolio.portfolio_id}/allocations/', json=allocations_data)
    assert response.status_code == 400
    assert "sum to 100%" in response.get_json()['error'].lower()

def test_update_allocations_asset_id_mismatch(auth_client, portfolio_factory, user_factory, session):
    user = auth_client.user
    portfolio = portfolio_factory(user=user)
    # Create an asset belonging to another portfolio/user to test mismatch
    other_user_for_asset = user_factory(email='assetowner@example.com', username='assetowner')
    other_portfolio_for_asset = portfolio_factory(user=other_user_for_asset)
    mismatched_asset = Asset(portfolio_id=other_portfolio_for_asset.portfolio_id, name_or_ticker="Mismatched Asset", asset_type=AssetType.STOCK, allocation_value=100)
    session.add_all([mismatched_asset])
    session.commit()

    allocations_data = [{"asset_id": mismatched_asset.asset_id, "allocation_percentage": 100.0}]
    response = auth_client.put(f'/api/v1/portfolios/{portfolio.portfolio_id}/allocations/', json=allocations_data)
    assert response.status_code == 400 # Or 404 if asset not found in *current* portfolio
    assert "not belong to portfolio" in response.get_json()['error'].lower()
