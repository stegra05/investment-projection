from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from flask_jwt_extended import create_access_token, jwt_required
from sqlalchemy import or_

# Define the blueprint: 'auth', prefix: /api/v1/auth
# Following API spec (prefix /api/v1/)
auth_bp = Blueprint('auth', __name__, url_prefix='/api/v1/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"message": "Missing username, email, or password"}), 400

    if User.query.filter_by(username=username).first() or User.query.filter_by(email=email).first():
        return jsonify({"message": "Username or email already exists"}), 409

    new_user = User(username=username, email=email)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    # Accept either email or username as identifier
    identifier = data.get('email') or data.get('username')
    password = data.get('password')
    if not identifier or not password:
        return jsonify({"message": "Missing username/email or password"}), 400
    # Search for user by email or username
    user = User.query.filter(
        or_(User.email == identifier, User.username == identifier)
    ).first()

    if user and user.check_password(password):
        access_token = create_access_token(identity=str(user.id))
        # Return token and user object for frontend consumption
        return jsonify(
            message="Login successful.",
            access_token=access_token,
            user={
                "id": user.id,
                "username": user.username,
                "email": user.email
            }
        ), 200
    else:
        return jsonify({"message": "Invalid email or password"}), 401

@auth_bp.route('/logout', methods=['POST'])
@jwt_required() # Protect this route
def logout():
    # JWT logout is primarily handled client-side by discarding the token.
    # Server-side blocklisting can be added for more robust security if needed.
    return jsonify({"message": "Logout successful (token needs to be discarded client-side)"}), 200

# Potential future endpoints:
# @auth_bp.route('/request-password-reset', methods=['POST'])
# def request_password_reset():
#     # ... implementation for task 4.6 ...
#     pass

# @auth_bp.route('/reset-password/<token>', methods=['POST'])
# def reset_password(token):
#     # ... implementation for task 4.6 ...
#     pass 