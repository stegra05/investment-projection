import pytest
import json
from datetime import date, timedelta
from app.models.user import User
from app.models.portfolio import Portfolio
from app.models.planned_future_change import PlannedFutureChange 
# SkippedOccurrence model is not used as skip/unskip routes are not implemented
from app.enums import ChangeTypes, RecurrencePatterns, Currencies, ValueTypes, FrequencyType, EndsOnType, MonthOrdinalType, OrdinalDayType
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

# === Test Create Planned Change (POST /portfolios/<portfolio_id>/changes/) ===
def test_create_planned_change_one_time_success(client, test_portfolio_for_changes, auth_user_1_changes_test, session):
    user1, headers_user1 = auth_user_1_changes_test
    portfolio_id = test_portfolio_for_changes.id

    change_data = {
        'description': 'New Year Bonus Investment',
        'change_type': ChangeTypes.ONE_TIME_INVESTMENT.value,
        'value': Decimal('1000.00'),
        'value_type': ValueTypes.FIXED.value,
        'currency': Currencies.USD.value,
        'change_date': str(date(2025, 1, 15)),
        'is_recurring': False 
    }
    response = client.post(changes_base_url(portfolio_id), json=change_data, headers=headers_user1)
    
    assert response.status_code == 201
    json_data = response.get_json()
    assert json_data['description'] == 'New Year Bonus Investment'
    assert json_data['change_type']['value'] == ChangeTypes.ONE_TIME_INVESTMENT.value # Schema serializes enum
    assert json_data['portfolio_id'] == portfolio_id
    assert 'change_id' in json_data

    change_db = session.query(PlannedFutureChange).filter_by(change_id=json_data['change_id']).first()
    assert change_db is not None
    assert change_db.description == 'New Year Bonus Investment'
    assert change_db.change_date == date(2025, 1, 15)
    assert change_db.is_recurring is False

def test_create_planned_change_recurring_success(client, test_portfolio_for_changes, auth_user_1_changes_test, session):
    user1, headers_user1 = auth_user_1_changes_test
    portfolio_id = test_portfolio_for_changes.id

    change_data = {
        'description': 'Monthly Savings Deposit',
        'change_type': ChangeTypes.RECURRING_INVESTMENT.value,
        'value': Decimal('250.00'),
        'value_type': ValueTypes.FIXED.value,
        'currency': Currencies.USD.value,
        'change_date': str(date(2024, 8, 1)), 
        'is_recurring': True,
        'recurrence_pattern': RecurrencePatterns.MONTHLY.value,
        'frequency': FrequencyType.MONTHLY.value, # Added based on schema
        'interval': 1,
        'ends_on_type': EndsOnType.ON_DATE.value, 
        'ends_on_date': str(date(2025, 7, 31)),
    }
    response = client.post(changes_base_url(portfolio_id), json=change_data, headers=headers_user1)
    assert response.status_code == 201
    json_data = response.get_json()
    assert json_data['description'] == 'Monthly Savings Deposit'
    assert json_data['is_recurring'] is True
    assert json_data['recurrence_pattern']['value'] == RecurrencePatterns.MONTHLY.value
    assert json_data['ends_on_date'] == str(date(2025, 7, 31))

    change_db = session.query(PlannedFutureChange).filter_by(change_id=json_data['change_id']).first()
    assert change_db is not None
    assert change_db.recurrence_pattern == RecurrencePatterns.MONTHLY
    assert change_db.frequency == FrequencyType.MONTHLY


def test_create_planned_change_invalid_data(client, test_portfolio_for_changes, auth_user_1_changes_test):
    _  , headers_user1 = auth_user_1_changes_test
    portfolio_id = test_portfolio_for_changes.id
    # Missing 'value', 'value_type', 'currency', 'change_date', 'is_recurring'
    invalid_data = {'description': 'Incomplete Change', 'change_type': ChangeTypes.ONE_TIME_INVESTMENT.value}
    response = client.post(changes_base_url(portfolio_id), json=invalid_data, headers=headers_user1)
    assert response.status_code == 400 # Pydantic validation error
    json_data = response.get_json()
    assert 'errors' in json_data
    error_fields = [err['loc'][0] for err in json_data['errors'] if err.get('loc')]
    assert 'value' in error_fields
    assert 'value_type' in error_fields
    assert 'currency' in error_fields
    # is_recurring is required by PlannedChangeCreateSchema, so it will be listed if missing.

def test_create_planned_change_unauthorized_portfolio(client, test_portfolio_for_changes, auth_user_2_changes_test):
    _  , headers_user2 = auth_user_2_changes_test # User 2
    portfolio_id = test_portfolio_for_changes.id # Portfolio belongs to User 1

    change_data = {'description': 'Trying to sneak in', 'change_type': ChangeTypes.ONE_TIME_INVESTMENT.value, 'value': 100, 'currency': 'USD', 'change_date': str(date.today()), 'value_type': 'FIXED', 'is_recurring': False}
    response = client.post(changes_base_url(portfolio_id), json=change_data, headers=headers_user2)
    assert response.status_code == 403 # verify_portfolio_ownership


# === Test Update Planned Change (PUT /portfolios/<portfolio_id>/changes/<change_id>/) ===
def test_update_planned_change_success(client, test_portfolio_for_changes, auth_user_1_changes_test, session):
    user1, headers_user1 = auth_user_1_changes_test
    portfolio_id = test_portfolio_for_changes.id
    
    change = PlannedFutureChange(
        portfolio_id=portfolio_id, description="Original Description", 
        change_type=ChangeTypes.ONE_TIME_INVESTMENT, value=Decimal('500.00'), 
        value_type=ValueTypes.FIXED, currency=Currencies.EUR, 
        change_date=date(2025, 3, 10), is_recurring=False
    )
    session.add(change)
    session.commit()
    change_id = change.change_id

    update_data = {
        'description': 'Updated Change Description', 
        'value': Decimal('750.50'),
        'change_date': str(date(2025, 4, 15))
    }
    response = client.put(specific_change_url(portfolio_id, change_id), json=update_data, headers=headers_user1)
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['description'] == 'Updated Change Description'
    assert json_data['value'] == "750.50" # Decimal serialized to string
    assert json_data['change_date'] == str(date(2025, 4, 15))

    session.refresh(change)
    assert change.description == 'Updated Change Description'
    assert change.value == Decimal('750.50')

def test_update_planned_change_validation_error(client, test_portfolio_for_changes, auth_user_1_changes_test, session):
    user1, headers_user1 = auth_user_1_changes_test
    portfolio_id = test_portfolio_for_changes.id
    change = PlannedFutureChange(
        portfolio_id=portfolio_id, description="Contribution Test", 
        change_type=ChangeTypes.CONTRIBUTION, value=Decimal('100'), 
        value_type=ValueTypes.FIXED, currency=Currencies.USD,
        change_date=date(2025, 5, 1), is_recurring=False
    )
    session.add(change)
    session.commit()
    change_id = change.change_id

    # Attempt to remove 'value' (amount) which is required for CONTRIBUTION
    # The schema AssetUpdateSchema allows partial updates, but the route has specific logic.
    # Let's test the custom validation in the route: change_type='CONTRIBUTION' requires 'amount' (value).
    # If we update type to REALLOCATION but keep amount, it should fail.
    update_data_realloc_with_amount = {
        'change_type': ChangeTypes.REALLOCATION.value, # Valid update to type
        'value': Decimal('100.00') # 'value' (amount) should be None for REALLOCATION
    }
    response_realloc = client.put(specific_change_url(portfolio_id, change_id), json=update_data_realloc_with_amount, headers=headers_user1)
    assert response_realloc.status_code == 400 # BadRequestError from route's custom validation
    assert "'Reallocation' change type should not include an 'amount'" in response_realloc.get_json()['message']
    
    # Refresh object state from DB to ensure it didn't change due to failed update
    session.refresh(change)
    assert change.change_type == ChangeTypes.CONTRIBUTION # Should not have changed
    assert change.value == Decimal('100')

    # Now, try to update to CONTRIBUTION but remove amount (value)
    # Update schema allows value to be None if not provided.
    # The specific route logic: "if change.change_type in ['Contribution', 'Withdrawal'] and change.amount is None:"
    # This means if we PATCH and don't send 'value', existing value persists.
    # If we PUT and don't send 'value', schema default (None) applies, then route logic hits.
    # If we explicitly send value:null for a PUT
    update_data_contrib_no_amount = {
        'change_type': ChangeTypes.CONTRIBUTION.value,
        'value': None # Explicitly setting amount to None
    }
    # This will pass schema validation because `value` is Optional in UpdateSchema.
    # The route's custom logic should catch it.
    response_contrib = client.put(specific_change_url(portfolio_id, change_id), json=update_data_contrib_no_amount, headers=headers_user1)
    assert response_contrib.status_code == 400
    assert "'CONTRIBUTION' requires an 'amount'" in response_contrib.get_json()['message']


def test_update_planned_change_unauthorized(client, test_portfolio_for_changes, auth_user_1_changes_test, auth_user_2_changes_test, session):
    user1, _ = auth_user_1_changes_test
    _    , headers_user2 = auth_user_2_changes_test # User 2
    portfolio_id_user1 = test_portfolio_for_changes.id # Belongs to User 1
    
    change_user1 = PlannedFutureChange(portfolio_id=portfolio_id_user1, description="User1 Change", change_type=ChangeTypes.ONE_TIME_INVESTMENT, value=10, change_date=date(2025,1,1), currency=Currencies.USD, value_type=ValueTypes.FIXED, is_recurring=False)
    session.add(change_user1)
    session.commit()
    change_id_user1 = change_user1.change_id

    response = client.put(specific_change_url(portfolio_id_user1, change_id_user1), json={'description': 'Hacked'}, headers=headers_user2)
    assert response.status_code == 403 # verify_portfolio_ownership


# === Test Delete Planned Change (DELETE /portfolios/<portfolio_id>/changes/<change_id>/) ===
def test_delete_planned_change_success(client, test_portfolio_for_changes, auth_user_1_changes_test, session):
    user1, headers_user1 = auth_user_1_changes_test
    portfolio_id = test_portfolio_for_changes.id
    change_to_delete = PlannedFutureChange(
        portfolio_id=portfolio_id, description="To Be Deleted", 
        change_type=ChangeTypes.ONE_TIME_INVESTMENT, value=Decimal('50.00'), 
        value_type=ValueTypes.FIXED, currency=Currencies.GBP, 
        change_date=date(2025, 6, 1), is_recurring=False
    )
    session.add(change_to_delete)
    session.commit()
    change_id = change_to_delete.change_id

    response = client.delete(specific_change_url(portfolio_id, change_id), headers=headers_user1)
    assert response.status_code == 200
    assert response.get_json()['message'] == 'Planned change deleted successfully'

    deleted_change_db = session.query(PlannedFutureChange).filter_by(change_id=change_id).first()
    assert deleted_change_db is None

def test_delete_planned_change_not_found(client, test_portfolio_for_changes, auth_user_1_changes_test):
    _  , headers_user1 = auth_user_1_changes_test
    portfolio_id = test_portfolio_for_changes.id
    response = client.delete(specific_change_url(portfolio_id, 999888), headers=headers_user1) # Non-existent ID
    assert response.status_code == 404 # get_owned_child_or_404
    assert "Planned change with ID 999888 not found in portfolio" in response.get_json()['message']


# Note: GET (list, specific) and Skip/Unskip routes are not in the provided changes.py
# Tests for those would be added here if the routes existed.
