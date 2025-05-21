"""
Blueprint for handling Celery task-related operations.

This includes routes for fetching the status of background tasks.
All routes require JWT authentication and ensure that users can only
access information about tasks they initiated.
"""
from flask import Blueprint, jsonify, current_app, abort
from flask_jwt_extended import jwt_required, get_jwt_identity, current_user # current_user for accessing User object
# Re-enable the original task_service import
# Re-enable the original task_service import if it was commented out
from app.services.task_service import get_task_status # Service to interact with Celery backend
from app.models import UserCeleryTask # Model to link users to Celery tasks
from app import db # SQLAlchemy database instance
from werkzeug.exceptions import HTTPException # For specific exception handling

# Define the blueprint: 'tasks'. The URL prefix (e.g., /api/v1/tasks) should be
# defined when this blueprint is registered in the main app factory (app/__init__.py).
# Assuming prefix will be '/api/v1/tasks' based on typical structure.
tasks_bp = Blueprint('tasks', __name__, url_prefix='/api/v1/tasks') # Added url_prefix

@tasks_bp.route('/<string:task_id>', methods=['GET'])
@jwt_required() # Ensures the user is authenticated
def get_task_by_id(task_id: str):
    """Retrieves the status and result (if available) of a specific Celery task.

    Ensures that the task being queried belongs to the authenticated user.

    Args:
        task_id (str): The unique ID of the Celery task.

    Returns:
        JSON response with task information (status, result, etc.) and a 200 status code.
        Returns 404 if the task is not found or does not belong to the user.
        Returns 500 for unexpected internal errors.
    """
    # Using current_app.logger for consistent logging
    current_app.logger.info(f"Task status request received for TaskID: '{task_id}' by UserID: '{get_jwt_identity()}'.")
    
    try:
        # `current_user` is injected by Flask-JWT-Extended if `JWT_USER_CLAIMS_LOADER` is configured
        # and a loader function returns the User object. Or, if using default identity,
        # `get_jwt_identity()` gives the user ID, which can then be used to fetch the user.
        # Here, assuming `current_user` (User object) is available. If not, fetch user by get_jwt_identity().
        
        if not current_user: # Should be caught by @jwt_required or loader, but good safeguard.
            current_app.logger.error(
                f"User context (current_user) not available for TaskID '{task_id}' despite @jwt_required. "
                "Check JWT user loading configuration."
            )
            # Abort with 500 as this indicates a server misconfiguration.
            abort(500, description="User context unavailable after authentication.")

        # Verify that the task ID is linked to the current user in the UserCeleryTask table.
        # This prevents one user from querying tasks of another user.
        user_task_link = UserCeleryTask.query.filter_by(
            task_id=task_id, 
            user_id=current_user.id
        ).first_or_404( # Returns 404 if no record found, meaning task doesn't exist or isn't owned by user.
            description=f"Task with ID '{task_id}' not found or not associated with the current user."
        )
        current_app.logger.debug(f"UserCeleryTask link found for TaskID '{task_id}' and UserID '{current_user.id}'.")

        # Call the service function to get the actual task status from Celery.
        task_information = get_task_status(task_id)
        current_app.logger.debug(f"Status for TaskID '{task_id} from service: {task_information}")

        return jsonify(task_information), 200
        
    except HTTPException as http_exc:
        # Re-raise Werkzeug HTTPExceptions (like the 404 from first_or_404)
        # so Flask can handle them and return the appropriate HTTP response.
        current_app.logger.warning(f"HTTPException for TaskID '{task_id}': {http_exc}")
        raise http_exc 
    except Exception as e:
        # Catch any other unexpected exceptions during the process.
        current_app.logger.error(
            f"Unexpected error while fetching status for TaskID '{task_id}': {str(e)}", 
            exc_info=True # Includes stack trace in logs
        )
        # Return a generic 500 error to the client.
        abort(500, description="An unexpected error occurred while fetching task status. Please try again later.")

# Example route for initiating a task.
# This is illustrative and should be replaced or adapted for actual application tasks.
@tasks_bp.route('/run_example_task', methods=['POST'])
@jwt_required()
def run_example_task_route():
    """(Example) Initiates a sample background task for the authenticated user.
    
    This is a placeholder to demonstrate task creation and linking.
    In a real application, this would trigger a meaningful background process.
    """
    user_id_from_jwt = get_jwt_identity()
    current_app.logger.info(f"Example task initiation request by UserID: '{user_id_from_jwt}'.")
    
    try:
        # Ensure `current_user.id` is accessible if needed for the task itself or for UserCeleryTask.
        # If `current_user` is a User object:
        # user_id = current_user.id
        # If `get_jwt_identity()` directly provides the integer user ID, use that.
        # For this example, let's assume get_jwt_identity() gives the string form of user_id.
        try:
            user_id = int(user_id_from_jwt)
        except (ValueError, TypeError):
            current_app.logger.error(f"Invalid user ID format in JWT for example task: {user_id_from_jwt}")
            abort(400, description="Invalid user identity in token.")

        # --- Placeholder for actual Celery task dispatch ---
        # Example: from app.background_workers import actual_example_task
        # celery_task = actual_example_task.delay(user_id=user_id, other_params="...")
        # task_id = celery_task.id
        # For this example, we'll use a fake task_id.
        task_id = f"fake-example-task-{datetime.datetime.utcnow().timestamp()}-{user_id}"
        current_app.logger.info(f"Generated fake TaskID '{task_id}' for example task for UserID '{user_id}'.")
        # ----------------------------------------------------

        # Link the task to the user in the database.
        UserCeleryTask.create_task_for_user(user_id=user_id, task_id=task_id)
        db.session.commit() 
        current_app.logger.info(f"Example task '{task_id}' (UserCeleryTask record created) dispatched for UserID '{user_id}'.")
        
        return jsonify({"message": "Example task initiated successfully.", "task_id": task_id}), 202 # HTTP 202 Accepted
        
    except HTTPException as http_exc:
        # Re-raise known HTTP exceptions.
        current_app.logger.warning(f"HTTPException during example task initiation: {http_exc}")
        db.session.rollback() # Ensure rollback on error before re-raising
        raise http_exc
    except Exception as e:
        # Catch unexpected errors.
        current_app.logger.error(
            f"Unexpected error during example task initiation for UserID '{user_id_from_jwt}': {str(e)}",
            exc_info=True
        )
        db.session.rollback() # Rollback database changes on error.
        abort(500, description="An unexpected error occurred while initiating the example task.")