import pytest
from app import create_app, db as _db # Assuming your Flask app factory and SQLAlchemy db object are here
from config import TestingConfig # Assuming your TestingConfig is here
from app.models.user import User
from app.models.portfolio import Portfolio
import uuid # Import uuid

@pytest.fixture(scope='session')
def app():
    """Session-wide test `Flask` application."""
    _app = create_app(config_name='testing')

    # Establish an application context before running the tests.
    ctx = _app.app_context()
    ctx.push()

    yield _app # The app is yielded to the tests

    ctx.pop() # Clean up the context

@pytest.fixture(scope='session')
def db(app):
    """Session-wide test database."""
    _db.app = app
    _db.create_all()

    yield _db

    _db.drop_all()

@pytest.fixture(scope='function')
def session(db):
    """Creates a new database session for a test using a nested transaction (SAVEPOINT)."""
    # db.session is a ScopedSession. Accessing it starts a transaction if one isn't active.
    # For test isolation, we want each test to run in its own transaction that can be rolled back.
    
    # Start a nested transaction (effectively a SAVEPOINT).
    # Any commits within the test (like from factories) will commit to this savepoint.
    nested_transaction = db.session.begin_nested()
    
    yield db.session # Tests use the standard db.session, now within a savepoint.

    # Rollback the nested transaction. This reverts any commits made during the test.
    # If no nested transaction was started (e.g., if begin_nested failed or wasn't supported),
    # this might not behave as expected, but for SQLite it should work.
    # A simple db.session.rollback() might also work if the outer transaction is managed per test run.
    if nested_transaction.is_active:
        nested_transaction.rollback()
    else:
        # Fallback or log if the nested transaction wasn't active as expected.
        # For now, we assume it should be active if successfully started.
        db.session.rollback() # General rollback if nested wasn't explicitly active.

    # It's also important to ensure the session is clean for the next test.
    # db.session.remove() ensures the ScopedSession discards the session for the current scope.
    db.session.remove()

@pytest.fixture(scope='function')
def client(app, session): # Ensure session fixture is used to setup db session for client requests
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def auth_client(client, user_factory, session):
    """A test client that is pre-authenticated with a new user.
    
    Usage:
        response = auth_client.get('/protected_route')
        user = auth_client.user # Access the authenticated user instance
    """
    # Let user_factory generate unique credentials
    generated_email = f"auth_user_{uuid.uuid4().hex[:8]}@example.com"
    generated_username = f"auth_user_{uuid.uuid4().hex[:8]}"
    password = "password123"
    
    user = user_factory(email=generated_email, username=generated_username, password=password)
    
    # Log in the user to get tokens
    login_response = client.post('/api/v1/auth/login', json={
        'username_or_email': user.email, # Use the generated and committed user's email
        'password': password
    })
    
    if login_response.status_code != 200:
        # If login fails, raise an error to make it clear in tests
        raise RuntimeError(f"Auth_client failed to log in user '{user.email}'. Status: {login_response.status_code}, Response: {login_response.data.decode()}")

    tokens = login_response.get_json()
    access_token = tokens.get('access_token')

    if not access_token:
        raise RuntimeError("Auth_client: access_token not found in login response.")

    # Attach user and token to the client for easy access in tests, though not standard on test_client
    # A better way is to make the auth_client a class that holds the user and applies headers
    
    class AuthenticatedTestClient:
        def __init__(self, client, token, user_instance):
            self._client = client
            self._token = token
            self.user = user_instance # Make the user object available

        def _get_headers(self, headers=None):
            auth_headers = {'Authorization': f'Bearer {self._token}'}
            if headers:
                auth_headers.update(headers)
            return auth_headers

        def get(self, *args, **kwargs):
            kwargs['headers'] = self._get_headers(kwargs.get('headers'))
            return self._client.get(*args, **kwargs)

        def post(self, *args, **kwargs):
            kwargs['headers'] = self._get_headers(kwargs.get('headers'))
            return self._client.post(*args, **kwargs)

        def put(self, *args, **kwargs):
            kwargs['headers'] = self._get_headers(kwargs.get('headers'))
            return self._client.put(*args, **kwargs)

        def delete(self, *args, **kwargs):
            kwargs['headers'] = self._get_headers(kwargs.get('headers'))
            return self._client.delete(*args, **kwargs)
        
        def patch(self, *args, **kwargs): # Add patch method
            kwargs['headers'] = self._get_headers(kwargs.get('headers'))
            return self._client.patch(*args, **kwargs)

    
    authenticated_client = AuthenticatedTestClient(client, access_token, user)
    return authenticated_client

@pytest.fixture
def user_factory(session):
    def _user_factory(**kwargs):
        # counter_val = next(user_factory.counter)
        unique_id = uuid.uuid4().hex[:8] # Generate a unique ID
        default_email = f"user_{unique_id}@example.com"
        default_username = f"user_{unique_id}"
        
        params = {
            'email': kwargs.get('email', default_email),
            'username': kwargs.get('username', default_username),
        }
        user = User(**params)
        user.set_password(kwargs.get('password', 'defaultpassword'))
        session.add(user)
        session.commit()
        return user
    # user_factory.counter = iter(range(1000)) # Remove old counter
    return _user_factory

@pytest.fixture
def portfolio_factory(session, user_factory):
    def _portfolio_factory(**kwargs):
        user = kwargs.get('user')
        if not user:
            user = user_factory() # Create a default user if not provided
        
        unique_id = uuid.uuid4().hex[:8]
        default_name = f"Portfolio_{unique_id}"
        params = {
            'name': kwargs.get('name', default_name),
            'user_id': user.id,
            'description': kwargs.get('description', 'Default portfolio description')
        }
        portfolio = Portfolio(**params)
        session.add(portfolio)
        session.commit()
        return portfolio
    # _portfolio_factory.counter = iter(range(1000)) # Remove old counter
    return _portfolio_factory
