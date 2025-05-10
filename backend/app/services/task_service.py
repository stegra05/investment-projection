from flask import current_app
from datetime import datetime
# Import TEMP_TASK_RESULTS from the app package
from app import TEMP_TASK_RESULTS

def get_task_status(task_id):
    """
    Get the status of a task by its ID.
    
    Args:
        task_id (str): The ID of the task to check
        
    Returns:
        dict: Task status information including:
            - task_id: The task identifier
            - status: Current status (PENDING, PROCESSING, COMPLETED, FAILED)
            - result: Task result if completed
            - error: Error message if failed
            - created_at: When the task was created
            - updated_at: When the task was last updated
    Raises:
        KeyError: if the task_id is not found.
    """
    if task_id in TEMP_TASK_RESULTS:
        task_info = TEMP_TASK_RESULTS[task_id]
        
        # Determine status; default to PENDING if not explicitly set yet by worker
        status = task_info.get("status", "PENDING") 
        
        # Construct the response, ensuring all fields are present
        response = {
            "task_id": task_id,
            "status": status,
            "result": task_info.get("result"), # Will be None if not present
            "error": task_info.get("error"),   # Will be None if not present
            # For now, using current time. Ideally, these would be stored with the task.
            "created_at": datetime.utcnow().isoformat(), 
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # If the worker set a message, it could be useful, but it's not in the defined schema.
        # We could log it or add it to a 'details' field if the schema were extended.
        # For now, we'll stick to the defined schema.
        # current_app.logger.info(f"Task {task_id} details: {task_info.get('message')}")

        return response
    else:
        # If task_id is not in TEMP_TASK_RESULTS, it's considered not found.
        # The route handler in tasks.py will catch this KeyError and return a 404.
        raise KeyError(f"Task with id {task_id} not found in TEMP_TASK_RESULTS.")

# Example of how the worker might update TEMP_TASK_RESULTS (for reference, not part of this service)
# TEMP_TASK_RESULTS["some_task_id"] = {
#     "status": "PENDING", 
#     "start_date": "2024-01-01", 
#     # ... other parameters for the worker
# }
# TEMP_TASK_RESULTS["completed_task_id"] = {
#     "status": "COMPLETED", 
#     "result": {"data": {"key": "value"}},
#     "message": "Task done"
# }
# TEMP_TASK_RESULTS["failed_task_id"] = {
#     "status": "FAILED", 
#     "error": "Something went wrong"
# } 