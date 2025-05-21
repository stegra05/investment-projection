import pytest
import json
from app.models.user import User
from app.models.portfolio import Portfolio
from app.models.asset import Asset # Needed for allocation tests
from app import db # For direct db interaction
from decimal import Decimal

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


def test_create_portfolio_success(client, main_user_headers, session):
    auth_headers, user = main_user_headers
    response = client.post('/api/v1/portfolios/', json={ # Added trailing slash
        'name': 'Growth Portfolio',
        'description': 'Focus on tech stocks',
        'currency': 'USD' 
    }, headers=auth_headers)
    assert response.status_code == 201
    json_data = response.get_json()
    assert json_data['name'] == 'Growth Portfolio'
    assert json_data['description'] == 'Focus on tech stocks'
    assert json_data['currency'] == 'USD'
    assert 'id' in json_data
    assert json_data['user_id'] == user.id

    portfolio_db = session.query(Portfolio).filter_by(id=json_data['id']).first()
    assert portfolio_db is not None
    assert portfolio_db.name == 'Growth Portfolio'
    assert portfolio_db.user_id == user.id

def test_create_portfolio_missing_name(client, main_user_headers):
    auth_headers, _ = main_user_headers
    response = client.post('/api/v1/portfolios/', json={ # Trailing slash
        'description': 'Portfolio without a name',
        'currency': 'EUR'
    }, headers=auth_headers)
    assert response.status_code == 400 # Or 422 if Pydantic validation error handler is more specific
    json_data = response.get_json()
    # Assuming error structure like: {"errors": [{"field": "name", "message": "Missing data for required field."}]}
    # This depends on how @handle_api_errors formats Pydantic validation errors.
    assert 'errors' in json_data
    assert any(err.get('loc') and 'name' in err.get('loc') for err in json_data['errors'])


def test_create_portfolio_no_auth(client):
    response = client.post('/api/v1/portfolios/', json={'name': 'No Auth Portfolio', 'currency': 'USD'}) # Trailing slash
    assert response.status_code == 401


def test_get_portfolios_list_success(client, main_user_headers, user_factory, session):
    auth_headers, user = main_user_headers
    
    # Create portfolios for the main user
    p1 = Portfolio(name='Main User Portfolio 1', user_id=user.id, currency='USD')
    p2 = Portfolio(name='Main User Portfolio 2', user_id=user.id, currency='EUR')
    session.add_all([p1, p2])
    
    # Create portfolio for another user
    _, other_user = get_auth_headers_for_user(client, user_factory, session, 'listtestother@example.com')
    p_other = Portfolio(name='Other User Portfolio', user_id=other_user.id, currency='JPY')
    session.add(p_other)
    session.commit()

    response = client.get('/api/v1/portfolios/', headers=auth_headers) # Trailing slash
    assert response.status_code == 200
    json_data = response.get_json()
    
    assert 'data' in json_data
    assert 'pagination' in json_data
    portfolios_data = json_data['data']
    
    assert isinstance(portfolios_data, list)
    # The number of portfolios depends on previous tests if DB is not cleared.
    # For robust test, ensure clean state or check specifically for p1, p2.
    
    main_user_portfolio_names = {p['name'] for p in portfolios_data if p['user_id'] == user.id}
    
    # Check that only the main user's portfolios are listed (or at least those created in this test)
    # This assertion might be tricky if other tests for the same user ran before.
    # A more robust way is to count or specifically find the ones created.
    # For this example, assuming we expect at least these two.
    assert 'Main User Portfolio 1' in main_user_portfolio_names
    assert 'Main User Portfolio 2' in main_user_portfolio_names
    
    # Ensure other user's portfolio is NOT listed
    for p_data in portfolios_data:
        assert p_data['name'] != 'Other User Portfolio'

def test_get_specific_portfolio_success(client, main_user_headers, session):
    auth_headers, user = main_user_headers
    portfolio = Portfolio(name='Specific Get Test', user_id=user.id, currency='GBP')
    session.add(portfolio)
    session.commit()

    response = client.get(f'/api/v1/portfolios/{portfolio.id}/', headers=auth_headers) # Trailing slash
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['id'] == portfolio.id
    assert json_data['name'] == 'Specific Get Test'

def test_get_specific_portfolio_not_found(client, main_user_headers):
    auth_headers, _ = main_user_headers
    response = client.get('/api/v1/portfolios/999999/', headers=auth_headers) # Trailing slash, non-existent ID
    assert response.status_code == 404 # As per @verify_portfolio_ownership raising PortfolioNotFoundError

def test_get_specific_portfolio_unauthorized(client, main_user_headers, other_user_headers, session):
    main_headers, main_user = main_user_headers
    other_headers, other_user = other_user_headers

    # Portfolio owned by main_user
    owned_portfolio = Portfolio(name="Main's Private Portfolio", user_id=main_user.id, currency='USD')
    session.add(owned_portfolio)
    session.commit()

    # other_user tries to access it
    response = client.get(f'/api/v1/portfolios/{owned_portfolio.id}/', headers=other_headers) # Trailing slash
    assert response.status_code == 403 # AccessDeniedError from @verify_portfolio_ownership

def test_update_portfolio_success(client, main_user_headers, session):
    auth_headers, user = main_user_headers
    portfolio = Portfolio(name='Original Update Name', user_id=user.id, currency='CAD')
    session.add(portfolio)
    session.commit()

    update_data = {'name': 'Updated Portfolio Name', 'currency': 'CHF'}
    response = client.put(f'/api/v1/portfolios/{portfolio.id}/', json=update_data, headers=auth_headers) # Trailing slash
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['name'] == 'Updated Portfolio Name'
    assert json_data['currency'] == 'CHF'

    session.refresh(portfolio)
    assert portfolio.name == 'Updated Portfolio Name'
    assert portfolio.currency == 'CHF'

def test_update_portfolio_unauthorized(client, main_user_headers, other_user_headers, session):
    main_headers, main_user = main_user_headers
    other_headers, other_user = other_user_headers

    owned_portfolio = Portfolio(name="Main's Update Target", user_id=main_user.id, currency='USD')
    session.add(owned_portfolio)
    session.commit()

    response = client.put(f'/api/v1/portfolios/{owned_portfolio.id}/', json={'name': 'Attempted Hack'}, headers=other_headers)
    assert response.status_code == 403 # AccessDeniedError

def test_delete_portfolio_success(client, main_user_headers, session):
    auth_headers, user = main_user_headers
    portfolio_to_delete = Portfolio(name='Delete Me Portfolio', user_id=user.id, currency='AUD')
    session.add(portfolio_to_delete)
    session.commit()
    portfolio_id = portfolio_to_delete.id

    response = client.delete(f'/api/v1/portfolios/{portfolio_id}/', headers=auth_headers) # Trailing slash
    assert response.status_code == 200
    assert response.get_json()['message'] == 'Portfolio deleted successfully'

    deleted_portfolio_db = session.query(Portfolio).filter_by(id=portfolio_id).first()
    assert deleted_portfolio_db is None

def test_delete_portfolio_unauthorized(client, main_user_headers, other_user_headers, session):
    main_headers, main_user = main_user_headers
    other_headers, other_user = other_user_headers

    owned_portfolio = Portfolio(name="Main's Delete Target", user_id=main_user.id, currency='USD')
    session.add(owned_portfolio)
    session.commit()

    response = client.delete(f'/api/v1/portfolios/{owned_portfolio.id}/', headers=other_headers) # Trailing slash
    assert response.status_code == 403 # AccessDeniedError


# --- Tests for Allocation Update Route ---
def test_update_allocations_success(client, main_user_headers, session):
    auth_headers, user = main_user_headers
    portfolio = Portfolio(name='Allocation Test Portfolio', user_id=user.id, currency='USD')
    asset1 = Asset(portfolio_id=portfolio.id, name_or_ticker='AssetA', asset_type='STOCK', current_value=Decimal('1000'))
    asset2 = Asset(portfolio_id=portfolio.id, name_or_ticker='AssetB', asset_type='BOND', current_value=Decimal('1000'))
    portfolio.assets = [asset1, asset2] # Associate assets
    session.add_all([portfolio, asset1, asset2])
    session.commit()
    
    # Refresh to get asset_ids if they are auto-incremented and not set before commit
    session.refresh(asset1)
    session.refresh(asset2)

    allocations_payload = {
        "allocations": [
            {"asset_id": asset1.asset_id, "allocation_percentage": Decimal("60.00")},
            {"asset_id": asset2.asset_id, "allocation_percentage": Decimal("40.00")}
        ]
    }
    
    response = client.put(f'/api/v1/portfolios/{portfolio.id}/allocations/', json=allocations_payload, headers=auth_headers)
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['message'] == 'Allocations updated successfully'

    session.refresh(asset1)
    session.refresh(asset2)
    assert asset1.allocation_percentage == Decimal("60.00")
    assert asset1.allocation_value is None # Should be nulled out
    assert asset2.allocation_percentage == Decimal("40.00")
    assert asset2.allocation_value is None

def test_update_allocations_invalid_sum(client, main_user_headers, session):
    auth_headers, user = main_user_headers
    portfolio = Portfolio(name='Alloc Invalid Sum', user_id=user.id, currency='USD')
    asset1 = Asset(portfolio_id=portfolio.id, name_or_ticker='AssetC', asset_type='STOCK')
    portfolio.assets = [asset1]
    session.add_all([portfolio, asset1])
    session.commit()
    session.refresh(asset1)

    allocations_payload = {
        "allocations": [{"asset_id": asset1.asset_id, "allocation_percentage": Decimal("50.00")}] # Sum not 100%
    }
    response = client.put(f'/api/v1/portfolios/{portfolio.id}/allocations/', json=allocations_payload, headers=auth_headers)
    assert response.status_code == 400 # Bad request due to Pydantic schema validation on sum
    json_data = response.get_json()
    assert 'errors' in json_data
    assert any("Total allocation must be 100%" in err.get('msg', '') for err in json_data['errors'])

def test_update_allocations_asset_id_mismatch(client, main_user_headers, session):
    auth_headers, user = main_user_headers
    portfolio = Portfolio(name='Alloc Mismatch', user_id=user.id, currency='USD')
    asset1 = Asset(portfolio_id=portfolio.id, name_or_ticker='AssetD', asset_type='STOCK')
    # asset2 = Asset(portfolio_id=portfolio.id, name_or_ticker='AssetE', asset_type='BOND')
    portfolio.assets = [asset1] # Only asset1 in portfolio
    session.add_all([portfolio, asset1])
    session.commit()
    session.refresh(asset1)

    allocations_payload = {
        "allocations": [
            {"asset_id": asset1.asset_id, "allocation_percentage": Decimal("50.00")},
            {"asset_id": 9999, "allocation_percentage": Decimal("50.00")} # Asset 9999 not in portfolio
        ]
    }
    response = client.put(f'/api/v1/portfolios/{portfolio.id}/allocations/', json=allocations_payload, headers=auth_headers)
    assert response.status_code == 400 # Bad request due to _validate_bulk_allocation_data
    json_data = response.get_json()
    assert "Asset IDs in payload do not exactly match assets in portfolio." in json_data.get('message', '')
    assert "Extra: [9999]" in json_data.get('message', '')
    
# TODO: Add tests for pagination, sorting, filtering on GET /portfolios/
# TODO: Add tests for 'include' parameter on GET /portfolios/<id>/
# TODO: Add tests for other validation errors (e.g., invalid currency enum) on create/update.
