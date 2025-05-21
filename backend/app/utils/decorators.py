"""
Custom decorators for Flask route handlers.

This module provides decorators to simplify common tasks in API development,
such as request data validation, JSON parsing, error handling, and
database session management (commit/rollback).
"""
import logging # Standard Python logging
import functools # For creating well-behaved decorators
from flask import request, jsonify, abort, current_app # Flask utilities
from pydantic import ValidationError # For Pydantic schema validation errors
from app import db # SQLAlchemy database session from the main app
from decimal import InvalidOperation # For handling errors with Decimal conversions

# It's good practice to get a logger instance for the current module.
# However, current_app.logger is often used within Flask request contexts.
# For module-level logging outside request context, `logging.getLogger(__name__)` is standard.
# Since this decorator operates within a request context, `current_app.logger` is appropriate.

def handle_api_errors(schema=None):
    """A decorator factory for Flask route handlers to manage API request lifecycles.

    This decorator automates several common tasks for API endpoints:
    1.  **JSON Parsing**: For POST, PUT, PATCH methods, it checks if the request
        content type is 'application/json' and parses the JSON body.
        - Aborts with 415 if content type is not JSON.
        - Aborts with 400 if JSON body is missing or null.
    2.  **Data Validation**: If a Pydantic `schema` is provided, it validates
        the parsed JSON data against this schema.
        - If validation fails, it logs the error and returns a 400 JSON response
          with detailed validation errors.
        - The validated data (as a Pydantic model instance) is passed to the
          decorated route function via `kwargs['validated_data']`.
        - If no schema is provided, the raw parsed JSON data is passed via
          `kwargs['json_data']`.
    3.  **Route Execution**: Calls the decorated route function.
    4.  **Database Session Management**:
        - If the route function executes successfully and returns, it commits
          the current SQLAlchemy database session (`db.session.commit()`).
        - If any specified or general exception occurs during route execution
          or data processing, it rolls back the database session
          (`db.session.rollback()`).
    5.  **Error Handling**:
        - Catches `pydantic.ValidationError` for schema validation issues.
        - Catches `decimal.InvalidOperation` and `ValueError` which might occur
          during data processing (e.g., converting strings to numbers).
        - Catches any other general `Exception` for unexpected errors.
        - Logs errors appropriately using `current_app.logger`.
        - Returns appropriate JSON error responses or aborts with HTTP error codes.

    Args:
        schema (Optional[pydantic.BaseModel]): A Pydantic schema class to validate
                                               the request JSON body against. If None,
                                               no schema validation is performed.

    Returns:
        Callable: The actual decorator that wraps the route function.
    """
    def decorator(f):
        @functools.wraps(f) # Preserves metadata of the decorated function (name, docstring, etc.)
        def wrapper(*args, **kwargs):
            # Process request body for methods that typically carry a payload.
            if request.method in ['POST', 'PUT', 'PATCH']:
                # Check for 'application/json' content type.
                # Flask's `request.is_json` checks the Content-Type header.
                if not request.is_json:
                     current_app.logger.warning(
                         f"Unsupported Media Type for {request.method} {request.path}. "
                         f"Content-Type: '{request.headers.get('Content-Type')}'. IP: {request.remote_addr}"
                     )
                     # Abort with 415 for unsupported media type.
                     abort(415, description="Unsupported Media Type: Request must be application/json.")

                json_data = request.get_json() # Parses JSON from request body.
                # Check if JSON parsing yielded None (e.g., empty body, or malformed JSON that wasn't caught by Flask's default).
                if json_data is None: 
                    current_app.logger.warning(
                        f"Empty or null JSON body received for {request.method} {request.path}. IP: {request.remote_addr}"
                    )
                    abort(400, description="Request body cannot be empty or null. Valid JSON is required.")

                # If a Pydantic schema is provided, validate the JSON data.
                if schema:
                    try:
                        # `schema.model_validate()` is Pydantic v2+ method. For v1, it was `schema.parse_obj()`.
                        validated_data = schema.model_validate(json_data)
                        # Inject validated data into the route function's keyword arguments.
                        kwargs['validated_data'] = validated_data
                    except ValidationError as e:
                        # Pydantic validation failed.
                        error_details = e.errors() # Get structured error details from Pydantic.
                        current_app.logger.warning(
                            f"Pydantic Validation Error for {request.method} {request.path}: {error_details}. "
                            f"Source IP: {request.remote_addr}. Input data: {json_data}"
                        )
                        # Return a 400 response with the validation errors.
                        return jsonify(message="Input validation failed.", errors=error_details), 400
                    except Exception as e: # Catch any other unexpected error during validation phase.
                         db.session.rollback() # Rollback DB session just in case.
                         current_app.logger.exception(
                             f"Unexpected error during Pydantic data validation for {request.method} {request.path}. Error: {e}"
                         )
                         # Abort with 500 for unexpected server-side validation issues.
                         abort(500, description=f"An unexpected error occurred during data validation: {str(e)}")
                else:
                    # No schema provided; pass the raw (but parsed) JSON data to the route.
                    kwargs['json_data'] = json_data

            try:
                # Execute the actual route handler function.
                # The route handler is expected to return a tuple: (response_body, status_code).
                response_body, status_code = f(*args, **kwargs)
                # If execution is successful, commit the database session.
                db.session.commit()
                current_app.logger.debug(f"Successfully processed {request.method} {request.path}. DB session committed.")
                return response_body, status_code
            except (InvalidOperation, ValueError) as e: 
                # Catch common errors related to data type conversion (e.g., Decimal, int).
                # These might occur if data isn't validated by Pydantic or if internal logic has issues.
                db.session.rollback() # Rollback DB session on error.
                current_app.logger.warning(
                    f"Data conversion error (InvalidOperation/ValueError) for {request.method} {request.path}: {e}. "
                    f"Source IP: {request.remote_addr}."
                )
                # Abort with 400, indicating bad request data.
                abort(400, description=f"Invalid data format or value provided: {str(e)}")
            except Exception as e: # Catch any other unhandled exceptions from the route handler.
                db.session.rollback() # Rollback DB session.
                # Log the full exception details for server-side debugging.
                current_app.logger.exception(
                    f"Unhandled exception in API handler for {request.method} {request.path}. Error: {e}"
                )
                # Abort with 500 for generic internal server error.
                # Avoid exposing detailed error messages from `e` directly to the client in production.
                abort(500, description="An unexpected internal server error occurred.")
        return wrapper
    return decorator 