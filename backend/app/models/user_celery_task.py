"""Defines the UserCeleryTask SQLAlchemy model."""

from app import db
from datetime import datetime, timezone

class UserCeleryTask(db.Model):
    """Represents a link between a User and a Celery task.

    This model is used to store a record of Celery tasks initiated by users,
    allowing for tracking or management of these tasks in relation to the user.

    Attributes:
        task_id: The Celery task's unique ID. This is the primary key.
        user_id: The ID of the user who initiated or is associated with this task.
        created_at: The timestamp when this task record was created.
        user: Relationship to the User model.
    """
    __tablename__ = 'user_celery_tasks'

    task_id = db.Column(db.String(255), primary_key=True)  # Celery task IDs are strings
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship to User
    # backref='celery_tasks' creates a 'celery_tasks' attribute on the User model
    # lazy=True means the related tasks are loaded on demand
    user = db.relationship('User', backref=db.backref('celery_tasks', lazy=True))

    @classmethod
    def create_task_for_user(cls, user_id: int, task_id: str) -> 'UserCeleryTask':
        """Creates and returns a new UserCeleryTask record.

        This method instantiates a new UserCeleryTask, adds it to the current
        database session, but does not commit the session. The calling code
        is responsible for committing the transaction.

        Args:
            user_id (int): The ID of the user.
            task_id (str): The Celery task ID.

        Returns:
            UserCeleryTask: The newly created UserCeleryTask object.
        """
        new_record = cls(user_id=user_id, task_id=task_id)
        db.session.add(new_record)
        # The session commit (db.session.commit()) should be handled by the
        # calling function or service layer to manage transaction scope.
        return new_record

    def __repr__(self):
        """Provide a developer-friendly string representation of the object."""
        return f'<UserCeleryTask ID: {self.task_id}, UserID: {self.user_id}>'