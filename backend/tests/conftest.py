import pytest
from app import create_app, db as _db, limiter
from app.models import User, Portfolio, Asset, PlannedFutureChange  # Assuming User, Portfolio, Asset, and PlannedFutureChange models exist for auth testing
from app.enums import AssetType, ChangeType # <-- Add this import
import os
from decimal import Decimal
import datetime
from sqlalchemy import event
from sqlalchemy.engine import Engine
import sqlite3 # <-- Import sqlite3

# Determine the base directory of the backend project
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Ensure foreign key constraints are enforced for SQLite
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    # Check if the connection is an instance of the SQLite3 connection type
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.close()

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

    # Correctly call create_app with the configuration name
    app = create_app(config_name=config_name)

    # Update config for testing AFTER app creation
    app.config.update(
        TESTING=True,
        SQLALCHEMY_DATABASE_URI=test_db_uri,
        JWT_SECRET_KEY='test-secret-key', # Use a fixed secret key for testing
        WTF_CSRF_ENABLED=False, # Disable CSRF for easier testing of forms/API calls
        RATELIMIT_ENABLED=False, # Disable rate limiting for tests
        JWT_COOKIE_CSRF_PROTECT=False # Disable CSRF protection for JWT cookies in tests
    )

    # Establish an application context before running tests
    with app.app_context():
        # Explicitly disable the limiter *after* app context
        limiter.enabled = False
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
        name_or_ticker="Test Stock Asset",
        asset_type=AssetType.STOCK, # <-- Use Enum member
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
        change_type=ChangeType.CONTRIBUTION, # <-- Use Enum member
        amount=Decimal("500.00")
    )
    db.session.add(change)
    db.session.commit()
    return change

@pytest.fixture(scope='function')
def logged_in_client(client, test_user):
    """Provides a test client that is logged in as test_user."""
    # Use the client to log in the test_user
    # This assumes your login route is '/api/v1/auth/login' and accepts JSON
    res = client.post('/api/v1/auth/login', json={
        'username': 'testuser',
        'password': 'password'
    })
    # Basic check - you might need more robust error handling
    if res.status_code != 200:
        print("Login failed in fixture:", res.get_json())
        raise Exception(f"Login failed with status {res.status_code}")

    # The client now has the session cookie set (assuming Flask-Login or similar)
    return client 