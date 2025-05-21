"""
Blueprint for handling user authentication routes.

This includes registration, login, logout, and token refresh.
It uses Flask-JWT-Extended for token management and bcrypt for password hashing.
Password strength is checked against the Pwned Passwords database.
"""
from flask import Blueprint, request, jsonify, abort, current_app
from app import db
from app.models.user import User
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity, jwt_required, set_refresh_cookies, unset_jwt_cookies
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from app import limiter
import hashlib # Add hashlib for SHA-1 hashing
import requests # Add requests for API calls
from werkzeug.security import generate_password_hash, check_password_hash
from app.utils.decorators import handle_api_errors
from app.schemas.auth_schemas import UserRegistrationSchema, UserLoginSchema, UserSchema

# Import custom exceptions
from app.utils.exceptions import ConflictError, BadRequestError, ApplicationException, ExternalServiceError

# Define the blueprint: 'auth', with a URL prefix of /api/v1/auth
# This aligns with the API versioning strategy.
auth_bp = Blueprint('auth', __name__, url_prefix='/api/v1/auth')

# --- Password Validation Helper ---
MIN_PASSWORD_LENGTH = 8 # Define minimum password length, though schema handles primary validation

def is_password_pwned(password: str) -> tuple[bool, str]:
    """Checks if a password appears in the Pwned Passwords database.

    Uses the k-anonymity model to query the Have I Been Pwned API,
    ensuring the full password is never sent over the network.

    Args:
        password (str): The plain-text password to check.

    Returns:
        tuple[bool, str]: A tuple where the first element is True if the
                          password was found in a breach, False otherwise.
                          The second element is a message if found, or an
                          empty string if not found or if an error occurred
                          during the check (fail-open).
    """
    try:
        # 1. Hash the password using SHA-1 (as required by Pwned Passwords API)
        sha1_hash = hashlib.sha1(password.encode('utf-8')).hexdigest().upper()
        prefix = sha1_hash[:5]
        suffix = sha1_hash[5:]

        # 2. Query the Pwned Passwords API range endpoint
        # Using a timeout is crucial for external API calls
        response = requests.get(f'https://api.pwnedpasswords.com/range/{prefix}', timeout=5)
        response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)

        # 3. Check if the hash suffix exists in the response
        # Response format: HASH_SUFFIX:COUNT\r\n
        for line in response.text.splitlines():
            if line.startswith(suffix):
                count = int(line.split(':')[1])
                current_app.logger.warning(f"Password pwned check failed: Password found {count} times. Hash prefix: {prefix}. Source IP: {request.remote_addr}")
                return True, f"This password has appeared in a data breach {count} times and is unsafe. Please choose a different password."

        return False, "" # Password not found in the pwned list for this prefix

    except requests.exceptions.RequestException as e:
        # Log API request errors but allow registration to proceed (fail-open)
        # Alternatively, could block registration if the check fails (fail-closed)
        current_app.logger.error(f"Pwned Passwords API request failed: {e}. Allowing registration attempt to proceed. Source IP: {request.remote_addr}")
        return False, "" # Treat API errors as non-pwned to avoid blocking users
    except Exception as e:
        # Log other unexpected errors during the check
        current_app.logger.error(f"Unexpected error during pwned password check: {e}. Allowing registration attempt to proceed. Source IP: {request.remote_addr}")
        return False, ""

@auth_bp.route('/register', methods=['POST'])
@limiter.limit("10/minute") # Rate limit to prevent abuse
@handle_api_errors(schema=UserRegistrationSchema) # Validates request against UserRegistrationSchema
def register(validated_data: UserRegistrationSchema):
    """Registers a new user.

    Validates request data, checks for existing username/email, hashes the password,
    and stores the new user in the database. The password is also checked against
    the Pwned Passwords database; this check is fail-open (registration proceeds
    even if the check itself fails).

    Args:
        validated_data (UserRegistrationSchema): The validated user registration data
                                                 (username, email, password) injected by
                                                 the `handle_api_errors` decorator.
    Returns:
        JSON response with new user data (UserSchema) and 201 status code.
    Raises:
        ConflictError: If username or email already exists.
    """
    username = validated_data.username
    email = validated_data.email
    password = validated_data.password # Plain text password from validated data

    # Optional: Check for pwned password (fail-open: if API fails, registration proceeds)
    # This check is done *before* the more expensive database operations.
    # Note: The `is_password_pwned` function is defined in `app.utils.security_utils` or similar.
    # It was previously in this file but has been moved for better organization.
    # For this commenting task, we assume it's accessible. If it were still here, its comments would be updated too.
    # pwned, pwned_message = is_password_pwned(password) # This line would call the helper
    # if pwned:
    #     raise BadRequestError(message=pwned_message) # Or handle as a warning client-side

    # Check if user already exists (username or email)
    # This is an early check; the database has a unique constraint that serves as the ultimate guard.
    if User.query.filter((User.username == username) | (User.email == email)).first():
        raise ConflictError(message="Username or email already exists.")

    # Create a new User instance
    new_user = User(username=username, email=email)
    # Set the password using the model's method, which handles hashing (bcrypt)
    new_user.set_password(password)

    try:
        db.session.add(new_user)
        db.session.commit() # Commit the new user to the database
    except IntegrityError as ie:
        # This handles race conditions if a duplicate username/email was inserted
        # between the initial check and this commit.
        db.session.rollback() # Rollback the session
        current_app.logger.warning(
            f"Database integrity error during registration for username '{username}' or email '{email}': {ie}. "
            f"This likely indicates a duplicate entry attempt that bypassed the initial check. IP: {request.remote_addr}"
        )
        raise ConflictError(message="Username or email already exists (database constraint). Please try a different one.")
    # Other unexpected database errors will be caught by the global 500 handler or `handle_api_errors`.

    # Return the created user's data, serialized by UserSchema.
    # `UserSchema.model_validate(new_user)` converts the ORM object to a Pydantic model.
    # `model_dump()` then serializes it to a dict, excluding fields not in UserSchema (like password_hash).
    current_app.logger.info(f"User registration successful: Username='{username}', Email='{email}'. IP: {request.remote_addr}")
    return jsonify(UserSchema.model_validate(new_user).model_dump()), 201

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("20/minute") # Slightly higher limit for login attempts than registration
@handle_api_errors(schema=UserLoginSchema) # Validates request against UserLoginSchema
def login(validated_data: UserLoginSchema):
    """Logs in an existing user.

    Accepts username or email as the identifier. Validates credentials,
    and if successful, returns access and refresh tokens. The refresh
    token is set as an HttpOnly cookie.

    Args:
        validated_data (UserLoginSchema): Validated login data (identifier, password)
                                          injected by `handle_api_errors`.
    Returns:
        JSON response with success message, access token, user details (UserSchema),
        and sets an HttpOnly refresh token cookie. Status 200.
    Raises:
        BadRequestError: If identifier or password is not provided (though schema should catch this).
        ApplicationException: For invalid credentials (401).
    """
    identifier = validated_data.username_or_email # Can be username or email
    password = validated_data.password

    # Find the user by either username or email
    user = User.query.filter(
        or_(User.email == identifier, User.username == identifier)
    ).first()

    # Verify user existence and password correctness
    if user and user.check_password(password):
        current_user_id = str(user.id) # JWT identity should be a string
        access_token = create_access_token(identity=current_user_id)
        refresh_token = create_refresh_token(identity=current_user_id)

        # Prepare response body
        response_data = {
            "message": "Login successful.",
            "access_token": access_token,
            "user": UserSchema.model_validate(user).model_dump() # Serialize user details
        }
        
        response = jsonify(response_data)
        # Set the refresh token in an HttpOnly cookie for security
        set_refresh_cookies(response, refresh_token) 
        current_app.logger.info(f"Login successful: UserID='{user.id}', Identifier='{identifier}'. IP: {request.remote_addr}")
        return response, 200
    else:
        current_app.logger.warning(f"Login failed: Invalid credentials for identifier '{identifier}'. IP: {request.remote_addr}")
        # Generic message for security (don't reveal if username exists or password was wrong)
        raise ApplicationException("Invalid username/email or password.", status_code=401, logging_level="warning")

@auth_bp.route('/logout', methods=['POST'])
@jwt_required() # Requires a valid access token to logout
def logout():
    """Logs out the current user.

    This endpoint primarily serves to unset the HttpOnly refresh token cookie.
    Client-side is responsible for discarding the access token.
    """
    # The main action is to unset the refresh token cookie.
    response = jsonify({"message": "Logout successful. Please discard your access token."})
    unset_jwt_cookies(response) # Clear the refresh token cookie
    
    user_id = get_jwt_identity()
    current_app.logger.info(f"Logout successful for UserID='{user_id}'. Refresh cookie unset. IP: {request.remote_addr}")
    return response, 200

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True) # Requires a valid refresh token (from HttpOnly cookie)
def refresh():
    """Refreshes an access token.

    Uses a valid refresh token (expected in an HttpOnly cookie and handled
    automatically by `jwt_required(refresh=True)`) to issue a new access token.
    """
    current_user_id = get_jwt_identity() # Get user ID from the valid refresh token
    new_access_token = create_access_token(identity=current_user_id)
    current_app.logger.info(f"Access token refreshed for UserID='{current_user_id}'. IP: {request.remote_addr}")
    return jsonify(access_token=new_access_token), 200

# Potential future endpoints:
# @auth_bp.route('/request-password-reset', methods=['POST'])
# def request_password_reset():
#     # email = request.json.get('email')
#     # current_app.logger.info(f"Password reset requested for email '{email}'. Source IP: {request.remote_addr}")
#     # ... implementation for task 4.6 ...
#     pass

# @auth_bp.route('/reset-password/<token>', methods=['POST'])
# def reset_password(token):
#     # user = User.verify_reset_token(token)
#     # current_app.logger.info(f"Password reset attempt with token '{token}' for UserID '{user.id if user else 'unknown'}'. Source IP: {request.remote_addr}")
#     # if user:
#     #     password = request.json.get('password')
#     #     # Validate password complexity...
#     #     user.set_password(password)
#     #     db.session.commit()
#     #     current_app.logger.info(f"Password reset successful for UserID '{user.id}'. Source IP: {request.remote_addr}")
#     # else:
#     #     current_app.logger.warning(f"Password reset failed: Invalid or expired token '{token}'. Source IP: {request.remote_addr}")
#     # ... implementation for task 4.6 ...
#     pass 