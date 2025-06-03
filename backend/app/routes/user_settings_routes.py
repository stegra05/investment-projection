"""
Blueprint for handling user-specific settings routes.

This allows authenticated users to retrieve and update their application settings,
such as the default inflation rate for projections.
"""
from flask import Blueprint, request, jsonify, current_app # Added current_app for logging
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import db # Access to the SQLAlchemy database session
from ..models import User # The User model
from ..schemas.user_schemas import UserSettingsSchema, UserSettingsUpdateSchema # Pydantic schemas for validation and serialization
from pydantic import ValidationError # For catching Pydantic validation errors

# Define the blueprint: 'user_settings_bp'
# URL prefix /api/v1/users/settings ensures these routes are versioned and clearly scoped.
user_settings_bp = Blueprint('user_settings_bp', __name__)

@user_settings_bp.route('', methods=['GET'])
@jwt_required() # Ensures the user is authenticated
def get_user_settings():
    """Retrieves the current settings for the authenticated user.

    Returns:
        JSON response with user settings (UserSettingsSchema) and 200 status code.
        Returns 404 if the user is not found (should not happen with JWT).
    """
    user_id_from_jwt = get_jwt_identity()
    current_app.logger.info(f"Fetching settings for UserID: '{user_id_from_jwt}'.")
    
    # Fetch the user object from the database using the identity from the JWT.
    # `User.query.get()` is a shortcut to query by primary key.
    user = User.query.get(user_id_from_jwt)

    if not user:
        # This case should ideally not be reached if JWTs are managed correctly,
        # as a valid JWT should always correspond to an existing user.
        current_app.logger.warning(f"User with ID '{user_id_from_jwt}' not found in database, though JWT was valid.")
        return jsonify({'message': 'User not found in database.'}), 404

    # Serialize the user's settings using the UserSettingsSchema.
    # `UserSettingsSchema.model_validate(user)` converts the ORM User object to a Pydantic model.
    # `model_dump()` then creates a dictionary suitable for JSON response.
    settings_data = UserSettingsSchema.model_validate(user).model_dump()
    current_app.logger.debug(f"Returning settings for UserID '{user_id_from_jwt}': {settings_data}")
    return jsonify(settings_data), 200

@user_settings_bp.route('', methods=['PUT'])
@jwt_required() # Ensures the user is authenticated
def update_user_settings():
    """Updates settings for the authenticated user.

    The request body must conform to `UserSettingsUpdateSchema`. Only fields
    present in the request and defined in the schema will be considered for update.

    Returns:
        JSON response with a success message and the updated settings (UserSettingsSchema),
        and a 200 status code.
        Returns 400 for invalid request data.
        Returns 404 if the user is not found.
        Returns 500 for database errors.
    """
    user_id_from_jwt = get_jwt_identity()
    current_app.logger.info(f"Updating settings for UserID: '{user_id_from_jwt}'.")

    user = User.query.get(user_id_from_jwt)
    if not user:
        current_app.logger.warning(f"User with ID '{user_id_from_jwt}' not found for settings update, though JWT was valid.")
        return jsonify({'message': 'User not found in database.'}), 404

    request_json = request.get_json()
    if not request_json:
        current_app.logger.warning(f"Empty JSON body received for UserID '{user_id_from_jwt}' settings update.")
        return jsonify({'message': 'Request body must be JSON and non-empty.'}), 400

    # Validate the incoming JSON data against the UserSettingsUpdateSchema.
    try:
        # `**request_json` unpacks the dictionary into keyword arguments for the Pydantic model.
        validated_update_data = UserSettingsUpdateSchema(**request_json)
    except ValidationError as e:
        current_app.logger.warning(f"Validation error updating settings for UserID '{user_id_from_jwt}': {e.errors()}")
        # Return detailed validation errors from Pydantic.
        return jsonify({'message': 'Invalid data provided for settings update.', 'errors': e.errors()}), 400

    # Apply the validated updates to the User object.
    # Only update fields that were actually provided in the request (Pydantic model handles this via Optional fields).
    updated_fields = []
    if validated_update_data.default_inflation_rate is not None:
        # The Pydantic model ensures `default_inflation_rate` is a Decimal if provided.
        # SQLAlchemy's Numeric type column can handle Decimal objects directly.
        user.default_inflation_rate = validated_update_data.default_inflation_rate
        updated_fields.append('default_inflation_rate')
    
    # Add logic for other updatable settings here if they become part of UserSettingsUpdateSchema.
    # Example:
    # if validated_update_data.some_other_setting is not None:
    #     user.some_other_setting = validated_update_data.some_other_setting
    #     updated_fields.append('some_other_setting')

    if not updated_fields:
        current_app.logger.info(f"No actual changes to settings for UserID '{user_id_from_jwt}'. Data received: {request_json}")
        # Return current settings if no updatable fields were provided or matched.
        current_settings_data = UserSettingsSchema.model_validate(user).model_dump()
        return jsonify({'message': 'No settings were changed. Current settings returned.', 'settings': current_settings_data}), 200

    try:
        db.session.commit() # Commit the changes to the database.
        current_app.logger.info(f"Successfully updated settings ({', '.join(updated_fields)}) for UserID '{user_id_from_jwt}'.")
        
        # Return the newly updated settings, serialized by UserSettingsSchema.
        updated_settings_data = UserSettingsSchema.model_validate(user).model_dump()
        return jsonify({'message': 'Settings updated successfully.', 'settings': updated_settings_data}), 200
    except Exception as e:
        db.session.rollback() # Rollback in case of database error.
        current_app.logger.error(f"Database error updating settings for UserID '{user_id_from_jwt}': {str(e)}", exc_info=True)
        return jsonify({'message': 'Failed to update settings due to a server error.'}), 500