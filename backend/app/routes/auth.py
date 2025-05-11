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

# Define the blueprint: 'auth', prefix: /api/v1/auth
# Following API spec (prefix /api/v1/)
auth_bp = Blueprint('auth', __name__, url_prefix='/api/v1/auth')

# --- Password Validation Helper ---
MIN_PASSWORD_LENGTH = 8

def is_password_complex(password):
    """Checks if the password meets complexity requirements."""
    if len(password) < MIN_PASSWORD_LENGTH:
        return False, f"Password must be at least {MIN_PASSWORD_LENGTH} characters long."
    # Removed specific character type checks (uppercase, lowercase, digit, special character)
    # Relying on length and pwned password check as primary measures.
    # The NIST guidelines suggest moving away from strict composition rules when
    # other measures like length and breached password checks are implemented.
    # If desired, some minimal complexity (e.g., not all same character) could be added,
    # but the focus is shifted.
    return True, ""

def is_password_pwned(password):
    """Checks if the password appears in the Pwned Passwords database using k-anonymity."""
    try:
        # 1. Hash the password using SHA-1
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
@limiter.limit("10/minute") # Apply rate limit
@handle_api_errors(schema=UserRegistrationSchema)
def register(validated_data):
    """Registers a new user."""
    username = validated_data.username
    email = validated_data.email
    password = validated_data.password

    # Check if user already exists (optional, DB constraint handles it too)
    if User.query.filter((User.username == username) | (User.email == email)).first():
        #  abort(409, description="Username or email already exists.")
        raise ConflictError(message="Username or email already exists.")

    # new_user = User(username=username, email=email, password_hash=hashed_password) # Old way
    new_user = User(username=username, email=email) # Create user without password hash first
    new_user.set_password(password) # Set password using bcrypt via model's method

    try:
        db.session.add(new_user)
        db.session.commit()
    except IntegrityError as ie:
        # This is the expected error for duplicate username/email if the initial check missed a race condition
        db.session.rollback()
        current_app.logger.warning(f"Database integrity error during registration for username '{username}' / email '{email}': {ie}") # Log as warning
        # abort(409, description="Username or email already exists (database constraint). Please try again.")
        raise ConflictError(message="Username or email already exists (database constraint). Please try again.")
    # Rely on global 500 handler for other unexpected errors

    # Return the created user data (excluding password) using the schema
    return jsonify(UserSchema.from_orm(new_user).model_dump(exclude={'password_hash'})), 201

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("10/minute") # Apply rate limit
def login():
    data = request.get_json()
    # Accept either email or username as identifier
    identifier = data.get('email') or data.get('username')
    password = data.get('password')
    if not identifier or not password:
        # Log missing credentials attempt
        current_app.logger.warning(f"Login attempt failed: Missing identifier or password. Source IP: {request.remote_addr}")
        # return jsonify({"message": "Missing username/email or password"}), 400
        raise BadRequestError("Missing username/email or password")
    # Search for user by email or username
    user = User.query.filter(
        or_(User.email == identifier, User.username == identifier)
    ).first()

    if user and user.check_password(password):
        # Log successful login
        current_app.logger.info(f"Login successful: UserID='{user.id}', Identifier='{identifier}'. Source IP: {request.remote_addr}")
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        # Prepare the JSON response without the refresh token
        response_body = {
            "message": "Login successful.",
            "access_token": access_token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            }
        }
        # Create the response object
        response = jsonify(response_body)
        # Set the refresh token in an HttpOnly cookie
        set_refresh_cookies(response, refresh_token)
        return response, 200 # Return the response object with the cookie
    else:
        # Log failed login
        current_app.logger.warning(f"Login failed: Invalid credentials for identifier '{identifier}'. Source IP: {request.remote_addr}")
        # return jsonify({"message": "Invalid email or password"}), 401
        raise ApplicationException("Invalid email or password", status_code=401, logging_level="warning")

@auth_bp.route('/logout', methods=['POST'])
@jwt_required() # Protect this route
def logout():
    # JWT logout is primarily handled client-side by discarding the token.
    # Server-side blocklisting can be added for more robust security if needed.
    # TODO: Add logic to unset refresh cookie upon logout using unset_jwt_cookies
    response = jsonify({"message": "Logout successful (token needs to be discarded client-side)"})
    unset_jwt_cookies(response)
    return response, 200

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True) # This decorator now automatically checks the cookie and handles CSRF
def refresh():
    """Refresh access token using a valid refresh token (sent via HttpOnly cookie)."""
    current_user_id = get_jwt_identity()
    new_access_token = create_access_token(identity=current_user_id)
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