import threading
import time
from decimal import Decimal, InvalidOperation
import datetime

# Import here to avoid circular imports and ensure app context is active
from app.services.projection_engine import calculate_projection

# --- In-memory storage for task results (shared between routes and worker) ---
# This might also be moved or managed differently in a larger application
TEMP_TASK_RESULTS = {} 
# --------------------------------------------------------------------------

# --- Simulated Projection Worker ---
def projection_worker_function(app_context):
    """
    Simulates a background worker that processes projection tasks.
    """
    with app_context: # Use the passed application context
        current_app = app_context.app # Get the actual app object
        while True:
            try:
                tasks_to_process = []
                # Safely iterate over a copy of items if modifying the dict
                for task_id, task_info in list(TEMP_TASK_RESULTS.items()):
                    if task_info.get("status") == "PENDING":
                        tasks_to_process.append((task_id, task_info))

                for task_id, task_info in tasks_to_process:
                    current_app.logger.info(f"Worker: Picking up task {task_id}")
                    try:
                        # Convert stored string dates/decimals back to required types
                        start_date = datetime.datetime.strptime(task_info["start_date"], '%Y-%m-%d').date()
                        end_date = datetime.datetime.strptime(task_info["end_date"], '%Y-%m-%d').date()
                        initial_total_value = Decimal(task_info["initial_total_value"])
                        portfolio_id = task_info["portfolio_id"]

                        projection_data = calculate_projection(
                            portfolio_id=portfolio_id,
                            start_date=start_date,
                            end_date=end_date,
                            initial_total_value=initial_total_value
                            # draft_changes_input is not part of the standard task for now
                        )
                        formatted_data_obj = {
                            item_date.isoformat(): str(item_value)
                            for item_date, item_value in projection_data
                        }
                        TEMP_TASK_RESULTS[task_id] = {
                            "status": "COMPLETED",
                            "result": {"data": formatted_data_obj},
                            "message": "Projection calculated successfully."
                        }
                        current_app.logger.info(f"Worker: Task {task_id} COMPLETED.")
                    except InvalidOperation as e:
                        current_app.logger.error(f"Worker: InvalidOperation for task {task_id}: {e}", exc_info=True)
                        TEMP_TASK_RESULTS[task_id] = {"status": "FAILED", "error": f"Invalid data for calculation: {e}"}
                    except Exception as e:
                        current_app.logger.error(f"Worker: Error processing task {task_id}: {e}", exc_info=True)
                        TEMP_TASK_RESULTS[task_id] = {"status": "FAILED", "error": "Internal worker error during projection calculation."}
                
                # Check for new tasks periodically
                time.sleep(5)  # Poll every 5 seconds
            except Exception as e:
                # Log any unexpected errors in the worker loop itself
                if current_app: # Check if current_app is available
                    current_app.logger.error(f"Worker: Unhandled exception in worker loop: {e}", exc_info=True)
                else: # Fallback logging if app context is somehow lost (should not happen)
                    print(f"Worker: Unhandled exception in worker loop (no app context): {e}")
                time.sleep(10) # Wait longer if the loop itself crashes 