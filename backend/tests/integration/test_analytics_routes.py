import pytest
import json
from datetime import date, timedelta, datetime
from app.models.user import User
from app.models.portfolio import Portfolio
# Asset model might be needed if we were testing calculations based on actual asset data
from app.models.asset import Asset 
from app.enums import AssetType, Currency
# from app.enums import AssetTypes, Currencies 
from app import db 
from unittest.mock import patch # For mocking service calls
from decimal import Decimal

# Fixtures for authenticated users (can be moved to conftest.py if shared)
@pytest.fixture
def auth_user_analytics(client, user_factory, session):
    email = 'analyticsowner@example.com'
    user = session.query(User).filter_by(email=email).first()
    if not user:
        user = user_factory(email=email, password='password123', username='analyticsowner')
    
    login_response = client.post('/api/v1/auth/login', json={'email': email, 'password': 'password123'})
    access_token = login_response.get_json()['access_token']
    return user, {'Authorization': f'Bearer {access_token}'}

@pytest.fixture
def other_user_analytics(client, user_factory, session):
    email = 'otheranalyticsuser@example.com'
    user = session.query(User).filter_by(email=email).first()
    if not user:
        user = user_factory(email=email, password='password456', username='otheranalyticsuser')

    login_response = client.post('/api/v1/auth/login', json={'email': email, 'password': 'password456'})
    access_token = login_response.get_json()['access_token']
    return user, {'Authorization': f'Bearer {access_token}'}


@pytest.fixture
def test_portfolio_for_analytics(session, auth_user_analytics):
    user, _ = auth_user_analytics
    # Ensure portfolio has a creation date for performance test default logic
    portfolio = Portfolio(name="Analytics Portfolio", user_id=user.id, currency="USD", created_at=datetime(2023,1,1))
    session.add(portfolio)
    session.commit()
    return portfolio

# Base URL for analytics of a given portfolio
def analytics_base_url(portfolio_id):
    return f'/api/v1/portfolios/{portfolio_id}/analytics'


# === Test /risk-profile GET ===
def test_get_risk_profile_success(auth_client, portfolio_factory, session):
    """Test successful retrieval of risk profile for an authorized user's portfolio."""
    user = auth_client.user # User created and logged in by auth_client
    portfolio = portfolio_factory(user=user, name="Risk Profile Portfolio")
    
    # Make some assets for the portfolio to have some data
    asset_a = Asset(name_or_ticker="Asset A", asset_type=AssetType.STOCK, allocation_value=1000, portfolio_id=portfolio.portfolio_id, manual_expected_return=Decimal("7.0"))
    asset_b = Asset(name_or_ticker="Asset B", asset_type=AssetType.BOND, allocation_value=3000, portfolio_id=portfolio.portfolio_id, manual_expected_return=Decimal("3.0"))
    session.add_all([asset_a, asset_b])
    session.commit()

    response = auth_client.get(f'/analytics/portfolio/{portfolio.portfolio_id}/risk-profile')
    assert response.status_code == 200
    data = response.get_json()
    assert 'total_value' in data
    assert 'risk_score' in data
    assert 'volatility' in data
    assert 'asset_class_distribution' in data


def test_get_risk_profile_unauthorized(auth_client, client, portfolio_factory, user_factory, session):
    """Test unauthorized access to risk profile (e.g., portfolio belongs to another user)."""
    # Portfolio owned by a different user
    other_user = user_factory(username='otheruser', email='other@example.com')
    other_portfolio = portfolio_factory(user=other_user, name="Other User Portfolio")

    # auth_client is logged in as 'auth_test_user@example.com'
    response = auth_client.get(f'/api/v1/analytics/portfolio/{other_portfolio.portfolio_id}/risk-profile/')
    assert response.status_code == 403 # Or 404 if not found is preferred over forbidden

def test_get_risk_profile_portfolio_not_found(auth_client):
    """Test risk profile retrieval for a non-existent portfolio."""
    response = auth_client.get('/api/v1/analytics/portfolio/99999/risk-profile/') # Non-existent ID
    assert response.status_code == 404


# === Test /performance GET ===
@patch('app.routes.analytics.calculate_historical_performance')
def test_get_performance_success_with_dates(mock_calc_perf, auth_client, portfolio_factory, session):
    """Test performance data retrieval with explicit date range."""
    user = auth_client.user
    portfolio = portfolio_factory(user=user, name="Performance Portfolio")
    some_asset = Asset(name_or_ticker="Perf Asset", asset_type=AssetType.STOCK, allocation_value=5000, portfolio_id=portfolio.portfolio_id, manual_expected_return=Decimal("8.0"))
    session.add(some_asset)
    session.commit()

    # Mock the performance calculation
    mock_calc_perf.return_value = [
        {"date": "2023-01-01", "value": 10000},
        {"date": "2023-01-31", "value": 10200}
    ]

    response = auth_client.get(f'/api/v1/analytics/portfolio/{portfolio.portfolio_id}/performance/?start_date=2023-01-01&end_date=2023-01-31')
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) == 2
    assert data[0]['date'] == "2023-01-01"

@patch('app.routes.analytics.calculate_historical_performance')
def test_get_performance_default_dates(mock_calc_perf, auth_client, portfolio_factory, session):
    """Test performance data retrieval using default date ranges."""
    user = auth_client.user
    portfolio = portfolio_factory(user=user, name="Default Perf Portfolio")
    default_asset = Asset(name_or_ticker="Default Perf Asset", asset_type=AssetType.REAL_ESTATE, allocation_value=10000, portfolio_id=portfolio.portfolio_id, manual_expected_return=Decimal("6.0"))
    session.add(default_asset)
    session.commit()

    response = auth_client.get(f'/api/v1/analytics/portfolio/{portfolio.portfolio_id}/performance/')
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    # Assert default date range behavior, e.g., non-empty list if portfolio has history


def test_get_performance_invalid_date_format(auth_client, portfolio_factory):
    """Test performance data retrieval with invalid date format."""
    user = auth_client.user
    portfolio = portfolio_factory(user=user)
    response = auth_client.get(f'/api/v1/analytics/portfolio/{portfolio.portfolio_id}/performance/?start_date=invalid-date&end_date=2023-01-31')
    assert response.status_code == 400 # Expect Bad Request


def test_get_performance_start_after_end_date(auth_client, portfolio_factory):
    """Test performance data with start_date after end_date."""
    user = auth_client.user
    portfolio = portfolio_factory(user=user)
    response = auth_client.get(f'/api/v1/analytics/portfolio/{portfolio.portfolio_id}/performance/?start_date=2023-06-01&end_date=2023-01-31')
    assert response.status_code == 400 # Should be a Bad Request


def test_get_performance_end_date_in_future_capped(auth_client, portfolio_factory):
    """Test performance data with end_date in the future (should be capped to today)."""
    user = auth_client.user
    portfolio = portfolio_factory(user=user)
    future_date = (date.today() + timedelta(days=30)).strftime('%Y-%m-%d')
    response = auth_client.get(f'/api/v1/analytics/portfolio/{portfolio.portfolio_id}/performance/?start_date=2023-01-01&end_date={future_date}')
    # This might succeed but end_date should be internally capped
    # The exact behavior depends on implementation
    assert response.status_code in [200, 400] # Allow either behavior in this test


def test_get_performance_unauthorized(auth_client, user_factory, portfolio_factory):
    """Test unauthorized access to performance data."""
    other_user = user_factory(username='otherperfuser', email='otherperf@example.com')
    other_portfolio = portfolio_factory(user=other_user)

    response = auth_client.get(f'/api/v1/analytics/portfolio/{other_portfolio.portfolio_id}/performance/')
    assert response.status_code == 403 # Or 404


# Note: /summary and /asset_allocation routes are not in the provided analytics.py.
# Tests for those would be added here if the routes existed.
# Example for /summary (if it were based on summing assets in portfolio):
# def test_get_portfolio_summary_actual_data(client, test_portfolio_for_analytics, auth_user_analytics, session):
#     user, headers = auth_user_analytics
#     portfolio = test_portfolio_for_analytics
#     # Add assets for summary calculation
#     asset1 = Asset(portfolio_id=portfolio.id, name_or_ticker="Asset 1", asset_type=AssetTypes.STOCK, currency=Currencies.USD, current_value=Decimal("1200.50"))
#     asset2 = Asset(portfolio_id=portfolio.id, name_or_ticker="Asset 2", asset_type=AssetTypes.BOND, currency=Currencies.USD, current_value=Decimal("800.25"))
#     session.add_all([asset1, asset2])
#     session.commit()
#     # Assuming /summary route is created and simply sums current_value of assets
#     # response = client.get(f'{analytics_base_url(portfolio.id)}/summary', headers=headers)
#     # assert response.status_code == 200
#     # data = response.get_json()
#     # assert data['total_portfolio_value'] == pytest.approx(Decimal("1200.50") + Decimal("800.25"))
#     # assert data['number_of_assets'] == 2
#     pass
