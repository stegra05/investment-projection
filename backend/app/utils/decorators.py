import logging
import functools
from flask import request, jsonify, abort
from pydantic import ValidationError
from app import db
from decimal import InvalidOperation

def handle_api_errors(schema=None):
    """
    Decorator to handle common API request processing and error handling.

    - Parses JSON body.
    - Validates input using a provided Pydantic schema (if any).
    - Executes the decorated function.
    - Handles common exceptions (ValidationError, InvalidOperation, general Exception).
    - Commits DB session on success, rolls back on error.
    - Returns JSON response or aborts with appropriate error code.
    """
    def decorator(f):
        @functools.wraps(f)
        def wrapper(*args, **kwargs):
            if request.method in ['POST', 'PUT', 'PATCH']:
                # Ensure content type is application/json, otherwise Flask handles it (usually 415)
                if not request.is_json:
                     abort(415, description="Unsupported Media Type: Request must be application/json.")

                json_data = request.get_json()
                if json_data is None: # Check for null body or empty parse
                    abort(400, description="Request body cannot be empty or null.")

                # Validate input using Pydantic schema if provided
                if schema:
                    try:
                        validated_data = schema.model_validate(json_data) # Use model_validate for Pydantic v2+
                        kwargs['validated_data'] = validated_data
                    except ValidationError as e:
                        # Convert Pydantic errors to a more readable format if needed
                        error_details = e.errors()
                        # Log the validation failure
                        logging.warning(f"Validation Error on endpoint '{request.path}': {error_details}. Source IP: {request.remote_addr}")
                        # Return JSON directly instead of aborting
                        # abort(400, description=error_details)
                        return jsonify(validation_error=error_details), 400
                    except Exception as e: # Catch potential unexpected errors during validation
                         db.session.rollback()
                         import traceback
                         traceback.print_exc()
                         abort(500, description=f"Error during data validation: {e}")
                else:
                    # Pass raw json_data if no schema is specified
                    kwargs['json_data'] = json_data

            try:
                # Route function signature determines if it receives validated_data or json_data
                result, status_code = f(*args, **kwargs)
                db.session.commit()
                return result, status_code
            except (InvalidOperation, ValueError) as e: # Catch potential numeric conversion errors
                db.session.rollback()
                # Prefer Pydantic for validation, but catch direct DB errors
                abort(400, description=f"Invalid numeric value provided: {e}")
            except Exception as e:
                db.session.rollback()
                # Log the full exception for debugging
                import traceback
                traceback.print_exc() # Consider using current_app.logger in production
                abort(500, description=f"An unexpected error occurred: {e}")
        return wrapper
    return decorator 