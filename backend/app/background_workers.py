"""
Celery background task definitions for the application.

This module defines Celery tasks that can be run asynchronously from the main
Flask application. These tasks are typically long-running operations, such as
complex calculations or interactions with external services, that should not
block the web server.

Tasks defined here are registered with the Celery app instance (`celery_app`)
and can be dispatched using Celery's `delay()` or `apply_async()` methods.
"""
import time # Potentially for simulated work or specific timing needs
from decimal import Decimal, InvalidOperation # For precise financial numbers
import datetime
from flask import current_app # For logging within the task

# Import the Celery app instance created in `app/__init__.py`.
# This `celery_app` object is used to decorate task functions.
from app import celery_app 
# Import the core projection calculation logic from the services layer.
from app.services.projection_engine import calculate_projection

# A horizontal line for visual separation in the code, if desired.
# ------------------------------------------------- 

@celery_app.task(bind=True) # `@celery_app.task` registers the function as a Celery task.
                           # `bind=True` makes `self` (the task instance) available as the first argument.
def run_projection_task(self, portfolio_id: int, start_date_str: str, end_date_str: str, initial_total_value_str: str) -> dict:
    """Celery background task to calculate an investment portfolio projection.

    This task is designed to be run asynchronously by a Celery worker. It takes
    portfolio details and projection parameters (as strings, for JSON compatibility
    when dispatching), performs the calculation using `calculate_projection` service,
    and returns the results.

    Args:
        self (celery.Task): The Celery task instance itself. Allows access to task
                            metadata (e.g., task ID via `self.request.id`) and methods
                            for updating task state (e.g., `self.update_state()`).
        portfolio_id (int): The ID of the portfolio for which the projection is run.
        start_date_str (str): The start date for the projection, in 'YYYY-MM-DD' string format.
        end_date_str (str): The end date for the projection, in 'YYYY-MM-DD' string format.
        initial_total_value_str (str): The initial total value of the portfolio, as a string
                                       that can be converted to a Decimal.

    Returns:
        dict: A dictionary containing:
              - "status" (str): "SUCCESS" if calculation is successful.
              - "data" (dict): The projection data, where keys are ISO formatted dates
                               and values are string representations of the portfolio value.
              - "message" (str): A success message.
              If an exception occurs, Celery automatically handles it, marking the task
              as FAILED, and the exception itself (or its string representation) becomes
              the task's result. This function re-raises exceptions to leverage that behavior.

    Raises:
        InvalidOperation: If `initial_total_value_str` cannot be converted to Decimal.
        ValueError: If `start_date_str` or `end_date_str` are not valid date formats.
        Exception: Any other unhandled exception during task execution will be caught
                   and re-raised, causing Celery to mark the task as FAILED.
    """
    task_id = self.request.id # Get the unique ID of this Celery task instance.
    # Use Flask's current_app.logger for logging within Celery tasks.
    # This requires the Celery app to be configured to work with the Flask app context.
    current_app.logger.info(f"Celery Worker: Task '{task_id}' initiated for PortfolioID '{portfolio_id}'.")
    current_app.logger.debug(
        f"Task '{task_id}': Received params: start_date='{start_date_str}', end_date='{end_date_str}', initial_value='{initial_total_value_str}'."
    )

    try:
        # Convert string inputs (passed from web server, often via JSON) to their appropriate types.
        start_date = datetime.datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.datetime.strptime(end_date_str, '%Y-%m-%d').date()
        initial_total_value = Decimal(initial_total_value_str)
        current_app.logger.debug(f"Task '{task_id}': Parameters parsed successfully.")

        # Call the main projection calculation service.
        # `draft_changes_input` is not typically used for standard background tasks,
        # as these usually operate on saved data. It defaults to None in `calculate_projection`.
        projection_data_tuples = calculate_projection(
            portfolio_id=portfolio_id,
            start_date=start_date,
            end_date=end_date,
            initial_total_value=initial_total_value
        )
        current_app.logger.debug(f"Task '{task_id}': `calculate_projection` service call completed.")
        
        # Format the projection data (list of (date, Decimal value) tuples)
        # into a JSON-serializable dictionary (date strings as keys, value strings as values).
        # This structure might be chosen for easier consumption by some frontend charting libraries.
        formatted_projection_results = {
            item_date.isoformat(): str(item_value) # Convert date to ISO string, Decimal to string
            for item_date, item_value in projection_data_tuples
        }
        
        current_app.logger.info(f"Celery Worker: Task '{task_id}' for PortfolioID '{portfolio_id}' COMPLETED successfully.")
        # Return a dictionary that will be stored as the Celery task's result.
        return {
            "status": "SUCCESS", 
            "data": formatted_projection_results, 
            "message": "Projection calculated successfully."
        }
    
    except InvalidOperation as e_decimal: # Error converting string to Decimal
        current_app.logger.error(
            f"Celery Worker: Task '{task_id}' (PortfolioID '{portfolio_id}') - InvalidOperation (Decimal conversion): {e_decimal}", 
            exc_info=True # Log full traceback
        )
        # Re-raise the exception. Celery will mark the task as FAILED and store this exception info.
        raise 
    
    except ValueError as e_value: # Error converting string to date (strptime) or other value errors
        current_app.logger.error(
            f"Celery Worker: Task '{task_id}' (PortfolioID '{portfolio_id}') - ValueError (likely date format): {e_value}", 
            exc_info=True
        )
        raise # Re-raise
        
    except Exception as e_general: # Catch any other unexpected exceptions
        current_app.logger.error(
            f"Celery Worker: Task '{task_id}' (PortfolioID '{portfolio_id}') - Unhandled error: {e_general}", 
            exc_info=True
        )
        # Re-raise to ensure Celery marks the task as FAILED.
        raise
    