"""
Blueprint for handling asset-related routes.

This blueprint manages CRUD operations for assets, which are always
nested under a specific portfolio. For example, to add an asset, the
endpoint would be /api/v1/portfolios/<portfolio_id>/assets/.
Portfolio ownership is verified for all asset operations using the
`verify_portfolio_ownership` decorator.
"""
from flask import Blueprint, jsonify, abort
from app import db
from app.models import Portfolio, Asset # Keep Portfolio for type hinting if needed
from app.routes.portfolios import verify_portfolio_ownership # Import decorator
from app.utils.decorators import handle_api_errors # Import error handler
from app.schemas.portfolio_schemas import AssetSchema, AssetCreateSchema, AssetUpdateSchema
from decimal import Decimal # Import Decimal
from app.utils.helpers import get_owned_child_or_404 # Import the new helper
from flask_jwt_extended import jwt_required # Added import

# Define the blueprint: 'assets'.
# The URL prefix (e.g., /portfolios/<int:portfolio_id>/assets) is defined
# when this blueprint is registered in app/__init__.py.
assets_bp = Blueprint('assets', __name__)

# --- Asset Routes ---
# These routes operate on assets within a specific portfolio.
# The `portfolio_id` is captured from the URL prefix.
# The `verify_portfolio_ownership` decorator handles fetching the portfolio
# and ensuring the current user owns it, injecting the `portfolio` object.
# The `handle_api_errors` decorator handles Pydantic validation and database errors.

@assets_bp.route('/', methods=['POST', 'OPTIONS']) # Endpoint: /portfolios/<portfolio_id>/assets/
@jwt_required() # Ensures the user is authenticated
@verify_portfolio_ownership # Verifies portfolio ownership and injects 'portfolio'
@handle_api_errors(schema=AssetCreateSchema) # Validates request data against AssetCreateSchema
def add_asset(portfolio_id: int, portfolio: Portfolio, validated_data):
    """Adds a new asset to the specified portfolio.

    The request body must conform to `AssetCreateSchema`.
    If neither 'allocation_percentage' nor 'allocation_value' is provided in the
    request, 'allocation_percentage' defaults to 0.00.

    Args:
        portfolio_id (int): The ID of the portfolio to add the asset to (from URL).
        portfolio (Portfolio): The portfolio object, injected by `verify_portfolio_ownership`.
        validated_data (AssetCreateSchema): The validated request data, injected by `handle_api_errors`.

    Returns:
        JSON response containing the newly created asset data (AssetSchema) and a 201 status code.
    """
    asset_data = validated_data.model_dump()

    # Default allocation_percentage to 0.00 if neither allocation field is provided.
    # This ensures that an asset always has some form of allocation defined, even if it's zero.
    if asset_data.get('allocation_percentage') is None and asset_data.get('allocation_value') is None:
        asset_data['allocation_percentage'] = Decimal('0.00')

    new_asset = Asset(
        portfolio_id=portfolio.portfolio_id, # Explicitly set portfolio_id from the verified portfolio
        **asset_data # Unpack other validated data fields
    )
    db.session.add(new_asset)
    # The commit is typically handled by the `handle_api_errors` decorator upon successful execution.
    db.session.flush() # Flush to get the new_asset.asset_id if needed before commit (e.g., for logging or immediate use)
    
    return jsonify(AssetSchema.from_orm(new_asset).model_dump(mode='json')), 201

@assets_bp.route('/<int:asset_id>/', methods=['PUT', 'PATCH', 'OPTIONS']) # Endpoint: /portfolios/<portfolio_id>/assets/<asset_id>/
@jwt_required()
@verify_portfolio_ownership
@handle_api_errors(schema=AssetUpdateSchema) # Validates request data against AssetUpdateSchema
def update_asset(portfolio_id: int, asset_id: int, portfolio: Portfolio, validated_data):
    """Updates an existing asset within the specified portfolio.

    The request body must conform to `AssetUpdateSchema`. Only fields present
    in the request will be updated.

    Args:
        portfolio_id (int): The ID of the portfolio (from URL).
        asset_id (int): The ID of the asset to update (from URL).
        portfolio (Portfolio): The portfolio object, injected by `verify_portfolio_ownership`.
        validated_data (AssetUpdateSchema): The validated request data, injected by `handle_api_errors`.

    Returns:
        JSON response containing the updated asset data (AssetSchema) and a 200 status code.
    """
    # Retrieve the specific asset, ensuring it belongs to the specified portfolio
    asset = get_owned_child_or_404(
        parent_instance=portfolio,
        child_relationship_name='assets', # The relationship attribute on the Portfolio model
        child_id=asset_id,
        child_model=Asset,
        child_pk_attr='asset_id' # The primary key attribute on the Asset model
    )
    
    # Get a dictionary of fields that were actually provided in the request
    update_data = validated_data.model_dump(exclude_unset=True)

    # Update the asset's attributes with the provided data
    for key, value in update_data.items():
        setattr(asset, key, value)

    # Commit is handled by the `handle_api_errors` decorator.
    # db.session.refresh(asset) # Not strictly necessary as SQLAlchemy tracks changes.
    return jsonify(AssetSchema.from_orm(asset).model_dump(mode='json')), 200

@assets_bp.route('/<int:asset_id>/', methods=['DELETE', 'OPTIONS']) # Endpoint: /portfolios/<portfolio_id>/assets/<asset_id>/
@jwt_required()
@verify_portfolio_ownership
# No specific schema validation for DELETE payload, but `handle_api_errors` still manages DB/other errors.
@handle_api_errors() 
def delete_asset(portfolio_id: int, asset_id: int, portfolio: Portfolio):
    """Deletes an asset from the specified portfolio.

    Args:
        portfolio_id (int): The ID of the portfolio (from URL).
        asset_id (int): The ID of the asset to delete (from URL).
        portfolio (Portfolio): The portfolio object, injected by `verify_portfolio_ownership`.

    Returns:
        JSON response with a success message and a 200 status code.
    """
    asset = get_owned_child_or_404(
        parent_instance=portfolio,
        child_relationship_name='assets',
        child_id=asset_id,
        child_model=Asset,
        child_pk_attr='asset_id'
    )
    
    db.session.delete(asset)
    # Commit is handled by the `handle_api_errors` decorator.
    # If an error occurs during delete/commit, `handle_api_errors` will perform a rollback.
    
    return jsonify({"message": "Asset deleted successfully"}), 200 