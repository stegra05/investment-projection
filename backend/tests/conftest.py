import pytest
from app import create_app, db as _db # Assuming your Flask app factory and SQLAlchemy db object are here
from config import TestingConfig # Assuming your TestingConfig is here
from app.models.user import User
from app.models.portfolio import Portfolio

@pytest.fixture(scope='session')
def app():
    """Session-wide test `Flask` application."""
    _app = create_app(config_class=TestingConfig)

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
    """Creates a new database session for a test."""
    connection = db.engine.connect()
    transaction = connection.begin()

    options = dict(bind=connection, binds={})
    sess = db.create_scoped_session(options=options)

    # Start the session with the connection
    db.session = sess

    yield sess

    transaction.rollback()
    connection.close()
    sess.remove()

@pytest.fixture(scope='function')
def client(app, session): # Ensure session fixture is used to setup db session for client requests
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def user_factory(session):
    def _user_factory(**kwargs):
        default_email = f"user_{next(user_factory.counter)}@example.com"
        default_username = f"user{next(user_factory.counter)}"
        
        params = {
            'email': kwargs.get('email', default_email),
            'username': kwargs.get('username', default_username),
        }
        user = User(**params)
        user.set_password(kwargs.get('password', 'defaultpassword'))
        session.add(user)
        session.commit()
        return user
    user_factory.counter = iter(range(1000)) # Simple counter to ensure unique emails/usernames
    return _user_factory

@pytest.fixture
def portfolio_factory(session, user_factory):
    def _portfolio_factory(**kwargs):
        user = kwargs.get('user')
        if not user:
            user = user_factory() # Create a default user if not provided
        
        default_name = f"Portfolio {next(_portfolio_factory.counter)}"
        params = {
            'name': kwargs.get('name', default_name),
            'user_id': user.id,
            'description': kwargs.get('description', 'Default portfolio description')
        }
        portfolio = Portfolio(**params)
        session.add(portfolio)
        session.commit()
        return portfolio
    _portfolio_factory.counter = iter(range(1000)) # Simple counter for unique names
    return _portfolio_factory
