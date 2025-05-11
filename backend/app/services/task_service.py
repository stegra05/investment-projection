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
    current_app.logger.debug(f"[task_service] Getting status for task_id: {task_id}")
    try:
        task_result = AsyncResult(task_id, app=celery_app)
        current_app.logger.debug(f"[task_service] Task {task_id} AsyncResult acquired. State: {task_result.state}, Info: {task_result.info}")

        celery_status = task_result.status
        current_app.logger.debug(f"[task_service] Task {task_id} Celery status: {celery_status}")

        app_status_map = {
            "PENDING": "PENDING",
            "STARTED": "PROCESSING",
            "SUCCESS": "COMPLETED",
            "FAILURE": "FAILED",
            "RETRY": "PROCESSING",
        }
        application_status = app_status_map.get(celery_status, celery_status)
        current_app.logger.debug(f"[task_service] Task {task_id} Mapped application_status: {application_status}")

        api_result = None
        api_message = None
        error_data = None

        if task_result.successful():
            current_app.logger.debug(f"[task_service] Task {task_id} is successful.")
            result_data = task_result.result
            current_app.logger.debug(f"[task_service] Task {task_id} result_data type: {type(result_data)}, value: {result_data}")
            if isinstance(result_data, dict):
                api_result = result_data.get("data")
                api_message = result_data.get("status") 
                if "message" in result_data:
                    api_message = result_data.get("message")
                if not api_message:
                    api_message = "Task completed successfully."
            else:
                api_result = result_data 
                api_message = "Task completed successfully with non-dictionary result."
            current_app.logger.debug(f"[task_service] Task {task_id} successful processing: api_result: {api_result is not None}, api_message: {api_message}")

        elif task_result.failed():
            current_app.logger.warning(f"[task_service] Task {task_id} failed.")
            error_info = task_result.result
            error_data = str(error_info) 
            current_app.logger.debug(f"[task_service] Task {task_id} failure info: {error_info}. Traceback: {task_result.traceback}")
            api_message = "Task failed. See error field for details."

        elif celery_status == 'PENDING': # Removed 'and not task_result.info' to provide a message even if info is present
            current_app.logger.debug(f"[task_service] Task {task_id} is PENDING. Info: {task_result.info}")
            api_message = "Task is pending."
            if task_result.info and isinstance(task_result.info, dict) and 'status' in task_result.info:
                 api_message = f"Task is pending: {task_result.info.get('status')}"
            elif task_result.info:
                api_message = f"Task is pending with status: {str(task_result.info)}"
        
        if not api_message and (application_status == "PROCESSING" or celery_status == 'STARTED' or celery_status == 'RETRY'):
            current_app.logger.debug(f"[task_service] Task {task_id} is PROCESSING/STARTED/RETRY without a specific message yet.")
            api_message = f"Task is currently {application_status.lower()}."
            if task_result.info and isinstance(task_result.info, dict) and 'status' in task_result.info:
                 api_message = f"Task is {application_status.lower()}: {task_result.info.get('status')}"
            elif task_result.info:
                api_message = f"Task is {application_status.lower()} with status: {str(task_result.info)}"

        # Ensure a default message if none is set
        if not api_message:
            api_message = f"Task status: {application_status}."
            current_app.logger.debug(f"[task_service] Task {task_id} setting default api_message: {api_message}")

        date_done_iso = None
        if task_result.date_done:
            try:
                date_done_iso = task_result.date_done.isoformat()
            except AttributeError as e_iso:
                current_app.logger.warning(f"[task_service] Task {task_id} had date_done but failed to isoformat: {e_iso}")
        current_app.logger.debug(f"[task_service] Task {task_id} date_done_iso: {date_done_iso}")

        response = {
            "task_id": task_id,
            "status": application_status,
            "result": api_result,
            "message": api_message,
            "error": error_data,
            "created_at": None, 
            "updated_at": date_done_iso
        }
        current_app.logger.debug(f"[task_service] Task {task_id} final response payload: {response}")
        return response

    except Exception as e_main:
        current_app.logger.error(f"[task_service] CRITICAL error in get_task_status for {task_id}: {str(e_main)}", exc_info=True)
        # Fallback response in case of unexpected error within get_task_status itself
        return {
            "task_id": task_id,
            "status": "UNKNOWN_ERROR",
            "result": None,
            "message": "An internal error occurred while fetching task status.",
            "error": str(e_main),
            "created_at": None,
            "updated_at": None
        }
