from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import db
from ..models import User
from ..schemas.user_schemas import UserSettingsSchema, UserSettingsUpdateSchema
from pydantic import ValidationError

user_settings_bp = Blueprint('user_settings_bp', __name__, url_prefix='/api/v1/users/settings')

@user_settings_bp.route('', methods=['GET'])
@jwt_required()
def get_user_settings():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({'message': 'User not found'}), 404

    # We can directly pass the user object to the schema if orm_mode = True
    settings_data = UserSettingsSchema.model_validate(user).model_dump()
    return jsonify(settings_data), 200

@user_settings_bp.route('', methods=['PUT'])
@jwt_required()
def update_user_settings():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({'message': 'User not found'}), 404

    try:
        data = UserSettingsUpdateSchema(**request.json)
    except ValidationError as e:
        return jsonify({'errors': e.errors()}), 400

    if data.default_inflation_rate is not None:
        # The Pydantic model will provide a Decimal, which SQLAlchemy Numeric fields can handle.
        user.default_inflation_rate = data.default_inflation_rate
    
    # Add logic for other settings here if they are part of UserSettingsUpdateSchema

    try:
        db.session.commit()
        # Return the updated settings
        updated_settings_data = UserSettingsSchema.model_validate(user).model_dump()
        return jsonify({'message': 'Settings updated successfully', 'settings': updated_settings_data}), 200
    except Exception as e:
        db.session.rollback()
        # Log the error e
        return jsonify({'message': 'Failed to update settings', 'error': str(e)}), 500 