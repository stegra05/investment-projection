from flask import Blueprint, jsonify, current_app
from flask_jwt_extended import jwt_required
from app.services.task_service import get_task_status
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Define the blueprint: 'tasks', prefix: /api/v1/tasks
tasks_bp = Blueprint('tasks', __name__, url_prefix='/api/v1/tasks')
limiter = Limiter(key_func=get_remote_address)

@tasks_bp.route('/<string:task_id>', methods=['GET'])
@jwt_required()
@limiter.limit("10 per minute")  # More generous limit for task status checks
def get_task_status_route(task_id):
    """
    Returns the status of a background task.
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
              description: Current status of the task (PENDING, PROCESSING, COMPLETED, FAILED).
            result:
              type: object
              nullable: true
              description: Task result if completed, null otherwise.
            error:
              type: string
              nullable: true
              description: Error message if task failed, null otherwise.
      404:
        description: Task not found.
    """
    try:
        status = get_task_status(task_id)
        return jsonify(status)
    except Exception as e:
        current_app.logger.error(f"Error getting task status: {str(e)}")
        return jsonify({"error": str(e)}), 404 