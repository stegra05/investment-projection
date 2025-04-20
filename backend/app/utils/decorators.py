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
                json_data = request.get_json()
                if not json_data:
                    abort(400, description="Request body cannot be empty.")
                kwargs['json_data'] = json_data # Pass data to decorated function

                # Validate input using Pydantic schema if provided
                if schema:
                    try:
                        validated_data = schema.parse_obj(json_data)
                        kwargs['validated_data'] = validated_data # Pass validated data
                    except ValidationError as e:
                        abort(400, description=e.errors())

            try:
                # Execute the actual route logic
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