class ApplicationException(Exception):
    """Base class for custom application exceptions."""
    status_code = 500
    message = "An unexpected error occurred."

    def __init__(self, message=None, status_code=None, payload=None, logging_level="error"):
        super().__init__(message)
        if message is not None:
            self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload
        self.logging_level = logging_level # e.g., "info", "warning", "error", "exception"

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        return rv

class NotFoundError(ApplicationException):
    """Raised when a resource is not found."""
    status_code = 404
    message = "Resource not found."
    logging_level = "warning"

class ForbiddenError(ApplicationException):
    """Raised when an action is forbidden for the current user."""
    status_code = 403
    message = "You do not have permission to perform this action."
    logging_level = "warning"

class BadRequestError(ApplicationException):
    """Raised for bad requests (e.g., validation errors not caught by Pydantic)."""
    status_code = 400
    message = "Bad request."
    logging_level = "warning"

class ConflictError(ApplicationException):
    """Raised when an attempt to create a resource fails due to a conflict (e.g., already exists)."""
    status_code = 409
    message = "Resource conflict."
    logging_level = "warning"

class UnprocessableEntityError(ApplicationException):
    """Raised when a request is well-formed but cannot be processed (e.g., semantic errors)."""
    status_code = 422
    message = "Unprocessable entity."
    logging_level = "warning"

# Specific examples related to the user's observation
class PortfolioNotFoundError(NotFoundError):
    message = "Portfolio not found."

class AssetNotFoundError(NotFoundError):
    message = "Asset not found."

class PlannedChangeNotFoundError(NotFoundError):
    message = "Planned change not found."

class ChildResourceNotFoundError(NotFoundError):
    def __init__(self, child_model_name="Resource", child_id=None, parent_model_name="parent resource", parent_id=None, message=None):
        if message is None:
            _message = f"{child_model_name}"
            if child_id is not None: # Check for None explicitly
                _message += f" with id {child_id}"
            _message += " not found"
            if parent_model_name and parent_id is not None: # Check for None explicitly
                _message += f" within {parent_model_name} {parent_id}"
            _message += "."
        else:
            _message = message
        super().__init__(message=_message)

class AccessDeniedError(ForbiddenError): # More specific than generic ForbiddenError
    message = "Access to the requested resource is denied."

class ExternalServiceError(ApplicationException):
    """Raised when an external service call fails."""
    status_code = 502  # Bad Gateway or 503 Service Unavailable might also be appropriate
    message = "An error occurred while communicating with an external service."
    logging_level = "error"

class DatabaseError(ApplicationException):
    """Raised for database-related errors not covered by ORM exceptions."""
    status_code = 500
    message = "A database error occurred."
    logging_level = "exception" # Log with full traceback

# Example:
# class AuthenticationError(ApplicationException):
#     status_code = 401
#     message = "Authentication failed."
#     logging_level = "warning" 