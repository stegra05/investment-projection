from flask import Blueprint, jsonify, current_app, abort
from flask_jwt_extended import jwt_required, get_jwt_identity, current_user
# Re-enable the original task_service import
from app.services.task_service import get_task_status
from app.models import UserCeleryTask
from app import db
from werkzeug.exceptions import HTTPException

tasks_bp = Blueprint('tasks', __name__)

@tasks_bp.route('/<string:task_id>', methods=['GET'])
@jwt_required()
def get_task_by_id(task_id):
    # VERY EARLY LOGGING
    current_app.logger.info(f"[tasks.py] GET /api/v1/tasks/{task_id} - ROUTE HIT") 
    try:
        current_app.logger.debug(f"[tasks.py] Entering get_task_by_id for task_id: {task_id}, user_id from JWT: {get_jwt_identity()}")
        
        # It's good practice to verify current_user exists, though @jwt_required should handle it.
        if not current_user:
            current_app.logger.error(f"[tasks.py] current_user is None for task_id: {task_id}. This should not happen with @jwt_required.")
            abort(500, description="User context not available after JWT authentication.")

        current_app.logger.debug(f"[tasks.py] current_user.id: {current_user.id} for task_id: {task_id}")

        # Ensure the task belongs to the current user
        current_app.logger.debug(f"[tasks.py] Querying UserCeleryTask for task_id: {task_id}, user_id: {str(current_user.id)}")
        user_task = UserCeleryTask.query.filter_by(task_id=task_id, user_id=str(current_user.id)).first_or_404(
            description=f"Task with ID {task_id} not found for the current user or query failed."
        )
        current_app.logger.debug(f"[tasks.py] UserCeleryTask found: {user_task} for task_id: {task_id}")

        task_info = get_task_status(task_id)
        current_app.logger.debug(f"[tasks.py] Task info from service for {task_id}: {task_info}")

        return jsonify(task_info), 200
    except Exception as e:
        # Check if the exception is a Werkzeug HTTPException (like the 404 from first_or_404)
        # If it is, re-raise it to let Flask handle it correctly.
        if isinstance(e, HTTPException):
            raise e
        # For any other unexpected exceptions, log and return 500
        current_app.logger.error(f"[tasks.py] UNEXPECTED EXCEPTION in get_task_by_id for task_id {task_id}: {str(e)}", exc_info=True)
        abort(500, description="An unexpected error occurred while fetching task status.")

# Example route for initiating a task (replace with your actual task initiation logic)
@tasks_bp.route('/run_example_task', methods=['POST'])
@jwt_required()
def run_example_task_route():
    current_app.logger.info(f"[tasks.py] POST /run_example_task - ROUTE HIT by user {get_jwt_identity()}")
    try:
        # Make sure current_user is available
        user_id = current_user.id 
        # from app.background_workers import example_task # Assuming you have such a task
        # task = example_task.delay(user_id=user_id)
        
        # Placeholder for actual task dispatch
        task_id = "fake-task-id-for-example-" + str(user_id)
        UserCeleryTask.create_task_for_user(user_id=user_id, task_id=task_id)
        db.session.commit() 
        current_app.logger.info(f"[tasks.py] Example task {task_id} dispatched for user {user_id}.")
        return jsonify({"message": "Example task initiated", "task_id": task_id}), 202
    except Exception as e:
        # Also apply similar logic here if needed, though less critical for this example route
        if isinstance(e, HTTPException):
            raise e
        current_app.logger.error(f"[tasks.py] UNEXPECTED EXCEPTION in run_example_task_route: {str(e)}", exc_info=True)
        db.session.rollback()
        abort(500, description="An unexpected error occurred while initiating example task.") 