import pytest
import json
from datetime import date, timedelta, datetime
from app.models.user import User
from app.models.portfolio import Portfolio
# Asset model might be needed if we were testing calculations based on actual asset data
# from app.models.asset import Asset 
# from app.enums import AssetTypes, Currencies 
from app import db 
from unittest.mock import patch # For mocking service calls

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
def test_get_risk_profile_success(client, test_portfolio_for_analytics, auth_user_analytics):
    user, headers = auth_user_analytics
    portfolio_id = test_portfolio_for_analytics.id

    response = client.get(f'{analytics_base_url(portfolio_id)}/risk-profile', headers=headers)
    assert response.status_code == 200
    json_data = response.get_json()
    # Based on the hardcoded values in the route
    assert 'risk_score' in json_data
    assert json_data['risk_score'] == 0.75 
    assert json_data['volatility_estimate'] == 0.15
    assert json_data['calculation_date'] == date.today().isoformat()

def test_get_risk_profile_unauthorized(client, test_portfolio_for_analytics, other_user_analytics):
    _    , other_headers = other_user_analytics
    portfolio_id = test_portfolio_for_analytics.id # Belongs to auth_user_analytics

    response = client.get(f'{analytics_base_url(portfolio_id)}/risk-profile', headers=other_headers)
    assert response.status_code == 403 # AccessDeniedError from @verify_portfolio_ownership
    assert "User does not have permission" in response.get_json()['message']

def test_get_risk_profile_portfolio_not_found(client, auth_user_analytics):
    user, headers = auth_user_analytics
    non_existent_portfolio_id = 99999
    response = client.get(f'{analytics_base_url(non_existent_portfolio_id)}/risk-profile', headers=headers)
    assert response.status_code == 404 # PortfolioNotFoundError from @verify_portfolio_ownership
    assert f"Portfolio with id {non_existent_portfolio_id} not found" in response.get_json()['message']

# === Test /performance GET ===
@patch('app.routes.analytics.calculate_historical_performance')
def test_get_performance_success_with_dates(mock_calc_perf, client, test_portfolio_for_analytics, auth_user_analytics):
    user, headers = auth_user_analytics
    portfolio_id = test_portfolio_for_analytics.id
    
    mock_calc_perf.return_value = [
        {"date": "2023-01-01", "cumulative_return": 0.0},
        {"date": "2023-01-02", "cumulative_return": 0.001}
    ]
    
    start_date_str = '2023-01-01'
    end_date_str = '2023-01-02'
    response = client.get(
        f'{analytics_base_url(portfolio_id)}/performance?start_date={start_date_str}&end_date={end_date_str}',
        headers=headers
    )
    assert response.status_code == 200
    json_data = response.get_json()
    assert len(json_data) == 2
    assert json_data[0]['date'] == '2023-01-01'
    
    # The portfolio object passed to calculate_historical_performance by the decorator is the one fetched by ID.
    # We need to ensure the mock is called with this specific portfolio instance, or at least with its ID.
    # The route passes (portfolio, start_date, end_date, portfolio_id)
    # We should assert that the first argument to mock_calc_perf is the portfolio object.
    # This is tricky with MagicMock directly. A simpler check is portfolio_id.
    
    # Check that the first argument (portfolio object) has the correct id
    # and other arguments match.
    call_args = mock_calc_perf.call_args[0]
    assert call_args[0].id == portfolio_id # Asserting on the portfolio object passed
    assert call_args[1] == date(2023,1,1)
    assert call_args[2] == date(2023,1,2)
    assert call_args[3] == portfolio_id


@patch('app.routes.analytics.calculate_historical_performance')
def test_get_performance_default_dates(mock_calc_perf, client, test_portfolio_for_analytics, auth_user_analytics):
    user, headers = auth_user_analytics
    portfolio_id = test_portfolio_for_analytics.id
    
    mock_calc_perf.return_value = [{"date": "some_date", "cumulative_return": 0.05}]
    
    response = client.get(f'{analytics_base_url(portfolio_id)}/performance', headers=headers)
    assert response.status_code == 200
    
    today = date.today()
    default_start_date = today - timedelta(days=30)
    
    call_args = mock_calc_perf.call_args[0]
    assert call_args[0].id == portfolio_id
    assert call_args[1] == default_start_date
    assert call_args[2] == today # Default end_date is today
    assert call_args[3] == portfolio_id

def test_get_performance_invalid_date_format(client, test_portfolio_for_analytics, auth_user_analytics):
    user, headers = auth_user_analytics
    portfolio_id = test_portfolio_for_analytics.id
    response = client.get(
        f'{analytics_base_url(portfolio_id)}/performance?start_date=invalid-date&end_date=2023-12-31',
        headers=headers
    )
    assert response.status_code == 400
    json_data = response.get_json()
    assert "Invalid date format. Use YYYY-MM-DD" in json_data.get('message', '')

def test_get_performance_start_after_end_date(client, test_portfolio_for_analytics, auth_user_analytics):
    user, headers = auth_user_analytics
    portfolio_id = test_portfolio_for_analytics.id
    response = client.get(
        f'{analytics_base_url(portfolio_id)}/performance?start_date=2023-12-31&end_date=2023-01-01',
        headers=headers
    )
    assert response.status_code == 400
    json_data = response.get_json()
    assert "start_date must be before or equal to end_date" in json_data.get('message', '')

def test_get_performance_end_date_in_future_capped(mock_calc_perf, client, test_portfolio_for_analytics, auth_user_analytics):
    # This test implicitly uses the mock_calc_perf fixture
    user, headers = auth_user_analytics
    portfolio_id = test_portfolio_for_analytics.id
    mock_calc_perf.return_value = [] # Return value doesn't matter, just checking date capping
    
    future_date = date.today() + timedelta(days=5)
    response = client.get(
        f'{analytics_base_url(portfolio_id)}/performance?end_date={future_date.isoformat()}',
        headers=headers
    )
    assert response.status_code == 200
    
    call_args = mock_calc_perf.call_args[0]
    assert call_args[2] == date.today() # end_date should be capped to today


def test_get_performance_unauthorized(client, test_portfolio_for_analytics, other_user_analytics):
    _    , other_headers = other_user_analytics
    portfolio_id = test_portfolio_for_analytics.id

    response = client.get(f'{analytics_base_url(portfolio_id)}/performance', headers=other_headers)
    assert response.status_code == 403


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
