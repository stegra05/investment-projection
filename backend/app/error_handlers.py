"""
Centralized error handling for the Flask application.

This module defines and registers error handlers for common HTTP exceptions
(like 404, 500) and custom application-specific exceptions defined in
`app.utils.exceptions`. The goal is to provide consistent JSON-formatted
error responses for all API errors, replacing Flask's default HTML error pages.

The `register_error_handlers` function is called during application setup
to attach these handlers to the Flask app instance.
"""
from flask import jsonify, current_app # Added current_app for direct logger access if app context is available
from werkzeug.exceptions import HTTPException # Base class for Flask's HTTP errors
import json # For formatting HTTPException responses

# Import the base custom exception class from the application's utility modules.
from app.utils.exceptions import ApplicationException
# Note: `db` instance is passed to `register_error_handlers` for session rollback.

def register_error_handlers(app, db):
    """Registers custom error handlers with the Flask application.

    This function sets up handlers that will catch specified exceptions
    (both standard HTTPExceptions and custom ApplicationExceptions) and
    format the responses as JSON, suitable for an API. It also includes
    logging for errors and attempts to roll back database sessions for
    server-side errors.

    Args:
        app: The Flask application instance.
        db: The SQLAlchemy database instance (needed for session rollback).
    """

    @app.errorhandler(HTTPException) # Handles all standard Werkzeug/Flask HTTP exceptions
    def handle_http_exception(e: HTTPException):
        """Converts standard HTTPExceptions (e.g., 404, 400 from abort()) into JSON responses.
        
        This ensures that even errors raised by `abort()` are returned as JSON.
        """
        # Log the HTTP exception. Using current_app.logger is standard in Flask.
        # The severity might depend on the error code (e.g., 4xx are warnings, 5xx are errors).
        if e.code >= 500:
            app.logger.error(f"HTTPException (werkzeug): {e.code} {e.name} - {e.description}", exc_info=e if e.code >=500 else None)
        else:
            app.logger.warning(f"HTTPException (werkzeug): {e.code} {e.name} - {e.description}")
            
        # Create a JSON response from the exception's attributes.
        response = e.get_response() # Get the standard response object for the exception
        response.data = json.dumps({
            "code": e.code, # HTTP status code
            "name": e.name, # Standard name for the status code (e.g., "Not Found")
            "description": e.description, # Error description
        })
        response.content_type = "application/json" # Set content type to JSON
        return response

    # Specific handler for 404, although covered by HTTPException,
    # this allows for more specific logging or response format if needed.
    # Current implementation is simple and could be removed if generic HTTPException is sufficient.
    @app.errorhandler(404)
    def handle_404_not_found(e: HTTPException):
        """Handles 404 Not Found errors with a JSON response."""
        app.logger.warning(f"Resource Not Found (404): {request.path} - Description: {e.description}")
        return jsonify(error=e.description or "The requested resource was not found."), 404

    @app.errorhandler(500) # Specifically for Internal Server Errors
    def handle_500_internal_server_error(e: HTTPException):
        """Handles 500 Internal Server Errors, logs them, and attempts DB rollback.
        
        This catches generic `abort(500)` calls or unhandled exceptions that
        Flask escalates to a 500 error.
        """
        # `e.original_exception` might hold the actual unhandled Python exception
        # that caused the 500 error, useful for detailed logging.
        original_exception = getattr(e, "original_exception", None)
        app.logger.error(
            f"Internal Server Error (500): {e.description or 'No description provided.'}",
            exc_info=original_exception or e # Log with stack trace
        )
        try:
            # Attempt to roll back the database session to prevent leaving it in a bad state.
            # This is crucial for 500 errors that might be database-related or leave transactions pending.
            db.session.rollback()
            app.logger.info("Database session rolled back successfully due to 500 error.")
        except Exception as rollback_exc:
            # Log if the rollback itself fails, as this might indicate deeper issues.
            app.logger.error(f"CRITICAL: Error during database session rollback after 500 error: {rollback_exc}", exc_info=rollback_exc)
        
        return jsonify(error=e.description or "An internal server error occurred. Please try again later."), 500
    
    # Example handlers for other common HTTP status codes.
    # These ensure JSON responses for abort(400), abort(401), etc.
    # They could be made more specific or rely on the generic HTTPException handler.
    @app.errorhandler(400)
    def handle_400_bad_request(e: HTTPException):
        """Handles 400 Bad Request errors with a JSON response."""
        app.logger.warning(f"Bad Request (400): {request.path} - Description: {e.description}")
        return jsonify(error=e.description or "The request was malformed or invalid."), 400

    @app.errorhandler(401)
    def handle_401_unauthorized(e: HTTPException):
        """Handles 401 Unauthorized errors with a JSON response."""
        app.logger.warning(f"Unauthorized (401): {request.path} - Description: {e.description}")
        return jsonify(error=e.description or "Authentication is required and has failed or has not yet been provided."), 401

    @app.errorhandler(403)
    def handle_403_forbidden(e: HTTPException):
        """Handles 403 Forbidden errors with a JSON response."""
        app.logger.warning(f"Forbidden (403): {request.path} - Description: {e.description}")
        return jsonify(error=e.description or "You do not have permission to access this resource."), 403

    # Handler for custom application-specific exceptions (subclasses of ApplicationException).
    @app.errorhandler(ApplicationException)
    def handle_custom_application_exception(e: ApplicationException):
        """Handles custom `ApplicationException` types and their subclasses.

        This allows for consistent JSON error responses for custom exceptions,
        respecting their defined `status_code`, `message`, `payload`, and `logging_level`.
        """
        # Use the logging level defined in the exception instance.
        # Default to 'error' if the level string is not a valid logger method.
        log_method = getattr(app.logger, e.logging_level, app.logger.error)
        
        log_message_parts = [f"ApplicationException Caught: Status={e.status_code}, Msg='{e.message}'"]
        if e.payload:
            log_message_parts.append(f"Payload: {e.payload}")
        full_log_message = " - ".join(log_message_parts)
        
        # Log with stack trace for "exception" level or server-side errors (5xx).
        if e.logging_level == "exception" or (e.status_code and e.status_code >= 500):
            log_method(full_log_message, exc_info=e) # exc_info=e includes the exception details
        else:
            log_method(full_log_message)

        # If the custom exception indicates a server-side error (status code >= 500),
        # attempt to roll back the database session.
        if e.status_code >= 500:
            try:
                db.session.rollback()
                app.logger.info(f"Database session rolled back due to ApplicationException (Status: {e.status_code}, Message: '{e.message}').")
            except Exception as rollback_exc:
                app.logger.error(
                    f"CRITICAL: Error during database rollback after ApplicationException "
                    f"(Status: {e.status_code}, Message: '{e.message}'): {rollback_exc}", 
                    exc_info=rollback_exc
                )
        
        # Use the exception's `to_dict()` method to get a JSON-serializable payload.
        response_data_dict = e.to_dict()
        return jsonify(response_data_dict), e.status_code