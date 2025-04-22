from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity, jwt_required, set_refresh_cookies
from sqlalchemy import or_
# Import the limiter instance from the app factory
from app import limiter
import re # Add re import for regex validation
import logging
import hashlib # Add hashlib for SHA-1 hashing
import requests # Add requests for API calls

# Define the blueprint: 'auth', prefix: /api/v1/auth
# Following API spec (prefix /api/v1/)
auth_bp = Blueprint('auth', __name__, url_prefix='/api/v1/auth')

# --- Password Validation Helper ---
MIN_PASSWORD_LENGTH = 8

def is_password_complex(password):
    """Checks if the password meets complexity requirements."""
    if len(password) < MIN_PASSWORD_LENGTH:
        return False, f"Password must be at least {MIN_PASSWORD_LENGTH} characters long."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter."
    if not re.search(r"[0-9]", password):
        return False, "Password must contain at least one digit."
    # Use a simpler, more common regex for special characters
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character."
    # TODO: Implement breached password check (e.g., using Have I Been Pwned API)
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
                logging.warning(f"Password pwned check failed: Password found {count} times. Hash prefix: {prefix}. Source IP: {request.remote_addr}")
                return True, f"This password has appeared in a data breach {count} times and is unsafe. Please choose a different password."

        return False, "" # Password not found in the pwned list for this prefix

    except requests.exceptions.RequestException as e:
        # Log API request errors but allow registration to proceed (fail-open)
        # Alternatively, could block registration if the check fails (fail-closed)
        logging.error(f"Pwned Passwords API request failed: {e}. Allowing registration attempt to proceed. Source IP: {request.remote_addr}")
        return False, "" # Treat API errors as non-pwned to avoid blocking users
    except Exception as e:
        # Log other unexpected errors during the check
        logging.error(f"Unexpected error during pwned password check: {e}. Allowing registration attempt to proceed. Source IP: {request.remote_addr}")
        return False, ""

@auth_bp.route('/register', methods=['POST'])
@limiter.limit("10/minute") # Apply rate limit
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"message": "Missing username, email, or password"}), 400

    # --- Add Password Validation ---
    is_complex, message = is_password_complex(password)
    if not is_complex:
        # Log password validation failure
        logging.warning(f"Registration failed for username '{username}' due to weak password: {message}. Source IP: {request.remote_addr}")
        return jsonify({"message": message}), 400

    # --- Add Pwned Password Check ---
    is_pwned, pwned_message = is_password_pwned(password)
    if is_pwned:
        # Logging is handled within is_password_pwned
        return jsonify({"message": pwned_message}), 400
    # --- End Pwned Password Check ---

    existing_user = User.query.filter(
        or_(User.username == username, User.email == email)
    ).first()
    if existing_user:
        # Log registration conflict
        logging.warning(f"Registration failed: Username '{username}' or email '{email}' already exists. Source IP: {request.remote_addr}")
        return jsonify({"message": "Username or email already exists"}), 409

    new_user = User(username=username, email=email)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    # Log successful registration
    logging.info(f"User registered successfully: Username='{username}', Email='{email}', UserID='{new_user.id}'. Source IP: {request.remote_addr}")

    return jsonify({"message": "User registered successfully"}), 201

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("10/minute") # Apply rate limit
def login():
    data = request.get_json()
    # Accept either email or username as identifier
    identifier = data.get('email') or data.get('username')
    password = data.get('password')
    if not identifier or not password:
        # Log missing credentials attempt
        logging.warning(f"Login attempt failed: Missing identifier or password. Source IP: {request.remote_addr}")
        return jsonify({"message": "Missing username/email or password"}), 400
    # Search for user by email or username
    user = User.query.filter(
        or_(User.email == identifier, User.username == identifier)
    ).first()

    if user and user.check_password(password):
        # Log successful login
        logging.info(f"Login successful: UserID='{user.id}', Identifier='{identifier}'. Source IP: {request.remote_addr}")
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
        logging.warning(f"Login failed: Invalid credentials for identifier '{identifier}'. Source IP: {request.remote_addr}")
        return jsonify({"message": "Invalid email or password"}), 401

@auth_bp.route('/logout', methods=['POST'])
@jwt_required() # Protect this route
def logout():
    # JWT logout is primarily handled client-side by discarding the token.
    # Server-side blocklisting can be added for more robust security if needed.
    # TODO: Add logic to unset refresh cookie upon logout using unset_jwt_cookies
    return jsonify({"message": "Logout successful (token needs to be discarded client-side)"}), 200

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
#     # logging.info(f"Password reset requested for email '{email}'. Source IP: {request.remote_addr}")
#     # ... implementation for task 4.6 ...
#     pass

# @auth_bp.route('/reset-password/<token>', methods=['POST'])
# def reset_password(token):
#     # user = User.verify_reset_token(token)
#     # logging.info(f"Password reset attempt with token '{token}' for UserID '{user.id if user else 'unknown'}'. Source IP: {request.remote_addr}")
#     # if user:
#     #     password = request.json.get('password')
#     #     # Validate password complexity...
#     #     user.set_password(password)
#     #     db.session.commit()
#     #     logging.info(f"Password reset successful for UserID '{user.id}'. Source IP: {request.remote_addr}")
#     # else:
#     #     logging.warning(f"Password reset failed: Invalid or expired token '{token}'. Source IP: {request.remote_addr}")
#     # ... implementation for task 4.6 ...
#     pass 