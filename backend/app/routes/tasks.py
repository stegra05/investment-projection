from flask import Blueprint, jsonify, current_app, abort
from flask_jwt_extended import jwt_required
# Re-enable the original task_service import
from app.services.task_service import get_task_status 

# Remove the import of TEMP_TASK_RESULTS as it's now handled by the service
# from app import TEMP_TASK_RESULTS

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
              description: Current status of the task (PENDING, PROCESSING, COMPLETED, FAILED).
            result:
              type: object
              nullable: true
              description: Task result if completed, null otherwise.
            error:
              type: string
              nullable: true
              description: Error message if task failed, null otherwise.
            # Consider adding created_at and updated_at to the schema if they are consistently returned
            # created_at:
            #   type: string
            #   format: date-time
            #   description: Timestamp of when the task was created.
            # updated_at:
            #   type: string
            #   format: date-time
            #   description: Timestamp of when the task was last updated.
      404:
        description: Task not found.
    """
    try:
        status_data = get_task_status(task_id)
        # The get_task_status function now returns a schema-compliant dict,
        # including task_id, created_at, and updated_at.
        return jsonify(status_data)
    except KeyError:
        # This is the expected error if the task_id doesn't exist in the service layer
        current_app.logger.info(f"Task {task_id} not found via task_service.")
        abort(404, description=f"Task with id {task_id} not found.")
    # Rely on global 500 handler for other unexpected errors 