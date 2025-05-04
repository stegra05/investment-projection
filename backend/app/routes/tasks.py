from flask import Blueprint, jsonify, current_app, abort
from flask_jwt_extended import jwt_required
from app.services.task_service import get_task_status

# Define the blueprint: 'tasks', prefix: /api/v1/tasks
tasks_bp = Blueprint('tasks', __name__)

@tasks_bp.route('/<string:task_id>', methods=['GET'])
@jwt_required()
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
    except KeyError:
        # This is the expected error if the task_id doesn't exist
        abort(404, description=f"Task with id {task_id} not found.")
    # Rely on global 500 handler for other unexpected errors 