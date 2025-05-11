from flask import current_app
from datetime import datetime
from celery.result import AsyncResult

# Import the Celery app instance to potentially access task states if needed,
# though AsyncResult is usually sufficient.
from app import celery_app 

def get_task_status(task_id):
    """
    Get the status of a Celery task by its ID.
    
    Args:
        task_id (str): The ID of the Celery task to check.
        
    Returns:
        dict: Task status information including:
            - task_id: The task identifier
            - status: Current status (PENDING, STARTED, RETRY, FAILURE, SUCCESS)
                      (mapping to your application's preferred terms like COMPLETED, FAILED may be needed)
            - result: Task result if completed successfully (structure depends on task return value)
            - error: Error message/traceback if failed (structure depends on Celery error storage)
            - created_at: Placeholder, Celery doesn't directly store creation time in AsyncResult easily.
            - updated_at: Placeholder, Celery provides date_done, but not continuous updates.
    Raises:
        KeyError: if the task_id is not found (though Celery might behave differently, e.g. PENDING for unknown).
    """
    task_result = AsyncResult(task_id, app=celery_app)
    
    status = task_result.status # Celery status: PENDING, STARTED, RETRY, FAILURE, SUCCESS
    result_data = None
    error_data = None

    # Map Celery status to your application's status terminology if needed
    # For now, we'll use Celery's native statuses.
    # Example mapping:
    # app_status_map = {
    #     "PENDING": "PENDING",
    #     "STARTED": "PROCESSING", # Or "RUNNING"
    #     "SUCCESS": "COMPLETED",
    #     "FAILURE": "FAILED",
    #     "RETRY": "PROCESSING", # Or "RETRYING"
    # }
    # application_status = app_status_map.get(status, "UNKNOWN")

    if task_result.successful():
        result_data = task_result.result # This is the dict returned by the task
    elif task_result.failed():
        # task_result.result or task_result.traceback can contain error info
        error_info = task_result.result # The exception object
        error_data = str(error_info) # Convert exception to string for simple representation
        # For more detail, you might want task_result.traceback
        current_app.logger.debug(f"Task {task_id} failed. Traceback: {task_result.traceback}")
    elif status == 'PENDING' and not task_result.info: # Check if it's truly pending or just unknown
        # A task ID that Celery doesn't know about will also show as PENDING initially.
        # If task_result.info is None or empty after a short while, it likely doesn't exist.
        # For simplicity, we are not raising KeyError here anymore, the route will return PENDING.
        # The route handler can decide if PENDING for an unknown task_id should be a 404.
        pass # Keep status as PENDING

    response = {
        "task_id": task_id,
        "status": status, # Using Celery's direct status for now
        "result": result_data.get("data") if isinstance(result_data, dict) and "data" in result_data else None, # Extract nested data if present
        "message": result_data.get("message") if isinstance(result_data, dict) and "message" in result_data else None,
        "error": error_data, 
        # Timestamps are not straightforward with AsyncResult alone.
        # For more detailed timestamps, you might need to store them separately 
        # when the task is created or use Celery events monitoring.
        "created_at": None, # Placeholder 
        "updated_at": task_result.date_done.isoformat() if task_result.date_done else None # When task finished
    }
    return response
