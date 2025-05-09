from flask import Blueprint, jsonify, current_app, abort
from flask_jwt_extended import jwt_required
# Remove the original task_service import, as we'll use the temp dictionary for now
# from app.services.task_service import get_task_status 

# Import the temporary dictionary from projections.py
from app.routes.projections import TEMP_TASK_RESULTS

# Define the blueprint: 'tasks', prefix: /api/v1/tasks
tasks_bp = Blueprint('tasks', __name__)

@tasks_bp.route('/<string:task_id>', methods=['GET'])
@jwt_required()
def get_task_status_route(task_id):
    """
    Returns the status of a background task.
    Checks the temporary in-memory store first for projection tasks.
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
    # Check our temporary in-memory store first
    if task_id in TEMP_TASK_RESULTS:
        task_info = TEMP_TASK_RESULTS[task_id]
        # Ensure the response has a task_id field as per the schema
        response_data = {
            "task_id": task_id,
            "status": task_info.get("status", "UNKNOWN"),
            "result": task_info.get("result"), # Will be None if not present
            "error": task_info.get("error")    # Will be None if not present
        }
        return jsonify(response_data)
    else:
        # If not in our temp store, assume it's not found (for this temporary setup)
        # In a real system, you might fall back to another task service here.
        current_app.logger.info(f"Task {task_id} not found in TEMP_TASK_RESULTS.")
        abort(404, description=f"Task with id {task_id} not found.")

    # Original implementation (can be restored if combining with a real task service):
    # try:
    #     status = get_task_status(task_id)
    #     return jsonify(status)
    # except KeyError:
    #     # This is the expected error if the task_id doesn't exist
    #     abort(404, description=f"Task with id {task_id} not found.")
    # # Rely on global 500 handler for other unexpected errors 