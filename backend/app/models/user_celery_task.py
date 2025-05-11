from app import db
from datetime import datetime, timezone

class UserCeleryTask(db.Model):
    __tablename__ = 'user_celery_tasks'

    task_id = db.Column(db.String(255), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship('User', backref=db.backref('celery_tasks', lazy=True))

    def __repr__(self):
        return f'<UserCeleryTask {self.task_id} (User {self.user_id})>' 