from flask import Blueprint, request, jsonify, abort
from app import db
from app.models import Portfolio, Asset, PlannedFutureChange
from flask_jwt_extended import jwt_required, get_jwt_identity
from decimal import Decimal, InvalidOperation
from datetime import date

# Define the blueprint: 'portfolios', prefix: /api/v1/portfolios
portfolios_bp = Blueprint('portfolios', __name__, url_prefix='/api/v1/portfolios')

# --- Helper Functions ---

def get_portfolio_or_404(portfolio_id, user_id):
    """Gets a portfolio by ID and checks ownership, aborting if not found or not owned."""
    portfolio = Portfolio.query.get_or_404(portfolio_id)
    if portfolio.user_id != user_id:
        abort(403, description="User does not have permission to access this portfolio.") # Forbidden
    return portfolio

def get_asset_or_404(portfolio, asset_id):
     """Gets an asset by ID within a portfolio, aborting if not found."""
     asset = Asset.query.filter_by(portfolio_id=portfolio.portfolio_id, asset_id=asset_id).first()
     if asset is None:
         abort(404, description="Asset not found within this portfolio.")
     return asset

def get_change_or_404(portfolio, change_id):
     """Gets a planned change by ID within a portfolio, aborting if not found."""
     change = PlannedFutureChange.query.filter_by(portfolio_id=portfolio.portfolio_id, change_id=change_id).first()
     if change is None:
         abort(404, description="Planned change not found within this portfolio.")
     return change


# --- Portfolio Routes (Task 5.3) ---

@portfolios_bp.route('', methods=['GET'])
@jwt_required()
def get_user_portfolios():
    """Retrieves a list of portfolios belonging to the authenticated user."""
    current_user_id = int(get_jwt_identity())
    portfolios = Portfolio.query.filter_by(user_id=current_user_id).all()
    return jsonify([p.to_dict() for p in portfolios]), 200

@portfolios_bp.route('', methods=['POST'])
@jwt_required()
def create_portfolio():
    """Creates a new portfolio for the authenticated user."""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data or not data.get('name'):
        abort(400, description="Missing 'name' in request body.")

    new_portfolio = Portfolio(
        user_id=current_user_id,
        name=data['name'],
        description=data.get('description')
    )
    db.session.add(new_portfolio)
    db.session.commit()
    return jsonify(new_portfolio.to_dict()), 201

@portfolios_bp.route('/<int:portfolio_id>', methods=['GET'])
@jwt_required()
def get_portfolio_details(portfolio_id):
    """Retrieves details for a specific portfolio, including assets and planned changes."""
    current_user_id = int(get_jwt_identity())
    portfolio = get_portfolio_or_404(portfolio_id, current_user_id)
    return jsonify(portfolio.to_dict(include_details=True)), 200

@portfolios_bp.route('/<int:portfolio_id>', methods=['PUT', 'PATCH'])
@jwt_required()
def update_portfolio(portfolio_id):
    """Updates details for a specific portfolio."""
    current_user_id = int(get_jwt_identity())
    portfolio = get_portfolio_or_404(portfolio_id, current_user_id)
    data = request.get_json()

    if not data:
        abort(400, description="Request body cannot be empty for update.")

    if 'name' in data:
        portfolio.name = data['name']
    if 'description' in data:
        portfolio.description = data['description']
    # Add other updatable fields as needed

    db.session.commit()
    return jsonify(portfolio.to_dict()), 200

@portfolios_bp.route('/<int:portfolio_id>', methods=['DELETE'])
@jwt_required()
def delete_portfolio(portfolio_id):
    """Deletes a specific portfolio."""
    current_user_id = int(get_jwt_identity())
    portfolio = get_portfolio_or_404(portfolio_id, current_user_id)

    db.session.delete(portfolio)
    db.session.commit()
    return jsonify({"message": "Portfolio deleted successfully"}), 200 # Or 204 No Content


# --- Asset Routes (Task 5.4) ---

@portfolios_bp.route('/<int:portfolio_id>/assets', methods=['POST'])
@jwt_required()
def add_asset(portfolio_id):
    """Adds a new asset to a specific portfolio."""
    current_user_id = int(get_jwt_identity())
    portfolio = get_portfolio_or_404(portfolio_id, current_user_id)
    data = request.get_json()

    required_fields = ['asset_type']
    # Require one and only one allocation type
    allocation_percentage = data.get('allocation_percentage')
    allocation_value = data.get('allocation_value')

    if not data or not all(field in data for field in required_fields):
        abort(400, description="Missing required fields (e.g., 'asset_type').")
    if (allocation_percentage is None and allocation_value is None) or \
       (allocation_percentage is not None and allocation_value is not None):
        abort(400, description="Exactly one of 'allocation_percentage' or 'allocation_value' must be provided.")

    try:
        new_asset = Asset(
            portfolio_id=portfolio.portfolio_id,
            asset_type=data['asset_type'],
            name_or_ticker=data.get('name_or_ticker'),
            allocation_percentage=Decimal(allocation_percentage) if allocation_percentage is not None else None,
            allocation_value=Decimal(allocation_value) if allocation_value is not None else None,
            manual_expected_return=Decimal(data['manual_expected_return']) if data.get('manual_expected_return') is not None else None
        )
        # Add validation for percentage range (0-100) if needed
        # if new_asset.allocation_percentage is not None and not (0 <= new_asset.allocation_percentage <= 100):
        #     abort(400, description="Allocation percentage must be between 0 and 100.")

        db.session.add(new_asset)
        db.session.commit()
        return jsonify(new_asset.to_dict()), 201
    except (InvalidOperation, ValueError) as e:
         abort(400, description=f"Invalid numeric value provided: {e}")


@portfolios_bp.route('/<int:portfolio_id>/assets/<int:asset_id>', methods=['PUT', 'PATCH'])
@jwt_required()
def update_asset(portfolio_id, asset_id):
    """Updates an existing asset within a portfolio."""
    current_user_id = int(get_jwt_identity())
    portfolio = get_portfolio_or_404(portfolio_id, current_user_id)
    asset = get_asset_or_404(portfolio, asset_id)
    data = request.get_json()

    if not data:
        abort(400, description="Request body cannot be empty for update.")

    try:
        # Track if allocation type is changing to maintain exclusivity
        allocation_type_changing = ('allocation_percentage' in data or 'allocation_value' in data)

        if 'asset_type' in data:
            asset.asset_type = data['asset_type']
        if 'name_or_ticker' in data:
            asset.name_or_ticker = data['name_or_ticker']

        if 'allocation_percentage' in data:
            if data['allocation_percentage'] is None:
                 asset.allocation_percentage = None
            else:
                asset.allocation_percentage = Decimal(data['allocation_percentage'])
                asset.allocation_value = None # Ensure exclusivity
        if 'allocation_value' in data:
            if data['allocation_value'] is None:
                 asset.allocation_value = None
            else:
                asset.allocation_value = Decimal(data['allocation_value'])
                asset.allocation_percentage = None # Ensure exclusivity

        if 'manual_expected_return' in data:
            asset.manual_expected_return = Decimal(data['manual_expected_return']) if data['manual_expected_return'] is not None else None

        # Re-check exclusivity if not explicitly handled by update logic
        if not allocation_type_changing and asset.allocation_percentage is not None and asset.allocation_value is not None:
             # This case should ideally not happen if logic above is correct, but as safety:
             abort(400, description="Asset cannot have both allocation_percentage and allocation_value set.")
        if asset.allocation_percentage is None and asset.allocation_value is None:
             abort(400, description="Asset must have either allocation_percentage or allocation_value set.")

        db.session.commit()
        return jsonify(asset.to_dict()), 200
    except (InvalidOperation, ValueError) as e:
         abort(400, description=f"Invalid numeric value provided: {e}")


@portfolios_bp.route('/<int:portfolio_id>/assets/<int:asset_id>', methods=['DELETE'])
@jwt_required()
def delete_asset(portfolio_id, asset_id):
    """Deletes an asset from a portfolio."""
    current_user_id = int(get_jwt_identity())
    portfolio = get_portfolio_or_404(portfolio_id, current_user_id)
    asset = get_asset_or_404(portfolio, asset_id)

    db.session.delete(asset)
    db.session.commit()
    return jsonify({"message": "Asset deleted successfully"}), 200 # Or 204


# --- Planned Future Change Routes (Task 5.5) ---

@portfolios_bp.route('/<int:portfolio_id>/changes', methods=['POST'])
@jwt_required()
def add_planned_change(portfolio_id):
    """Adds a new planned future change to a specific portfolio."""
    current_user_id = int(get_jwt_identity())
    portfolio = get_portfolio_or_404(portfolio_id, current_user_id)
    data = request.get_json()

    required_fields = ['change_type', 'change_date']
    if not data or not all(field in data for field in required_fields):
        abort(400, description="Missing required fields ('change_type', 'change_date').")

    try:
        change_date_obj = date.fromisoformat(data['change_date'])
    except (ValueError, TypeError):
        abort(400, description="Invalid date format for 'change_date'. Use YYYY-MM-DD.")

    try:
        new_change = PlannedFutureChange(
            portfolio_id=portfolio.portfolio_id,
            change_type=data['change_type'],
            change_date=change_date_obj,
            amount=Decimal(data['amount']) if data.get('amount') is not None else None,
            description=data.get('description')
        )
        db.session.add(new_change)
        db.session.commit()
        return jsonify(new_change.to_dict()), 201
    except (InvalidOperation, ValueError) as e:
         abort(400, description=f"Invalid numeric value for 'amount': {e}")

@portfolios_bp.route('/<int:portfolio_id>/changes/<int:change_id>', methods=['PUT', 'PATCH'])
@jwt_required()
def update_planned_change(portfolio_id, change_id):
    """Updates an existing planned future change within a portfolio."""
    current_user_id = int(get_jwt_identity())
    portfolio = get_portfolio_or_404(portfolio_id, current_user_id)
    change = get_change_or_404(portfolio, change_id)
    data = request.get_json()

    if not data:
        abort(400, description="Request body cannot be empty for update.")

    try:
        if 'change_type' in data:
            change.change_type = data['change_type']
        if 'change_date' in data:
            try:
                change.change_date = date.fromisoformat(data['change_date'])
            except (ValueError, TypeError):
                abort(400, description="Invalid date format for 'change_date'. Use YYYY-MM-DD.")
        if 'amount' in data:
             change.amount = Decimal(data['amount']) if data['amount'] is not None else None
        if 'description' in data:
            change.description = data['description']

        db.session.commit()
        return jsonify(change.to_dict()), 200
    except (InvalidOperation, ValueError) as e:
        abort(400, description=f"Invalid numeric value for 'amount': {e}")


@portfolios_bp.route('/<int:portfolio_id>/changes/<int:change_id>', methods=['DELETE'])
@jwt_required()
def delete_planned_change(portfolio_id, change_id):
    """Deletes a planned future change from a portfolio."""
    current_user_id = int(get_jwt_identity())
    portfolio = get_portfolio_or_404(portfolio_id, current_user_id)
    change = get_change_or_404(portfolio, change_id)

    db.session.delete(change)
    db.session.commit()
    return jsonify({"message": "Planned change deleted successfully"}), 200 # Or 204 