"""
Custom exception classes for the application.

This module defines a base `ApplicationException` class and several specific
exception types that inherit from it. These custom exceptions allow for more
granular error handling and consistent error responses in the API.

Each exception can carry a message, a status code, an optional payload
(for structured error data), and a logging level to indicate its severity
when logged.
"""

class ApplicationException(Exception):
    """Base class for custom application-specific exceptions.

    Provides a consistent structure for handling errors across the application,
    including an HTTP status code, a user-friendly message, an optional payload
    for additional error details, and a logging level.

    Attributes:
        status_code (int): The HTTP status code to be returned to the client.
                           Defaults to 500 (Internal Server Error).
        message (str): A human-readable message describing the error.
        payload (Optional[dict]): A dictionary containing additional structured
                                  information about the error.
        logging_level (str): The suggested logging level (e.g., "info", "warning",
                             "error", "exception") when this exception is caught
                             and logged. "exception" implies logging with a stack trace.
    """
    status_code: int = 500
    message: str = "An unexpected error occurred."

    def __init__(self, message: str = None, status_code: int = None, 
                 payload: dict = None, logging_level: str = "error"):
        """Initializes the ApplicationException.

        Args:
            message: Overrides the default message for this exception type.
            status_code: Overrides the default HTTP status code.
            payload: Additional structured data about the error.
            logging_level: Suggested logging level for this error instance.
        """
        super().__init__(message or self.message) # Pass message to base Exception
        if message is not None:
            self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload
        self.logging_level = logging_level 

    def to_dict(self) -> dict:
        """Serializes the exception information to a dictionary.

        This is useful for constructing JSON error responses. Includes the
        message and any additional payload data.

        Returns:
            A dictionary representation of the error.
        """
        rv = dict(self.payload or {}) # Start with payload if it exists
        rv['message'] = self.message
        return rv

class NotFoundError(ApplicationException):
    """Raised when a requested resource could not be found.
    
    Corresponds to an HTTP 404 status.
    Logging level defaults to "warning" as it might indicate a client error
    (e.g., requesting a non-existent ID) rather than a critical server fault.
    """
    status_code = 404
    message = "The requested resource was not found."
    logging_level = "warning" # Often a client error, less severe than server error.

class ForbiddenError(ApplicationException):
    """Raised when a user attempts an action they are not permitted to perform.
    
    Corresponds to an HTTP 403 status.
    Logging level defaults to "warning" as it's an authorization failure.
    """
    status_code = 403
    message = "You do not have the necessary permissions to perform this action."
    logging_level = "warning"

class BadRequestError(ApplicationException):
    """Raised for malformed requests or invalid input data from the client.
    
    This can be due to issues like missing required fields (if not caught by schema
    validation earlier) or semantically incorrect data that passes schema validation
    but fails business logic checks. Corresponds to an HTTP 400 status.
    Logging level defaults to "warning".
    """
    status_code = 400
    message = "The request was malformed or contained invalid parameters."
    logging_level = "warning"

class ConflictError(ApplicationException):
    """Raised when an attempt to create or modify a resource fails due to a conflict
    with the current state of the resource (e.g., unique constraint violation).
    
    Corresponds to an HTTP 409 status.
    Logging level defaults to "warning".
    """
    status_code = 409
    message = "A conflict occurred with the current state of the resource."
    logging_level = "warning"

class UnprocessableEntityError(ApplicationException):
    """Raised when a request is syntactically correct (well-formed) but contains
    semantic errors, making it impossible for the server to process the instructions.
    
    This is often used when Pydantic validation passes basic structure but business
    rules are violated by the combination of data. Corresponds to an HTTP 422 status.
    Logging level defaults to "warning".
    """
    status_code = 422
    message = "The request was well-formed but contained semantic errors."
    logging_level = "warning"

# --- Application-Specific Subclasses of Common Errors ---
# These provide more context-specific error messages while inheriting status codes.

class PortfolioNotFoundError(NotFoundError):
    """Specific "Not Found" error for portfolios."""
    message = "The specified portfolio was not found."

class AssetNotFoundError(NotFoundError):
    """Specific "Not Found" error for assets."""
    message = "The specified asset was not found."

class PlannedChangeNotFoundError(NotFoundError):
    """Specific "Not Found" error for planned future changes."""
    message = "The specified planned change was not found."

class ChildResourceNotFoundError(NotFoundError):
    """Generic "Not Found" error for a child resource within a parent.
    
    Allows for dynamic message construction based on resource names and IDs.
    """
    def __init__(self, child_model_name: str = "Resource", child_id = None, 
                 parent_model_name: str = "parent resource", parent_id = None, 
                 message: str = None):
        """
        Args:
            child_model_name: Name of the child resource type (e.g., "Asset").
            child_id: ID of the child resource, if applicable.
            parent_model_name: Name of the parent resource type (e.g., "Portfolio").
            parent_id: ID of the parent resource, if applicable.
            message: A custom message to override the default constructed one.
        """
        if message is None:
            # Construct a detailed message if a custom one isn't provided.
            _constructed_message = f"{child_model_name}"
            if child_id is not None: # Explicitly check for None, as ID could be 0.
                _constructed_message += f" with ID '{child_id}'"
            _constructed_message += " not found"
            if parent_model_name and parent_id is not None:
                _constructed_message += f" within {parent_model_name} ID '{parent_id}'"
            _constructed_message += "."
        else:
            _constructed_message = message
        # Call the parent's __init__ (NotFoundError -> ApplicationException)
        super().__init__(message=_constructed_message)

class AccessDeniedError(ForbiddenError):
    """More specific "Forbidden" error indicating denial of access to a resource.
    
    Often used when a user is authenticated but not authorized for a specific resource.
    """
    message = "Access to the requested resource is denied."

# --- External Service and System Errors ---

class ExternalServiceError(ApplicationException):
    """Raised when an error occurs while communicating with an external service or API.
    
    Corresponds to HTTP 502 (Bad Gateway) or 503 (Service Unavailable) typically.
    Logging level defaults to "error" as it might indicate a problem with dependencies.
    """
    status_code = 502 
    message = "An error occurred while communicating with an external service."
    logging_level = "error" # Suggests a more significant issue than client errors.

class DatabaseError(ApplicationException):
    """Raised for general database-related errors not specifically caught by ORM exceptions
    or when a more generic database error needs to be signaled.
    
    Corresponds to an HTTP 500 status.
    Logging level is "exception" to ensure full stack trace is logged for diagnosis.
    """
    status_code = 500
    message = "A database error occurred. Please try again later."
    logging_level = "exception" # Ensures full stack trace is logged.

# Example of another potential custom exception (not currently used elsewhere but illustrative):
# class AuthenticationError(ApplicationException):
#     """Raised when authentication fails (e.g., invalid credentials, bad token)."""
#     status_code = 401 # Unauthorized
#     message = "Authentication failed. Please check your credentials."
#     logging_level = "warning" 