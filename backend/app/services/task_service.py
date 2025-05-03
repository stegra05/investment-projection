from flask import current_app
from datetime import datetime

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
    """
    # TODO: Replace with actual task status lookup from your task queue/DB
    # This is a mock implementation for now
    
    # Simulate different statuses based on task_id
    status = "PENDING"
    if len(task_id) % 4 == 0:
        status = "COMPLETED"
    elif len(task_id) % 4 == 1:
        status = "PROCESSING"
    elif len(task_id) % 4 == 2:
        status = "FAILED"
    
    response = {
        "task_id": task_id,
        "status": status,
        "result": None,
        "error": None,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    # Add mock results or errors based on status
    if status == "COMPLETED":
        response["result"] = {
            "data": {
                "2024-01-01": 1000,
                "2024-02-01": 1050,
                "2024-03-01": 1102.5,
                "2024-04-01": 1157.63,
                "2024-05-01": 1215.51
            }
        }
    elif status == "FAILED":
        response["error"] = "Simulated task failure"
    
    return response 