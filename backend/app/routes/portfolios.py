from flask import Blueprint, request, jsonify, abort
from app import db
from app.models import Portfolio, Asset, PlannedFutureChange
from flask_jwt_extended import jwt_required, get_jwt_identity
from decimal import Decimal, InvalidOperation
from datetime import date
import functools
from pydantic import ValidationError # Import Pydantic validation error

# Import Pydantic Schemas
from app.schemas.portfolio_schemas import (
    PortfolioSchema, PortfolioCreateSchema, PortfolioUpdateSchema,
    AssetSchema, AssetCreateSchema, AssetUpdateSchema,
    PlannedChangeSchema, PlannedChangeCreateSchema, PlannedChangeUpdateSchema
)

# Define the blueprint: 'portfolios', prefix: /api/v1/portfolios
portfolios_bp = Blueprint('portfolios', __name__, url_prefix='/api/v1/portfolios')

# --- Decorators ---

def verify_portfolio_ownership(f):
    """Decorator to fetch portfolio by ID, verify ownership, and inject portfolio."""
    @functools.wraps(f)
    @jwt_required() # Ensures user is logged in first
    def wrapper(*args, **kwargs):
        portfolio_id = kwargs.get('portfolio_id')
        if portfolio_id is None:
            abort(500, "Developer error: portfolio_id missing in route arguments for ownership check.")

        try:
            user_id_str = get_jwt_identity()
            current_user_id = int(user_id_str)
        except (ValueError, TypeError):
             abort(401, "Invalid user identity in token.")

        portfolio = Portfolio.query.options(
            # Eager load details needed for PortfolioSchema serialization
            db.joinedload(Portfolio.assets),
            db.joinedload(Portfolio.planned_changes)
        ).get(portfolio_id)

        if portfolio is None:
            abort(404, description=f"Portfolio with id {portfolio_id} not found.")

        if portfolio.user_id != current_user_id:
            abort(403, description="User does not have permission to access this portfolio.")

        kwargs['portfolio'] = portfolio
        return f(*args, **kwargs)
    return wrapper


# --- Helper Functions ---

def get_asset_or_404(portfolio: Portfolio, asset_id: int):
     """Gets an asset by ID within a portfolio, aborting if not found."""
     # We can directly check the loaded assets if the portfolio was eager loaded
     for asset in portfolio.assets:
         if asset.asset_id == asset_id:
             return asset
     # Fallback query if not found in eager loaded list (shouldn't happen with correct decorator loading)
     asset = Asset.query.filter_by(portfolio_id=portfolio.portfolio_id, asset_id=asset_id).first()
     if asset is None:
         abort(404, description=f"Asset with id {asset_id} not found within portfolio {portfolio.portfolio_id}.")
     return asset

def get_change_or_404(portfolio: Portfolio, change_id: int):
     """Gets a planned change by ID within a portfolio, aborting if not found."""
     # Check eager loaded changes
     for change in portfolio.planned_changes: # Assuming relationship name is planned_changes
        if change.change_id == change_id:
            return change
     # Fallback query
     change = PlannedFutureChange.query.filter_by(portfolio_id=portfolio.portfolio_id, change_id=change_id).first()
     if change is None:
         abort(404, description=f"Planned change with id {change_id} not found within portfolio {portfolio.portfolio_id}.")
     return change


# --- Portfolio Routes (Task 5.3) ---

@portfolios_bp.route('/hello', methods=['GET'])
def debug_hello():
    return jsonify({"msg": "Hello from portfolios"}), 200

@portfolios_bp.route('/headers', methods=['GET'])
def debug_headers():
    from flask import current_app
    headers = {k: v for k, v in request.headers.items()}
    current_app.logger.debug(f"Incoming headers: {headers}")
    return jsonify(headers), 200

@portfolios_bp.route('', methods=['GET'])
@jwt_required()
def get_user_portfolios():
    """Retrieves a list of portfolios belonging to the authenticated user."""
    try:
        current_user_id = int(get_jwt_identity())
        # Eager load details for serialization
        portfolios = Portfolio.query.options(
             db.joinedload(Portfolio.assets),
             db.joinedload(Portfolio.planned_changes)
         ).filter_by(user_id=current_user_id).all()
        # Use Pydantic schema for serialization, dumping to JSON-compatible types
        result = [PortfolioSchema.from_orm(p).model_dump(mode='json', by_alias=True) for p in portfolios]
        return jsonify(result), 200
    except Exception as e:
        import traceback; traceback.print_exc()
        abort(500, description=f"Error fetching portfolios: {e}")

@portfolios_bp.route('', methods=['POST'])
@jwt_required()
def create_portfolio():
    """Creates a new portfolio for the authenticated user."""
    try:
        current_user_id = int(get_jwt_identity())
        json_data = request.get_json()
        if not json_data:
            abort(400, description="Request body cannot be empty.")

        # Validate input using Pydantic schema
        try:
            portfolio_data = PortfolioCreateSchema.parse_obj(json_data)
        except ValidationError as e:
            abort(400, description=e.errors())

        new_portfolio = Portfolio(
            user_id=current_user_id,
            **portfolio_data.dict() # Use validated data
        )
        db.session.add(new_portfolio)
        db.session.commit()
        db.session.refresh(new_portfolio) # Refresh to get DB defaults like ID

        # Serialize output using Pydantic schema
        return jsonify(PortfolioSchema.from_orm(new_portfolio).model_dump(mode='json', by_alias=True)), 201
    except Exception as e:
        db.session.rollback()
        import traceback; traceback.print_exc()
        abort(500, description=f"Error creating portfolio: {e}")

@portfolios_bp.route('/<int:portfolio_id>', methods=['GET'])
@verify_portfolio_ownership
def get_portfolio_details(portfolio_id, portfolio):
    """Retrieves details for a specific portfolio, including assets and planned changes."""
    # Portfolio is already eager loaded by the decorator
    # Serialize using Pydantic schema (includes details based on schema definition)
    # Use model_dump with mode='json' for proper enum serialization
    return jsonify(PortfolioSchema.from_orm(portfolio).model_dump(mode='json', by_alias=True)), 200

@portfolios_bp.route('/<int:portfolio_id>', methods=['PUT', 'PATCH'])
@verify_portfolio_ownership
def update_portfolio(portfolio_id, portfolio):
    """Updates details for a specific portfolio."""
    json_data = request.get_json()
    if not json_data:
        abort(400, description="Request body cannot be empty for update.")

    # Validate input using Pydantic schema
    try:
        update_data = PortfolioUpdateSchema.parse_obj(json_data)
    except ValidationError as e:
        abort(400, description=e.errors())

    # Update model fields from validated data (only non-None fields)
    for key, value in update_data.dict(exclude_unset=True).items():
         setattr(portfolio, key, value)

    try:
        db.session.commit()
        db.session.refresh(portfolio)
         # Serialize output using Pydantic schema
        return jsonify(PortfolioSchema.from_orm(portfolio).model_dump(mode='json', by_alias=True)), 200
    except Exception as e:
        db.session.rollback()
        abort(500, description=f"Error updating portfolio: {e}")

@portfolios_bp.route('/<int:portfolio_id>', methods=['DELETE'])
@verify_portfolio_ownership
def delete_portfolio(portfolio_id, portfolio):
    """Deletes a specific portfolio."""
    try:
        db.session.delete(portfolio)
        db.session.commit()
        return jsonify({"message": "Portfolio deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        abort(500, description=f"Error deleting portfolio: {e}")


# --- Asset Routes (Task 5.4) ---

@portfolios_bp.route('/<int:portfolio_id>/assets', methods=['POST'])
@verify_portfolio_ownership
def add_asset(portfolio_id, portfolio):
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
    except (InvalidOperation, ValueError) as e: # Should be caught by Pydantic, but keep as safety
         db.session.rollback()
         abort(400, description=f"Invalid numeric value provided: {e}")
    except Exception as e:
         db.session.rollback()
         abort(500, description=f"Error adding asset: {e}")


@portfolios_bp.route('/<int:portfolio_id>/assets/<int:asset_id>', methods=['PUT', 'PATCH'])
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


@portfolios_bp.route('/<int:portfolio_id>/assets/<int:asset_id>', methods=['DELETE'])
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


# --- Planned Future Change Routes (Task 5.5) ---

@portfolios_bp.route('/<int:portfolio_id>/changes', methods=['POST'])
@verify_portfolio_ownership
def add_planned_change(portfolio_id, portfolio):
    """Adds a new planned future change to a specific portfolio."""
    json_data = request.get_json()
    if not json_data:
        abort(400, description="Request body cannot be empty.")

    # Validate input using Pydantic schema (includes type/amount check)
    try:
        change_data = PlannedChangeCreateSchema.parse_obj(json_data)
    except ValidationError as e:
        abort(400, description=e.errors())
    # Removed manual date parsing & type/amount checks - handled by schema

    try:
        new_change = PlannedFutureChange(
            portfolio_id=portfolio.portfolio_id,
            **change_data.dict()
        )
        db.session.add(new_change)
        db.session.commit()
        db.session.refresh(new_change)
        # Serialize output
        return jsonify(PlannedChangeSchema.from_orm(new_change).model_dump(mode='json', by_alias=True)), 201
    except (InvalidOperation, ValueError) as e: # Should be caught by Pydantic
        db.session.rollback()
        abort(400, description=f"Invalid numeric value for 'amount': {e}")
    except Exception as e:
        db.session.rollback()
        abort(500, description=f"Error adding planned change: {e}")


@portfolios_bp.route('/<int:portfolio_id>/changes/<int:change_id>', methods=['PUT', 'PATCH'])
@verify_portfolio_ownership
def update_planned_change(portfolio_id, change_id, portfolio):
    """Updates an existing planned change within a portfolio."""
    change = get_change_or_404(portfolio, change_id)
    json_data = request.get_json()
    if not json_data:
        abort(400, description="Request body cannot be empty for update.")

    # Validate input
    try:
        update_data = PlannedChangeUpdateSchema.parse_obj(json_data)
    except ValidationError as e:
        abort(400, description=e.errors())
    # Removed manual date parsing

    validated_dict = update_data.dict(exclude_unset=True)

    try:
        # Update model fields
        for key, value in validated_dict.items():
            setattr(change, key, value)

        # Re-validate consistency after potential updates
        # (Pydantic validator on update schema might not catch all cases if fields are missing)
        if change.change_type in ['Contribution', 'Withdrawal'] and change.amount is None:
            abort(400, description=f"'{change.change_type}' requires an 'amount'.")
        if change.change_type == 'Reallocation' and change.amount is not None:
            abort(400, description="'Reallocation' change type should not include an 'amount'.")

        db.session.commit()
        db.session.refresh(change)
        # Serialize output
        return jsonify(PlannedChangeSchema.from_orm(change).model_dump(mode='json', by_alias=True)), 200
    except (InvalidOperation, ValueError) as e: # Should be caught by Pydantic
        db.session.rollback()
        abort(400, description=f"Invalid numeric value for 'amount': {e}")
    except Exception as e:
        db.session.rollback()
        abort(500, description=f"Error updating planned change: {e}")


@portfolios_bp.route('/<int:portfolio_id>/changes/<int:change_id>', methods=['DELETE'])
@verify_portfolio_ownership
def delete_planned_change(portfolio_id, change_id, portfolio):
    """Deletes a planned change from a portfolio."""
    change = get_change_or_404(portfolio, change_id)
    try:
        db.session.delete(change)
        db.session.commit()
        return jsonify({"message": "Planned change deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        abort(500, description=f"Error deleting planned change: {e}") 