from flask import Blueprint, jsonify, current_app, abort
from flask_jwt_extended import jwt_required, get_jwt_identity
# Re-enable the original task_service import
from app.services.task_service import get_task_status
from app.models import UserCeleryTask
from app import db

tasks_bp = Blueprint('tasks', __name__)

@tasks_bp.route('/<string:task_id>', methods=['GET'])
@jwt_required()
def get_task_status_route(task_id):
    """
    Returns the status of a background task.
    Uses the task_service to fetch task status.
    ---
    parameters:
      - name: task_id
        in: path
        type: string
        required: true
        description: Unique identifier of the task.
    responses:
      200:
        description: Task status retrieved successfully.
        schema:
          type: object
          properties:
            task_id:
              type: string
              description: The task identifier.
            status:
              type: string
              description: Current status of the task (e.g., PENDING, STARTED, SUCCESS, FAILURE, RETRY).
            result:
              type: object
              nullable: true
              description: Task result if completed (structure depends on task).
            message:
              type: string
              nullable: true
              description: Additional message from the task if available.
            error:
              type: string
              nullable: true
              description: Error message if task failed, null otherwise.
            created_at:
              type: string
              format: date-time
              nullable: true
              description: Timestamp of when the task was created (placeholder).
            updated_at:
              type: string
              format: date-time
              nullable: true
              description: Timestamp of when the task was completed or last updated.
      403:
        description: User does not have permission to access this task.
      404:
        description: Task not found or does not belong to the user.
    """
    current_user_id = get_jwt_identity()
    # Check if the task belongs to the current user
    user_task = UserCeleryTask.query.filter_by(task_id=task_id, user_id=current_user_id).first()

    if not user_task:
        # To avoid leaking information about task existence, return 404
        # if the task doesn't exist or doesn't belong to the user.
        abort(404, description="Task not found or you do not have permission to view it.")

    status_data = get_task_status(task_id)
    return jsonify(status_data)
    # Rely on global 500 handler for other unexpected errors 