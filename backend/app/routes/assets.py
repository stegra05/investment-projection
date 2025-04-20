from flask import Blueprint, request, jsonify, abort
from app import db
from app.models import Asset
from flask_jwt_extended import jwt_required
from decimal import InvalidOperation
from pydantic import ValidationError

# Import shared decorator and schemas (Adjust path if necessary)
from app.utils.decorators import verify_portfolio_ownership # Assuming decorator is moved
from app.schemas.portfolio_schemas import AssetSchema, AssetCreateSchema, AssetUpdateSchema

# Define the blueprint: 'assets', prefix will be handled during registration
assets_bp = Blueprint('assets', __name__)

# --- Helper Functions ---

# Note: 'portfolio' object is injected by the verify_portfolio_ownership decorator
def get_asset_or_404(portfolio, asset_id: int):
     """Gets an asset by ID within a portfolio, aborting if not found."""
     # Check eager loaded assets first (assuming portfolio object might have them)
     if hasattr(portfolio, 'assets'):
         for asset in portfolio.assets:
             if asset.asset_id == asset_id:
                 return asset
     # Fallback query if not found in potentially eager loaded list
     asset = Asset.query.filter_by(portfolio_id=portfolio.portfolio_id, asset_id=asset_id).first()
     if asset is None:
         abort(404, description=f"Asset with id {asset_id} not found within portfolio {portfolio.portfolio_id}.")
     return asset


# --- Asset Routes (Task 5.4) ---

@assets_bp.route('/assets', methods=['POST'])
@verify_portfolio_ownership # Decorator now handles portfolio fetching and ownership check
def add_asset(portfolio_id, portfolio): # 'portfolio' is injected by decorator
    """Adds a new asset to a specific portfolio."""
    json_data = request.get_json()
    if not json_data:
        abort(400, description="Request body cannot be empty.")

    # Validate using Pydantic (includes allocation exclusivity check)
    try:
        asset_data = AssetCreateSchema.parse_obj(json_data)
    except ValidationError as e:
        abort(400, description=e.errors())

    try:
        new_asset = Asset(
            portfolio_id=portfolio.portfolio_id,
            **asset_data.dict()
        )
        db.session.add(new_asset)
        db.session.commit()
        db.session.refresh(new_asset)
        # Serialize output
        return jsonify(AssetSchema.from_orm(new_asset).model_dump(mode='json')), 201
    except (InvalidOperation, ValueError) as e: # Keep specific validation error handling
         db.session.rollback()
         abort(400, description=f"Invalid numeric value provided: {e}")
    except Exception as e: # General DB error handling (will be refactored later)
         db.session.rollback()
         abort(500, description=f"Error adding asset: {e}")


@assets_bp.route('/assets/<int:asset_id>', methods=['PUT', 'PATCH'])
@verify_portfolio_ownership
def update_asset(portfolio_id, asset_id, portfolio):
    """Updates an existing asset within a portfolio."""
    asset = get_asset_or_404(portfolio, asset_id)
    json_data = request.get_json()
    if not json_data:
        abort(400, description="Request body cannot be empty for update.")

    # Validate input
    try:
        update_data = AssetUpdateSchema.parse_obj(json_data)
    except ValidationError as e:
        abort(400, description=e.errors())

    validated_dict = update_data.dict(exclude_unset=True)

    try:
        # Update fields
        for key, value in validated_dict.items():
            setattr(asset, key, value)

        # Note: SQLAlchemy model-level validation (@validates) should handle
        # exclusivity logic during setattr if implemented correctly.

        db.session.commit()
        db.session.refresh(asset)
        # Serialize output
        return jsonify(AssetSchema.from_orm(asset).model_dump(mode='json')), 200
    except (InvalidOperation, ValueError) as e:
         db.session.rollback()
         abort(400, description=f"Invalid numeric value provided: {e}")
    except Exception as e:
         db.session.rollback()
         abort(500, description=f"Error updating asset: {e}")


@assets_bp.route('/assets/<int:asset_id>', methods=['DELETE'])
@verify_portfolio_ownership
def delete_asset(portfolio_id, asset_id, portfolio):
    """Deletes an asset from a portfolio."""
    asset = get_asset_or_404(portfolio, asset_id)
    try:
        db.session.delete(asset)
        db.session.commit()
        return jsonify({"message": "Asset deleted successfully"}), 200
    except Exception as e:
         db.session.rollback()
         abort(500, description=f"Error deleting asset: {e}") 