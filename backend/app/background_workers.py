import time
from decimal import Decimal, InvalidOperation
import datetime
from flask import current_app # For logging within the task

# Import the Celery app instance created in app/__init__.py
from app import celery_app
from app.services.projection_engine import calculate_projection

# -------------------------------------------------

@celery_app.task(bind=True)
def run_projection_task(self, portfolio_id, start_date_str, end_date_str, initial_total_value_str):
    """
    Celery task to calculate an investment projection.
    Args:
        self: The task instance (automatically passed by Celery when bind=True).
        portfolio_id (int): The ID of the portfolio.
        start_date_str (str): Start date in 'YYYY-MM-DD' format.
        end_date_str (str): End date in 'YYYY-MM-DD' format.
        initial_total_value_str (str): Initial total value as a string.
    Returns:
        dict: A dictionary containing the projection data or an error message.
    """
    task_id = self.request.id
    current_app.logger.info(f"Celery Worker: Picking up task {task_id} for portfolio {portfolio_id}")

    try:
        # Convert stored string dates/decimals back to required types
        start_date = datetime.datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.datetime.strptime(end_date_str, '%Y-%m-%d').date()
        initial_total_value = Decimal(initial_total_value_str)

        # The actual projection calculation
        projection_data = calculate_projection(
            portfolio_id=portfolio_id,
            start_date=start_date,
            end_date=end_date,
            initial_total_value=initial_total_value
            # draft_changes_input is not part of the standard task for now
        )
        
        # Format data for JSON serialization (dates as keys, values as strings)
        formatted_data_obj = {
            item_date.isoformat(): str(item_value)
            for item_date, item_value in projection_data
        }
        
        current_app.logger.info(f"Celery Worker: Task {task_id} COMPLETED successfully.")
        return {"status": "SUCCESS", "data": formatted_data_obj, "message": "Projection calculated successfully."}
    
    except InvalidOperation as e:
        current_app.logger.error(f"Celery Worker: InvalidOperation for task {task_id}: {e}", exc_info=True)
        # Celery tasks can raise exceptions, which will mark them as FAILED.
        # The result stored by Celery will be the exception itself.
        # We can customize the failure state if needed using self.update_state()
        raise # Re-raise to let Celery handle it as a failure and store the error info
    
    except ValueError as e: # Catch issues from strptime
        current_app.logger.error(f"Celery Worker: ValueError (likely date format) for task {task_id}: {e}", exc_info=True)
        raise
        
    except Exception as e:
        current_app.logger.error(f"Celery Worker: Unhandled error processing task {task_id}: {e}", exc_info=True)
        # This will mark the task as FAILED and store the exception as the result.
        raise # Re-raise to let Celery handle it
    