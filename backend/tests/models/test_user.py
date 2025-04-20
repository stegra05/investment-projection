import pytest
from app.models import User
from sqlalchemy.exc import IntegrityError

def test_new_user(db):
    """
    GIVEN a User model
    WHEN a new User is created
    THEN check the username, email, and password fields are defined correctly
    """
    user = User(username='testuser', email='test@example.com')
    user.set_password('password123')

    db.session.add(user)
    db.session.commit()

    assert user.id is not None
    assert user.username == 'testuser'
    assert user.email == 'test@example.com'
    assert user.password_hash != 'password123' # Ensure password is hashed
    assert isinstance(user.password_hash, str)
    assert len(user.password_hash) > 0

def test_password_hashing(db):
    """
    GIVEN a User model
    WHEN the set_password method is called
    THEN check the password is correctly hashed and check_password works
    """
    user = User(username='testuser2', email='test2@example.com')
    user.set_password('mysecretpassword')

    assert user.password_hash is not None
    assert user.check_password('mysecretpassword')
    assert not user.check_password('wrongpassword')

    # Save and retrieve to ensure hash is stored correctly
    db.session.add(user)
    db.session.commit()

    retrieved_user = User.query.filter_by(username='testuser2').first()
    assert retrieved_user is not None
    assert retrieved_user.check_password('mysecretpassword')
    assert not retrieved_user.check_password('anotherwrongpassword')

def test_duplicate_username(db):
    """
    GIVEN a User model
    WHEN two users with the same username are created
    THEN check that an IntegrityError is raised upon committing
    """
    user1 = User(username='duplicate', email='dup1@example.com')
    user1.set_password('pass1')
    db.session.add(user1)
    db.session.commit()

    user2 = User(username='duplicate', email='dup2@example.com')
    user2.set_password('pass2')
    db.session.add(user2)

    with pytest.raises(IntegrityError):
        db.session.commit()

def test_duplicate_email(db):
    """
    GIVEN a User model
    WHEN two users with the same email are created
    THEN check that an IntegrityError is raised upon committing
    """
    # Rollback previous transaction if the last test failed mid-commit
    db.session.rollback()

    user1 = User(username='emailtest1', email='duplicate@example.com')
    user1.set_password('pass1')
    db.session.add(user1)
    db.session.commit()

    user2 = User(username='emailtest2', email='duplicate@example.com')
    user2.set_password('pass2')
    db.session.add(user2)

    with pytest.raises(IntegrityError):
        db.session.commit()

def test_user_repr():
    """
    GIVEN a User instance
    WHEN the __repr__ method is called
    THEN check the string representation is correct
    """
    user = User(username='repruser', email='repr@example.com')
    assert repr(user) == '<User repruser>' 