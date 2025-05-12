from app import db
from datetime import datetime, timezone

class UserCeleryTask(db.Model):
    __tablename__ = 'user_celery_tasks'

    task_id = db.Column(db.String(255), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship('User', backref=db.backref('celery_tasks', lazy=True))

    @classmethod
    def create_task_for_user(cls, user_id, task_id):
        """Creates a new record linking a user to a Celery task ID."""
        new_record = cls(user_id=user_id, task_id=task_id)
        db.session.add(new_record)
        # Note: The commit should happen in the calling function after this.
        return new_record

    def __repr__(self):
        return f'<UserCeleryTask {self.task_id} (User {self.user_id})>' 