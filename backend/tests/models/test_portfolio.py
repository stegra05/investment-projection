import pytest
from app.models import User, Portfolio
from sqlalchemy.exc import IntegrityError
from datetime import datetime

def test_new_portfolio(db, test_user):
    """
    GIVEN a User and Portfolio model
    WHEN a new Portfolio is created for the user
    THEN check the fields are defined correctly and the user relationship works
    """
    portfolio = Portfolio(
        user_id=test_user.id,
        name="Retirement Savings",
        description="Long term growth portfolio"
    )
    db.session.add(portfolio)
    db.session.commit()

    assert portfolio.portfolio_id is not None
    assert portfolio.user_id == test_user.id
    assert portfolio.name == "Retirement Savings"
    assert portfolio.description == "Long term growth portfolio"
    assert portfolio.created_at is not None
    assert portfolio.updated_at is not None
    assert portfolio.user == test_user
    assert portfolio in test_user.portfolios.all()

def test_portfolio_missing_user(db):
    """
    GIVEN a Portfolio model
    WHEN a new Portfolio is created without a valid user_id
    THEN check that an IntegrityError is raised upon committing
    """
    portfolio = Portfolio(user_id=999, name="Orphan Portfolio") # Assume user 999 doesn't exist
    db.session.add(portfolio)
    with pytest.raises(IntegrityError):
        db.session.commit() # The commit must happen inside the context manager
    db.session.rollback() # Rollback after the expected error

def test_portfolio_missing_name(db, test_user):
    """
    GIVEN a Portfolio model
    WHEN a new Portfolio is created without a name
    THEN check that an IntegrityError is raised upon committing
    """
    # Rollback previous transaction if the last test failed mid-commit
    db.session.rollback()
    portfolio = Portfolio(user_id=test_user.id, description="Nameless")
    db.session.add(portfolio)
    with pytest.raises(IntegrityError):
        db.session.commit()

def test_portfolio_to_dict(db, test_user):
    """
    GIVEN a Portfolio instance
    WHEN the to_dict method is called
    THEN check the dictionary representation is correct (without details)
    """
    # Rollback previous transaction if the last test failed mid-commit
    db.session.rollback()

    now = datetime.utcnow()
    portfolio = Portfolio(
        user_id=test_user.id,
        name="Test Dict Portfolio",
        description="Testing to_dict",
        created_at=now, # Set specific times for predictable ISO format
        updated_at=now
    )
    db.session.add(portfolio)
    db.session.commit()

    expected_dict = {
        'portfolio_id': portfolio.portfolio_id,
        'user_id': test_user.id,
        'name': "Test Dict Portfolio",
        'description': "Testing to_dict",
        'created_at': now.isoformat(),
        'updated_at': now.isoformat(),
    }
    # Note: The actual DB timestamp might have microsecond differences
    # or timezone info depending on DB/SQLAlchemy config.
    # We compare core fields here.
    result_dict = portfolio.to_dict()
    assert result_dict['portfolio_id'] == expected_dict['portfolio_id']
    assert result_dict['user_id'] == expected_dict['user_id']
    assert result_dict['name'] == expected_dict['name']
    assert result_dict['description'] == expected_dict['description']
    # Optionally check timestamps within a small delta if needed
    assert isinstance(result_dict['created_at'], str)
    assert isinstance(result_dict['updated_at'], str)

# Add tests for to_dict(include_details=True) when Asset/PlannedChange models and tests exist 