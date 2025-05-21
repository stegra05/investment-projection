"""
Service module for interacting with Celery tasks.

This module provides functions to retrieve the status and results of
background tasks managed by Celery. It uses Celery's `AsyncResult`
to query the task state from the Celery backend (e.g., Redis, RabbitMQ).
"""
from flask import current_app # For accessing application logger
from datetime import datetime # Potentially for timestamping, though Celery provides date_done
from celery.result import AsyncResult # Used to query Celery task states

# Import the Celery app instance. This is necessary for `AsyncResult` to
# correctly connect to the Celery backend (e.g., Redis, RabbitMQ) and fetch task info.
from app import celery_app 

def get_task_status(task_id: str) -> dict:
    """Retrieves the status and result of a Celery task by its ID.

    This function queries the Celery backend for a task's current state,
    maps Celery's internal statuses to application-specific statuses
    (e.g., "PROCESSING", "COMPLETED", "FAILED"), and formats the information
    for an API response.

    Args:
        task_id: The unique identifier of the Celery task.
        
    Returns:
        A dictionary containing task status information:
            - task_id (str): The task's ID.
            - status (str): The application-specific status (e.g., "PENDING", "PROCESSING",
                            "COMPLETED", "FAILED", "UNKNOWN_ERROR").
            - result (Optional[any]): The task's result if it completed successfully.
                                      The structure depends on what the Celery task returns.
            - message (str): A human-readable message describing the task's state.
            - error (Optional[str]): Error message or traceback if the task failed.
            - created_at (None): Placeholder; Celery's AsyncResult doesn't directly store
                                 task creation time easily. This might be populated from
                                 a separate database record if needed (e.g., from UserCeleryTask).
            - updated_at (Optional[str]): ISO 8601 timestamp of when the task finished
                                          (either successfully or failed), if available.
    
    Note:
        If an unexpected error occurs within this service function itself (not a task failure),
        it logs the error and returns a status of "UNKNOWN_ERROR" with details.
    """
    current_app.logger.info(f"Requesting status for Celery TaskID: '{task_id}'.")
    try:
        # Get the AsyncResult object for the given task_id.
        # `app=celery_app` ensures it uses the application's Celery configuration.
        task_result = AsyncResult(task_id, app=celery_app)
        current_app.logger.debug(f"TaskID '{task_id}': Celery AsyncResult obtained. Raw State: '{task_result.state}', Info: {task_result.info}")

        # Celery's native status (e.g., "PENDING", "STARTED", "SUCCESS", "FAILURE", "RETRY").
        celery_native_status = task_result.status
        current_app.logger.debug(f"TaskID '{task_id}': Celery native status: '{celery_native_status}'.")

        # Map Celery statuses to more user-friendly, application-specific statuses.
        app_status_mapping = {
            "PENDING": "PENDING",    # Task is waiting to be picked up by a worker.
            "STARTED": "PROCESSING", # Task has been picked up and is running.
            "SUCCESS": "COMPLETED",  # Task finished successfully.
            "FAILURE": "FAILED",     # Task encountered an error.
            "RETRY": "PROCESSING",   # Task is being retried (still considered processing).
            # Other Celery states like REVOKED could be mapped if used.
        }
        # If a Celery status isn't in our map, use the Celery status directly (should be rare).
        application_status = app_status_mapping.get(celery_native_status, celery_native_status)
        current_app.logger.debug(f"TaskID '{task_id}': Mapped application status: '{application_status}'.")

        # Initialize components of the API response.
        api_response_result = None # Holds the actual data returned by the task, if successful.
        api_response_message = None # Human-readable message for the API response.
        api_response_error_details = None # Holds error information if the task failed.

        # Populate response fields based on task state.
        if task_result.successful():
            current_app.logger.info(f"TaskID '{task_id}' completed successfully.")
            raw_celery_result = task_result.result
            current_app.logger.debug(f"TaskID '{task_id}': Raw Celery result type: {type(raw_celery_result)}, Value: {raw_celery_result}")
            
            # Standardize how results are presented. If Celery task returns a dict with specific keys, extract them.
            # This provides a consistent structure for API consumers.
            if isinstance(raw_celery_result, dict):
                api_response_result = raw_celery_result.get("data") # Expected data payload
                api_response_message = raw_celery_result.get("message", raw_celery_result.get("status")) # Prefer "message", fallback to "status"
                if not api_response_message: # Default success message if task didn't provide one
                    api_response_message = "Task completed successfully."
            else: # Task returned something other than a dictionary
                api_response_result = raw_celery_result 
                api_response_message = "Task completed successfully (non-standard result format)."
            current_app.logger.debug(f"TaskID '{task_id}': Processed successful result. API Result Present: {api_response_result is not None}, Message: '{api_response_message}'.")

        elif task_result.failed():
            current_app.logger.warning(f"TaskID '{task_id}' failed.")
            error_info_from_celery = task_result.result # This is usually the Exception instance.
            api_response_error_details = str(error_info_from_celery) # Convert exception to string for API.
            current_app.logger.debug(f"TaskID '{task_id}': Failure info: {error_info_from_celery}. Traceback (if available): {task_result.traceback}")
            api_response_message = "Task failed. Check 'error' field for details."

        elif celery_native_status == 'PENDING':
            current_app.logger.debug(f"TaskID '{task_id}' is PENDING. Celery Info: {task_result.info}")
            api_response_message = "Task is pending execution."
            # Celery tasks can update their 'info' (metadata) while pending or running.
            if task_result.info and isinstance(task_result.info, dict) and 'status' in task_result.info:
                 api_response_message = f"Task is pending: {task_result.info.get('status')}" # More specific status from task itself
            elif task_result.info: # If info is present but not a dict with 'status'
                api_response_message = f"Task is pending with metadata: {str(task_result.info)}"
        
        # Handle other processing states (STARTED, RETRY) if no specific message yet.
        if not api_response_message and application_status == "PROCESSING":
            current_app.logger.debug(f"TaskID '{task_id}' is {celery_native_status} (mapped to PROCESSING). Celery Info: {task_result.info}")
            api_response_message = f"Task is currently {application_status.lower()}."
            # Provide more detail if the task updated its metadata.
            if task_result.info and isinstance(task_result.info, dict) and 'status' in task_result.info:
                 api_response_message = f"Task is {application_status.lower()}: {task_result.info.get('status')}"
            elif task_result.info:
                api_response_message = f"Task is {application_status.lower()} with metadata: {str(task_result.info)}"

        # Default message if none of the above conditions set one.
        if not api_response_message:
            api_response_message = f"Task status: {application_status}."
            current_app.logger.debug(f"TaskID '{task_id}': Using default API message: '{api_response_message}'.")

        # Get the completion timestamp if available.
        iso_date_done = None
        if task_result.date_done: # Timestamp for when the task finished (SUCCESS or FAILURE)
            try:
                iso_date_done = task_result.date_done.isoformat()
            except AttributeError: # Should not happen if date_done is a datetime object
                current_app.logger.warning(f"TaskID '{task_id}': 'date_done' attribute '{task_result.date_done}' could not be ISO formatted.")
        current_app.logger.debug(f"TaskID '{task_id}': Completion timestamp (ISO): {iso_date_done}.")

        # Construct the final API response.
        response_payload = {
            "task_id": task_id,
            "status": application_status,
            "result": api_response_result,
            "message": api_response_message,
            "error": api_response_error_details,
            "created_at": None, # Placeholder - consider fetching from UserCeleryTask table if needed
            "updated_at": iso_date_done # Reflects when task processing ended
        }
        current_app.logger.info(f"TaskID '{task_id}': Successfully prepared status response.")
        current_app.logger.debug(f"TaskID '{task_id}': Final response payload: {response_payload}")
        return response_payload

    except Exception as e: # Catch any unexpected errors within this service function.
        current_app.logger.error(
            f"Critical error in get_task_status for TaskID '{task_id}': {str(e)}", 
            exc_info=True # Log full traceback for unexpected errors.
        )
        # Return a standardized error structure for internal server errors.
        return {
            "task_id": task_id,
            "status": "UNKNOWN_ERROR", # Indicates an error in the status retrieval itself
            "result": None,
            "message": "An internal server error occurred while fetching task status.",
            "error": str(e), # Provide error string for debugging if appropriate
            "created_at": None,
            "updated_at": None
        }
