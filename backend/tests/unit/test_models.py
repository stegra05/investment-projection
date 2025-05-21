import pytest
from app.models.user import User  # Adjust import if necessary
from app.models.portfolio import Portfolio # Adjust import if necessary
from sqlalchemy.exc import IntegrityError
from app.models.asset import Asset
from app.enums import AssetType, Currency, ChangeType, RecurrencePattern
from app.models.planned_future_change import PlannedFutureChange
from datetime import datetime, date
from app.models.user_celery_task import UserCeleryTask
from decimal import Decimal

def test_new_user_creation(session):
    """Test creating a new user."""
    user = User(email='test@example.com', username='testuser')
    user.set_password('password123')
    session.add(user)
    session.commit()

    retrieved_user = User.query.filter_by(email='test@example.com').first()
    assert retrieved_user is not None
    assert retrieved_user.username == 'testuser'
    assert retrieved_user.check_password('password123')
    assert not retrieved_user.check_password('wrongpassword')

def test_user_password_hashing(session):
    """Test that the password is correctly hashed."""
    user = User(email='test2@example.com', username='testuser2')
    user.set_password('secure_password')
    session.add(user)
    session.commit()
    # Directly checking password_hash is not ideal, but confirms it's not plain text
    assert user.password_hash != 'secure_password'
    assert user.check_password('secure_password')

def test_user_email_uniqueness(session):
    """Test that user email is unique."""
    user1 = User(email='unique@example.com', username='user1')
    user1.set_password('pass1')
    session.add(user1)
    session.commit()

    user2 = User(email='unique@example.com', username='user2')
    user2.set_password('pass2')
    session.add(user2)
    with pytest.raises(IntegrityError): # Assuming SQLAlchemy raises IntegrityError for unique constraint
        session.commit()
    session.rollback() # Rollback the failed transaction

def test_user_username_uniqueness(session):
    """Test that username is unique."""
    user1 = User(email='user1@example.com', username='unique_username')
    user1.set_password('pass1')
    session.add(user1)
    session.commit()

    user2 = User(email='user2@example.com', username='unique_username')
    user2.set_password('pass2')
    session.add(user2)
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()

def test_user_representation(session):
    """Test the __repr__ method of User model."""
    user = User(email='repr@example.com', username='repr_user')
    user.set_password('password')
    session.add(user)
    session.commit()
    assert repr(user) == '<User repr_user>'

# Example for a related model if User has a relationship, e.g., to Portfolio
def test_user_portfolio_relationship(session, user_factory, portfolio_factory):
    """Test the relationship between User and Portfolio."""
    user = user_factory(email='portfolio_user@example.com', username='portfolio_user', password='password')
    # user is already committed by the factory, so user.id is available
    
    portfolio1 = portfolio_factory(user=user, name='My First Portfolio')
    portfolio2 = Portfolio(name='My Second Portfolio', user_id=user.id)
    session.add(portfolio2)
    session.commit() # Ensure portfolio2 is persisted and relationships updated

    retrieved_user = User.query.filter_by(username='portfolio_user').first()
    assert retrieved_user is not None
    assert retrieved_user.portfolios.count() == 2
    assert 'My First Portfolio' in [p.name for p in retrieved_user.portfolios]
    assert 'My Second Portfolio' in [p.name for p in retrieved_user.portfolios]

    retrieved_portfolio = Portfolio.query.filter_by(name='My First Portfolio').first()
    assert retrieved_portfolio is not None
    assert retrieved_portfolio.user == retrieved_user

# Tests for Portfolio Model
# Portfolio import is already at the top

def test_new_portfolio_creation(session, user_factory): # Assuming a user_factory fixture exists or create one
    """Test creating a new portfolio."""
    user = user_factory(email='portfolio_owner@example.com', username='portfolio_owner')
    # session.add(user) # user_factory should handle adding to session
    # session.commit() # user_factory should handle committing

    portfolio = Portfolio(name='Tech Stocks', description='Portfolio of tech stocks', user_id=user.id)
    session.add(portfolio)
    session.commit()

    retrieved_portfolio = Portfolio.query.filter_by(name='Tech Stocks').first()
    assert retrieved_portfolio is not None
    assert retrieved_portfolio.user == user
    assert retrieved_portfolio.description == 'Portfolio of tech stocks'

def test_portfolio_representation(session, user_factory):
    """Test the __repr__ method of Portfolio model."""
    user = user_factory(email='portfolio_repr_owner@example.com', username='portfolio_repr_owner')
    # session.add(user)
    # session.commit()
    
    portfolio = Portfolio(name='Retirement Fund', user_id=user.id)
    session.add(portfolio)
    session.commit()
    assert repr(portfolio) == f'<Portfolio {portfolio.portfolio_id} (Retirement Fund)>'


# Tests for Asset Model
def test_new_asset_creation(session, portfolio_factory): # Assuming a portfolio_factory fixture
    """Test creating a new asset."""
    portfolio = portfolio_factory() # Get a portfolio instance
    # session.add(portfolio) # portfolio_factory should handle adding to session
    # session.commit() # portfolio_factory should handle committing

    asset = Asset(
        portfolio_id=portfolio.portfolio_id,
        name_or_ticker='Apple Stock',
        asset_type=AssetType.STOCK,
        allocation_value=Decimal('1500.00')
    )
    session.add(asset)
    session.commit()

    retrieved_asset = Asset.query.filter_by(name_or_ticker='Apple Stock').first()
    assert retrieved_asset is not None
    assert retrieved_asset.portfolio_id == portfolio.portfolio_id
    assert retrieved_asset.asset_type == AssetType.STOCK
    assert retrieved_asset.allocation_value == Decimal('1500.00')

def test_asset_representation(session, portfolio_factory):
    """Test the __repr__ method of Asset model."""
    portfolio = portfolio_factory()
    # session.add(portfolio)
    # session.commit()

    asset = Asset(portfolio_id=portfolio.portfolio_id, name_or_ticker='Gold ETF', asset_type=AssetType.ETF, allocation_value=Decimal('200.0'))
    session.add(asset)
    session.commit()
    assert repr(asset) == f'<Asset {asset.asset_id}: Gold ETF>'

# Tests for PlannedFutureChange Model
# PlannedFutureChange import is already at the top
# Enums ChangeType, RecurrencePattern imported at the top
# datetime, date imported at the top

def test_new_planned_future_change_creation(session, portfolio_factory):
    """Test creating a new planned future change."""
    portfolio = portfolio_factory()
    # session.add(portfolio)
    # session.commit()
    
    change_date_val = date(2024, 12, 25)
    change = PlannedFutureChange(
        portfolio_id=portfolio.portfolio_id,
        description='Christmas bonus investment',
        change_type=ChangeType.CONTRIBUTION,
        amount=Decimal('500.00'), # Changed from value to amount
        change_date=change_date_val, # renamed variable to avoid conflict with 'date' type
        # currency=Currency.EUR # Currency is not part of this model
    )
    session.add(change)
    session.commit()

    retrieved_change = PlannedFutureChange.query.filter_by(description='Christmas bonus investment').first()
    assert retrieved_change is not None
    assert retrieved_change.portfolio_id == portfolio.portfolio_id
    assert retrieved_change.change_type == ChangeType.CONTRIBUTION
    assert retrieved_change.amount == Decimal('500.00') # Changed from value to amount
    assert retrieved_change.change_date == change_date_val
    # assert retrieved_change.currency == Currency.EUR # Currency is not part of this model

def test_planned_future_change_representation(session, portfolio_factory):
    """Test the __repr__ method of PlannedFutureChange model."""
    portfolio = portfolio_factory()
    # session.add(portfolio)
    # session.commit()

    change_date_val = date(2024,1,1) # renamed variable
    change = PlannedFutureChange(
        portfolio_id=portfolio.portfolio_id, 
        description='Monthly Savings', 
        change_type=ChangeType.CONTRIBUTION,
        amount=Decimal('100.00'), # Changed from value to amount
        change_date=change_date_val 
    )
    session.add(change)
    session.commit()
    assert repr(change) == f'<PlannedFutureChange {change.change_id}: Monthly Savings on {change_date_val}>'


# Tests for UserCeleryTask Model
# UserCeleryTask import is already at the top

def test_new_user_celery_task_creation(session, user_factory):
    """Test creating a new user celery task."""
    user = user_factory(email='task_user@example.com', username='task_user')
    # session.add(user)
    # session.commit()

    task = UserCeleryTask(
        user_id=user.id,
        task_id='some-celery-task-id-123'
        # task_name='portfolio_projection', # Removed, not in model
        # status='PENDING' # Removed, not in model
    )
    session.add(task)
    session.commit()

    retrieved_task = UserCeleryTask.query.filter_by(task_id='some-celery-task-id-123').first()
    assert retrieved_task is not None
    assert retrieved_task.user_id == user.id
    # assert retrieved_task.task_name == 'portfolio_projection'
    # assert retrieved_task.status == 'PENDING'
    assert retrieved_task.created_at is not None

def test_user_celery_task_representation(session, user_factory):
    """Test the __repr__ method of UserCeleryTask model."""
    user = user_factory()
    # session.add(user) # user_factory should handle this
    # session.commit() # user_factory should handle this
    
    task = UserCeleryTask(user_id=user.id, task_id='repr-task-id') # Removed task_name and status
    session.add(task)
    session.commit()
    assert repr(task) == f"<UserCeleryTask ID: {task.task_id}, UserID: {user.id}>" # Adjusted repr test for actual model attributes
