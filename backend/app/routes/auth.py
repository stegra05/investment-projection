from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity, jwt_required, set_refresh_cookies
from sqlalchemy import or_
# Import the limiter instance from the app factory
from app import limiter
import re # Add re import for regex validation
import logging

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
    # --- End Password Validation ---

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