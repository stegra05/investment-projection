import pytest
from app import create_app, db as _db
from app.models import User, Portfolio, Asset, PlannedFutureChange  # Assuming User, Portfolio, Asset, and PlannedFutureChange models exist for auth testing
import os
from decimal import Decimal
import datetime

# Determine the base directory of the backend project
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

@pytest.fixture(scope='session')
def app():
    """Session-wide test Flask application."""
    # Use a specific test configuration
    # You might need to create a config_test.py or similar
    # or adjust environment variables
    config_name = 'testing' # Assumes you have a 'testing' config in your factory

    # Adjust database URI for testing (in-memory SQLite)
    test_db_uri = 'sqlite:///:memory:'
    # If using a file-based SQLite for inspection:
    # test_db_path = os.path.join(BASE_DIR, 'test_app.db')
    # test_db_uri = f'sqlite:///{test_db_path}'
    # if os.path.exists(test_db_path):
    #     os.unlink(test_db_path) # Ensure clean state

    app = create_app(config_name_override=config_name, testing=True, db_uri_override=test_db_uri)

    # Establish an application context before running tests
    with app.app_context():
        yield app # Use yield for session scope

    # Cleanup (if using file-based SQLite)
    # if os.path.exists(test_db_path):
    #     os.unlink(test_db_path)


@pytest.fixture(scope='function')
def client(app):
    """A test client for the app."""
    return app.test_client()


@pytest.fixture(scope='function')
def db(app):
    """Session-wide test database."""
    with app.app_context():
        _db.create_all()

        yield _db

        # Explicitly close DB connection (important for some DBs/test runners)
        _db.session.remove()
        _db.drop_all()


@pytest.fixture(scope='function')
def test_user(db):
    """Fixture to create a test user."""
    user = User(username='testuser', email='test@example.com')
    user.set_password('password')
    db.session.add(user)
    db.session.commit()
    return user

@pytest.fixture(scope='function')
def test_portfolio(db, test_user):
    """Fixture to create a test portfolio belonging to test_user."""
    portfolio = Portfolio(
        user_id=test_user.id,
        name="My Test Portfolio",
        description="A portfolio for testing purposes."
    )
    db.session.add(portfolio)
    db.session.commit()
    return portfolio

@pytest.fixture(scope='function')
def test_asset(db, test_portfolio):
    """Fixture to create a simple test asset within test_portfolio."""
    asset = Asset(
        portfolio_id=test_portfolio.portfolio_id,
        name="Test Stock Asset",
        asset_type="Stock",
        allocation_value=Decimal("10000.00"),
        manual_expected_return=Decimal("7.0") # 7% annual return
    )
    db.session.add(asset)
    db.session.commit()
    return asset

@pytest.fixture(scope='function')
def test_planned_change(db, test_portfolio):
    """Fixture to create a simple test contribution planned change."""
    change = PlannedFutureChange(
        portfolio_id=test_portfolio.portfolio_id,
        change_date=datetime.date.today() + datetime.timedelta(days=45), # ~1.5 months from now
        change_type="Contribution",
        amount=Decimal("500.00")
    )
    db.session.add(change)
    db.session.commit()
    return change

@pytest.fixture(scope='function')
def logged_in_client(client, test_user):
    """Provides a test client that is logged in as test_user."""
    # Use the client to log in the test_user
    # This assumes your login route is '/api/auth/login' and accepts JSON
    res = client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'password'
    })
    # Basic check - you might need more robust error handling
    if res.status_code != 200:
        print("Login failed in fixture:", res.get_json())
        raise Exception(f"Login failed with status {res.status_code}")

    # The client now has the session cookie set (assuming Flask-Login or similar)
    return client 