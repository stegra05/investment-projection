from flask import Blueprint, jsonify, abort
from app import db
from app.models import Portfolio, Asset # Keep Portfolio for type hinting if needed
from app.routes.portfolios import verify_portfolio_ownership # Import decorator
from app.utils.decorators import handle_api_errors # Import error handler
from app.schemas.portfolio_schemas import AssetSchema, AssetCreateSchema, AssetUpdateSchema
from decimal import Decimal # Import Decimal

# Define the blueprint: 'assets', mounting handled in app/__init__.py
# No url_prefix here, it will be defined during registration
assets_bp = Blueprint('assets', __name__)

# --- Helper Function (Copied from portfolios.py) ---

def get_asset_or_404(portfolio: Portfolio, asset_id: int):
     """Gets an asset by ID within a portfolio, aborting if not found."""
     # Check eager loaded assets first (passed via decorator)
     for asset in portfolio.assets:
         if asset.asset_id == asset_id:
             return asset
     # Fallback query if not found in eager loaded list (shouldn't happen if decorator used correctly)
     # Note: This might require portfolio_id if portfolio object isn't fully functional here?
     # Let's assume portfolio object is sufficient from the decorator.
     asset_fallback = Asset.query.filter_by(portfolio_id=portfolio.portfolio_id, asset_id=asset_id).first()
     if asset_fallback is None:
         abort(404, description=f"Asset with id {asset_id} not found within portfolio {portfolio.portfolio_id}.")
     return asset_fallback

# --- Asset Routes (Moved from portfolios.py, Task 5.4) ---

# Note: portfolio_id is captured from the URL prefix during blueprint registration
# The verify_portfolio_ownership decorator injects the 'portfolio' object

@assets_bp.route('', methods=['POST']) # Route is relative to '/portfolios/<pid>/assets'
@verify_portfolio_ownership
@handle_api_errors(schema=AssetCreateSchema)
def add_asset(portfolio_id, portfolio, validated_data): # portfolio injected by verify_..., validated_data by handle_...
    """Adds a new asset to a specific portfolio.

    If neither allocation_percentage nor allocation_value is provided,
    allocation_percentage defaults to 0.
    """
    # Convert Pydantic model to dict
    asset_data = validated_data.model_dump()

    # Default allocation_percentage to 0 if neither is provided
    if asset_data.get('allocation_percentage') is None and asset_data.get('allocation_value') is None:
        asset_data['allocation_percentage'] = Decimal('0.00')

    new_asset = Asset(
        portfolio_id=portfolio.portfolio_id, # Use ID from the verified portfolio object
        **asset_data
    )
    db.session.add(new_asset)
    # Commit handled by decorator
    db.session.flush() # Flush session to get the new asset_id before commit
    # Serialize output using the base AssetSchema
    return jsonify(AssetSchema.from_orm(new_asset).model_dump(mode='json')), 201

@assets_bp.route('/<int:asset_id>', methods=['PUT', 'PATCH']) # Route is relative to '/portfolios/<pid>/assets'
@verify_portfolio_ownership
@handle_api_errors(schema=AssetUpdateSchema)
def update_asset(portfolio_id, asset_id, portfolio, validated_data):
    """Updates an existing asset within a portfolio."""
    asset = get_asset_or_404(portfolio, asset_id)
    validated_dict = validated_data.dict(exclude_unset=True)

    # Update fields
    for key, value in validated_dict.items():
        setattr(asset, key, value)

    # Commit handled by decorator
    # db.session.refresh(asset) # Removed - unnecessary as commit handles update
    # Serialize output
    return jsonify(AssetSchema.from_orm(asset).model_dump(mode='json')), 200

@assets_bp.route('/<int:asset_id>', methods=['DELETE'])
@verify_portfolio_ownership
# No handle_api_errors needed for DELETE unless we add payload validation later
def delete_asset(portfolio_id, asset_id, portfolio):
    """Deletes an asset from a portfolio."""
    asset = get_asset_or_404(portfolio, asset_id)
    try:
        db.session.delete(asset)
        db.session.commit() # Need manual commit/rollback for non-decorated routes
        return jsonify({"message": "Asset deleted successfully"}), 200
    except Exception as e:
         db.session.rollback()
         abort(500, description=f"Error deleting asset: {e}") 