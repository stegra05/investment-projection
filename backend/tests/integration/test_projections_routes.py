import pytest
import json
from datetime import date, timedelta
from app.models.user import User
from app.models.portfolio import Portfolio
from app.models.user_celery_task import UserCeleryTask # For mocking its creation
from app import db 
from unittest.mock import patch, MagicMock
from decimal import Decimal
from app.enums import ChangeType, ValueType, Currency # For draft changes

# Fixtures
@pytest.fixture
def auth_user_proj(client, user_factory, session):
    email = 'projectionuser_proj@example.com'
    user = session.query(User).filter_by(email=email).first()
    if not user:
        user = user_factory(email=email, password='password123', username='projectionuser_proj')
    
    login_response = client.post('/api/v1/auth/login', json={'email': email, 'password': 'password123'})
    access_token = login_response.get_json()['access_token']
    return user, {'Authorization': f'Bearer {access_token}'}

@pytest.fixture
def other_user_proj(client, user_factory, session):
    email = 'otherprojuser_proj@example.com'
    user = session.query(User).filter_by(email=email).first()
    if not user:
        user = user_factory(email=email, password='password456', username='otherprojuser_proj')
    
    login_response = client.post('/api/v1/auth/login', json={'email': email, 'password': 'password456'})
    access_token = login_response.get_json()['access_token']
    return user, {'Authorization': f'Bearer {access_token}'}

@pytest.fixture
def portfolio_for_proj(session, auth_user_proj):
    user, _ = auth_user_proj
    portfolio = Portfolio(name="Projection Test Portfolio", user_id=user.id, currency="EUR")
    session.add(portfolio)
    session.commit()
    return portfolio

# === Tests for POST /portfolios/<portfolio_id>/projections (Async Task) ===

@patch('app.routes.projections.db.session.commit') # Mock commit for UserCeleryTask
@patch('app.routes.projections.UserCeleryTask.create_task_for_user')
@patch('app.routes.projections.run_projection_task.delay')
def test_create_projection_async_success(
    mock_task_delay, mock_create_user_task, mock_db_commit,
    client, portfolio_for_proj, auth_user_proj
):
    user, headers = auth_user_proj
    portfolio_id = portfolio_for_proj.id

    projection_params = {
        'start_date': str(date(2024, 1, 1)),
        'end_date': str(date(2029, 12, 31)),
        'initial_total_value': "100000.00", # Send as string, as per route
    }
    
    mock_task_delay.return_value = MagicMock(id="test-celery-task-id-123")
    mock_create_user_task.return_value = None # Assume it doesn't return anything significant

    response = client.post(
        f'/api/v1/portfolios/{portfolio_id}/projections',
        json=projection_params,
        headers=headers
    )
    
    assert response.status_code == 202
    json_data = response.get_json()
    assert json_data['task_id'] == "test-celery-task-id-123"
    assert json_data['message'] == "Projection task accepted"
    
    mock_task_delay.assert_called_once_with(
        portfolio_id=portfolio_id,
        start_date_str=projection_params['start_date'],
        end_date_str=projection_params['end_date'],
        initial_total_value_str=projection_params['initial_total_value']
    )
    mock_create_user_task.assert_called_once_with(user_id=str(user.id), task_id="test-celery-task-id-123")
    mock_db_commit.assert_called_once()


def test_create_projection_async_invalid_params(client, portfolio_for_proj, auth_user_proj):
    user, headers = auth_user_proj
    portfolio_id = portfolio_for_proj.id

    # Test missing field
    response_missing = client.post(
        f'/api/v1/portfolios/{portfolio_id}/projections',
        json={'start_date': '2024-01-01', 'initial_total_value': '10000'}, # end_date missing
        headers=headers
    )
    assert response_missing.status_code == 400
    assert "Missing required fields" in response_missing.get_json()['message']

    # Test invalid date format
    response_bad_date = client.post(
        f'/api/v1/portfolios/{portfolio_id}/projections',
        json={'start_date': 'not-a-date', 'end_date': '2025-01-01', 'initial_total_value': '10000'},
        headers=headers
    )
    assert response_bad_date.status_code == 400
    assert "Invalid date format" in response_bad_date.get_json()['message']

    # Test end_date before start_date
    response_date_order = client.post(
        f'/api/v1/portfolios/{portfolio_id}/projections',
        json={'start_date': '2025-01-01', 'end_date': '2024-01-01', 'initial_total_value': '10000'},
        headers=headers
    )
    assert response_date_order.status_code == 400
    assert "End date must be after start date" in response_date_order.get_json()['message']

    # Test negative initial value
    response_neg_value = client.post(
        f'/api/v1/portfolios/{portfolio_id}/projections',
        json={'start_date': '2024-01-01', 'end_date': '2025-01-01', 'initial_total_value': '-100'},
        headers=headers
    )
    assert response_neg_value.status_code == 400
    assert "Initial total value cannot be negative" in response_neg_value.get_json()['message']


def test_create_projection_async_unauthorized_portfolio(client, portfolio_for_proj, other_user_proj):
    other_user, other_headers = other_user_proj
    portfolio_id = portfolio_for_proj.id # Belongs to auth_user_proj

    projection_params = {
        'start_date': str(date(2024, 1, 1)),
        'end_date': str(date(2029, 12, 31)),
        'initial_total_value': "100000.00",
    }
    response = client.post(
        f'/api/v1/portfolios/{portfolio_id}/projections',
        json=projection_params,
        headers=other_headers # Using other user's token
    )
    assert response.status_code == 403 # AccessDeniedError
    assert "Forbidden: You do not own this portfolio" in response.get_json()['message']

def test_create_projection_async_portfolio_not_found(client, auth_user_proj):
    user, headers = auth_user_proj
    non_existent_portfolio_id = 99998

    projection_params = {
        'start_date': str(date(2024, 1, 1)),
        'end_date': str(date(2029, 12, 31)),
        'initial_total_value': "100000.00",
    }
    response = client.post(
        f'/api/v1/portfolios/{non_existent_portfolio_id}/projections',
        json=projection_params,
        headers=headers
    )
    assert response.status_code == 404 # PortfolioNotFoundError
    assert f"Portfolio with id {non_existent_portfolio_id} not found" in response.get_json()['message']


# === Tests for POST /portfolios/<portfolio_id>/projections/preview (Synchronous) ===

@patch('app.routes.projections.calculate_projection')
def test_preview_projection_success(mock_calc_proj, client, portfolio_for_proj, auth_user_proj):
    user, headers = auth_user_proj
    portfolio_id = portfolio_for_proj.id

    preview_params = {
        'start_date': str(date(2024, 1, 1)),
        'end_date': str(date(2024, 3, 31)), # Shorter projection
        'initial_total_value': Decimal('50000.00'), # Use Decimal for Pydantic schema
        'draft_planned_changes': [
            {
                'description': 'Draft Q1 Bonus',
                'change_type': ChangeType.ONE_TIME_INVESTMENT.value,
                'value': Decimal('2000.00'),
                'value_type': ValueType.FIXED.value,
                'currency': Currency.EUR.value, # Match portfolio currency
                'change_date': str(date(2024, 2, 15)),
                'is_recurring': False
            }
        ]
    }
    
    mock_projection_data_tuples = [
        (date(2024, 1, 31), Decimal('50050.00')),
        (date(2024, 2, 29), Decimal('52100.00')), # Includes bonus + growth
        (date(2024, 3, 31), Decimal('52150.00'))
    ]
    mock_calc_proj.return_value = mock_projection_data_tuples
        
    response = client.post(
        f'/api/v1/portfolios/{portfolio_id}/projections/preview',
        json=preview_params, # Pydantic schema will convert Decimals to strings if needed
        headers=headers
    )
    
    assert response.status_code == 200
    json_data = response.get_json()
    
    assert isinstance(json_data, list)
    assert len(json_data) == 3
    assert json_data[0]['date'] == '2024-01-31'
    assert json_data[0]['value'] == "50050.00" # Values are stringified Decimals
    assert json_data[1]['value'] == "52100.00"

    mock_calc_proj.assert_called_once()
    called_args = mock_calc_proj.call_args[1] # Keyword arguments
    assert called_args['portfolio_id'] == portfolio_id
    assert called_args['start_date'] == date(2024, 1, 1)
    assert called_args['initial_total_value'] == Decimal('50000.00')
    assert len(called_args['draft_changes_input']) == 1
    assert called_args['draft_changes_input'][0].description == 'Draft Q1 Bonus'


def test_preview_projection_invalid_pydantic_params(client, portfolio_for_proj, auth_user_proj):
    user, headers = auth_user_proj
    portfolio_id = portfolio_for_proj.id

    invalid_params = {
        'start_date': 'not-a-date', # Invalid date format
        'end_date': str(date(2024, 3, 31)),
        'initial_total_value': Decimal('-100.00'), # Negative value
        'draft_planned_changes': [{ 'description': 'Valid enough for this part'}] # To ensure other errors are caught
    }
    response = client.post(
        f'/api/v1/portfolios/{portfolio_id}/projections/preview',
        json=invalid_params, # Pydantic schema handles Decimal conversion internally
        headers=headers
    )
    assert response.status_code == 400 # BadRequestError from Pydantic validation
    json_data = response.get_json()
    assert 'errors' in json_data['payload'] # Pydantic errors nested in payload
    errors = json_data['payload']['errors']
    
    start_date_error_found = any(err['loc'] == ['start_date'] and 'Input should be a valid date' in err['msg'] for err in errors)
    initial_value_error_found = any(err['loc'] == ['initial_total_value'] and 'Input should be greater than or equal to 0' in err['msg'] for err in errors)
    assert start_date_error_found
    assert initial_value_error_found

def test_preview_projection_unauthorized_portfolio(client, portfolio_for_proj, other_user_proj):
    other_user, other_headers = other_user_proj
    portfolio_id = portfolio_for_proj.id # Belongs to auth_user_proj

    preview_params = {
        'start_date': str(date(2024, 1, 1)),
        'end_date': str(date(2024, 3, 31)),
        'initial_total_value': Decimal('50000.00')
    }
    response = client.post(
        f'/api/v1/portfolios/{portfolio_id}/projections/preview',
        json=preview_params,
        headers=other_headers # Using other user's token
    )
    assert response.status_code == 403 # AccessDeniedError
    assert "Forbidden: You do not own this portfolio" in response.get_json()['message']

# === Test POST /portfolios/{portfolio_id}/projections/ ===
@patch('app.routes.projections.run_portfolio_projection_task.delay')
def test_create_projection_async_success(mock_delay, auth_client, portfolio_factory, session):
    user = auth_client.user
    portfolio = portfolio_factory(user=user)
    # Ensure portfolio has at least one asset for projection to be meaningful (if service requires it)
    asset = Asset(portfolio_id=portfolio.portfolio_id, name="ProjAsset", asset_type=AssetType.STOCK, currency=Currency.USD, current_value=10000)
    session.add(asset)
    session.commit()

    mock_delay.return_value = MagicMock(id="test-task-id-123") # Mock Celery task object

    projection_params = {
        "start_date": "2024-01-01",
        "end_date": "2034-01-01",
        "initial_portfolio_value": 10000.00 # Can be optional if calculated from assets
    }
    response = auth_client.post(f'/portfolios/{portfolio.portfolio_id}/projections/', json=projection_params)
    assert response.status_code == 202 # Accepted for async processing
    data = response.get_json()
    assert data['task_id'] == "test-task-id-123"
    mock_delay.assert_called_once()
    # Check call args: (portfolio_id, user_id, start_date, end_date, initial_value, ... other params)
    # Exact args depend on how run_portfolio_projection_task is defined and called.
    # Example: mock_delay.assert_called_with(portfolio.portfolio_id, user.id, date(2024,1,1), date(2034,1,1), Decimal('10000.00'))

@patch('app.routes.projections.run_portfolio_projection_task.delay')
def test_create_projection_async_invalid_params(mock_delay, auth_client, portfolio_factory):
    user = auth_client.user
    portfolio = portfolio_factory(user=user)
    invalid_params = {"start_date": "invalid-date"} # Missing end_date, invalid start_date
    response = auth_client.post(f'/portfolios/{portfolio.portfolio_id}/projections/', json=invalid_params)
    assert response.status_code == 400 # Validation error
    mock_delay.assert_not_called()

@patch('app.routes.projections.run_portfolio_projection_task.delay')
def test_create_projection_async_unauthorized_portfolio(mock_delay, auth_client, user_factory, portfolio_factory):
    other_user = user_factory(email='otherproj@example.com', username='otherprojuser')
    other_portfolio = portfolio_factory(user=other_user)
    params = {"start_date": "2024-01-01", "end_date": "2025-01-01"}
    response = auth_client.post(f'/portfolios/{other_portfolio.portfolio_id}/projections/', json=params)
    assert response.status_code == 403 # verify_portfolio_ownership
    mock_delay.assert_not_called()

@patch('app.routes.projections.run_portfolio_projection_task.delay')
def test_create_projection_async_portfolio_not_found(mock_delay, auth_client):
    params = {"start_date": "2024-01-01", "end_date": "2025-01-01"}
    response = auth_client.post('/portfolios/999000/projections/', json=params)
    assert response.status_code == 404 # verify_portfolio_ownership
    mock_delay.assert_not_called()


# === Test POST /portfolios/{portfolio_id}/projections/preview ===
@patch('app.services.projection_service.calculate_portfolio_projection') # Assuming direct call for preview
def test_preview_projection_success(mock_calculate_proj, auth_client, portfolio_factory, session):
    user = auth_client.user
    portfolio = portfolio_factory(user=user)
    asset = Asset(portfolio_id=portfolio.portfolio_id, name="PrevAsset", asset_type=AssetType.STOCK, currency=Currency.USD, current_value=5000)
    session.add(asset)
    session.commit()

    mock_calculate_proj.return_value = [{"date": "2024-01-01", "projected_value": 5050.00}]
    preview_params = {"start_date": "2024-01-01", "end_date": "2024-01-31", "initial_portfolio_value": 5000.00}
    
    response = auth_client.post(f'/portfolios/{portfolio.portfolio_id}/projections/preview', json=preview_params)
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 1
    assert data[0]['projected_value'] == 5050.00
    # mock_calculate_proj.assert_called_once_with(portfolio.portfolio_id, date(2024,1,1), date(2024,1,31), Decimal('5000.00'), ANY, ANY) # Check actual args

@patch('app.services.projection_service.calculate_portfolio_projection')
def test_preview_projection_invalid_pydantic_params(mock_calculate_proj, auth_client, portfolio_factory):
    user = auth_client.user
    portfolio = portfolio_factory(user=user)
    invalid_params = {"start_date": "not-a-date"}
    response = auth_client.post(f'/portfolios/{portfolio.portfolio_id}/projections/preview', json=invalid_params)
    assert response.status_code == 400 # Pydantic validation
    mock_calculate_proj.assert_not_called()

@patch('app.services.projection_service.calculate_portfolio_projection')
def test_preview_projection_unauthorized_portfolio(mock_calculate_proj, auth_client, user_factory, portfolio_factory):
    other_user = user_factory(email='otherprev@example.com', username='otherprevuser')
    other_portfolio = portfolio_factory(user=other_user)
    params = {"start_date": "2024-01-01", "end_date": "2024-01-31"}
    response = auth_client.post(f'/portfolios/{other_portfolio.portfolio_id}/projections/preview', json=params)
    assert response.status_code == 403 # verify_portfolio_ownership
    mock_calculate_proj.assert_not_called()
