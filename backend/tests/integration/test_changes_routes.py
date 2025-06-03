import pytest
import json
from datetime import date, timedelta
from app.models.user import User
from app.models.portfolio import Portfolio
from app.models.planned_future_change import PlannedFutureChange 
# SkippedOccurrence model is not used as skip/unskip routes are not implemented
from app.enums import ChangeType, RecurrencePattern, Currency, ValueType, FrequencyType, EndsOnType, MonthOrdinalType, OrdinalDayType
from app import db 
from decimal import Decimal

# Fixtures for authenticated users (can be moved to conftest.py if shared)
@pytest.fixture
def auth_user_1_changes_test(client, user_factory, session):
    email = 'changeowner1_changes@example.com'
    user = session.query(User).filter_by(email=email).first()
    if not user:
        user = user_factory(email=email, password='password123', username='changeowner1_changes')
    
    login_response = client.post('/api/v1/auth/login', json={'email': email, 'password': 'password123'})
    access_token = login_response.get_json()['access_token']
    return user, {'Authorization': f'Bearer {access_token}'}

@pytest.fixture
def auth_user_2_changes_test(client, user_factory, session):
    email = 'changeowner2_changes@example.com'
    user = session.query(User).filter_by(email=email).first()
    if not user:
        user = user_factory(email=email, password='password456', username='changeowner2_changes')
    
    login_response = client.post('/api/v1/auth/login', json={'email': email, 'password': 'password456'})
    access_token = login_response.get_json()['access_token']
    return user, {'Authorization': f'Bearer {access_token}'}

@pytest.fixture
def test_portfolio_for_changes(session, auth_user_1_changes_test):
    user1, _ = auth_user_1_changes_test
    portfolio = Portfolio(name="Changes Test Portfolio", user_id=user1.id, currency="USD")
    session.add(portfolio)
    session.commit()
    return portfolio

# Base URL for changes of a given portfolio
def changes_base_url(portfolio_id):
    return f'/api/v1/portfolios/{portfolio_id}/changes/'

def specific_change_url(portfolio_id, change_id):
    return f'/api/v1/portfolios/{portfolio_id}/changes/{change_id}/'

# === Test POST /portfolios/{portfolio_id}/changes ===
def test_create_planned_change_one_time_success(auth_client, portfolio_factory, session):
    user = auth_client.user
    portfolio = portfolio_factory(user=user)
    change_data = {
        "change_type": ChangeType.CONTRIBUTION.value,
        "change_date": "2024-07-01",
        "amount": 1000.00,
        "currency": Currency.USD.value, # Assuming schema supports this, model might not
        "description": "One-time bonus investment",
        "is_recurring": False
    }
    response = auth_client.post(f'/api/v1/portfolios/{portfolio.portfolio_id}/changes/', json=change_data)
    assert response.status_code == 201
    data = response.get_json()
    assert data['description'] == "One-time bonus investment"
    assert data['change_type'] == ChangeType.CONTRIBUTION.value
    assert data['portfolio_id'] == portfolio.portfolio_id

def test_create_planned_change_recurring_success(auth_client, portfolio_factory, session):
    user = auth_client.user
    portfolio = portfolio_factory(user=user)
    change_data = {
        "change_type": ChangeType.CONTRIBUTION.value,
        "change_date": "2024-08-01", # Start date
        "amount": 200.00,
        "description": "Monthly savings top-up",
        "is_recurring": True,
        "frequency": FrequencyType.MONTHLY.value,
        "interval": 1,
        "day_of_month": 15,
        "ends_on_type": EndsOnType.AFTER_OCCURRENCES.value,
        "ends_on_occurrences": 12
    }
    response = auth_client.post(f'/api/v1/portfolios/{portfolio.portfolio_id}/changes/', json=change_data)
    assert response.status_code == 201
    data = response.get_json()
    assert data['description'] == "Monthly savings top-up"
    assert data['is_recurring'] is True
    assert data['frequency'] == FrequencyType.MONTHLY.value

def test_create_planned_change_invalid_data(auth_client, portfolio_factory):
    user = auth_client.user
    portfolio = portfolio_factory(user=user)
    invalid_data = {"amount": "not a number"} # Missing required fields, invalid amount
    response = auth_client.post(f'/api/v1/portfolios/{portfolio.portfolio_id}/changes/', json=invalid_data)
    assert response.status_code == 400 # Validation Error

def test_create_planned_change_unauthorized_portfolio(auth_client, user_factory, portfolio_factory):
    other_user = user_factory(username='otherchangesuser', email='otherchanges@example.com')
    other_portfolio = portfolio_factory(user=other_user)
    change_data = {"change_type": ChangeType.CONTRIBUTION.value, "change_date": "2024-01-01", "amount": 100}
    response = auth_client.post(f'/api/v1/portfolios/{other_portfolio.portfolio_id}/changes/', json=change_data)
    assert response.status_code == 403 # verify_portfolio_ownership

# === Test PUT /portfolios/{portfolio_id}/changes/{change_id} ===
def test_update_planned_change_success(auth_client, portfolio_factory, session):
    user = auth_client.user
    portfolio = portfolio_factory(user=user)
    change = PlannedFutureChange(
        portfolio_id=portfolio.portfolio_id, change_type=ChangeType.CONTRIBUTION, 
        change_date=date(2024,5,1), amount=500, description="Initial Change"
    )
    session.add(change)
    session.commit()

    update_data = {"description": "Updated One-Time Investment", "amount": 750.00}
    response = auth_client.put(f'/api/v1/portfolios/{portfolio.portfolio_id}/changes/{change.change_id}/', json=update_data)
    assert response.status_code == 200
    data = response.get_json()
    assert data['description'] == "Updated One-Time Investment"
    assert data['amount'] == "750.00" # Assuming amount is stringified by schema

def test_update_planned_change_validation_error(auth_client, portfolio_factory, session):
    user = auth_client.user
    portfolio = portfolio_factory(user=user)
    change = PlannedFutureChange(
        portfolio_id=portfolio.portfolio_id, change_type=ChangeType.WITHDRAWAL,
        change_date=date(2024,6,1), amount=100
    )
    session.add(change)
    session.commit()

    invalid_update = {"amount": "non-numeric"}
    response = auth_client.put(f'/api/v1/portfolios/{portfolio.portfolio_id}/changes/{change.change_id}/', json=invalid_update)
    assert response.status_code == 400

def test_update_planned_change_unauthorized(auth_client, user_factory, portfolio_factory, session):
    other_user = user_factory(username='otherchangeupdate', email='otherchangeupdate@example.com')
    other_portfolio = portfolio_factory(user=other_user)
    other_change = PlannedFutureChange(portfolio_id=other_portfolio.portfolio_id, change_type=ChangeType.CONTRIBUTION, change_date=date(2024,1,1), amount=10)
    session.add(other_change)
    session.commit()

    response = auth_client.put(f'/api/v1/portfolios/{other_portfolio.portfolio_id}/changes/{other_change.change_id}/', json={"description": "Attempted Update"})
    assert response.status_code == 403

# === Test DELETE /portfolios/{portfolio_id}/changes/{change_id} ===
def test_delete_planned_change_success(auth_client, portfolio_factory, session):
    user = auth_client.user
    portfolio = portfolio_factory(user=user)
    change_to_delete = PlannedFutureChange(portfolio_id=portfolio.portfolio_id, change_type=ChangeType.CONTRIBUTION, change_date=date(2024,1,1), amount=100)
    session.add(change_to_delete)
    session.commit()
    change_id_del = change_to_delete.change_id

    response = auth_client.delete(f'/api/v1/portfolios/{portfolio.portfolio_id}/changes/{change_id_del}/')
    assert response.status_code == 200
    assert response.get_json()['message'] == "Planned change deleted successfully"
    assert PlannedFutureChange.query.get(change_id_del) is None

def test_delete_planned_change_not_found(auth_client, portfolio_factory):
    user = auth_client.user
    portfolio = portfolio_factory(user=user)
    response = auth_client.delete(f'/api/v1/portfolios/{portfolio.portfolio_id}/changes/99999/')
    assert response.status_code == 404


# Note: GET (list, specific) and Skip/Unskip routes are not in the provided changes.py
# Tests for those would be added here if the routes existed.
