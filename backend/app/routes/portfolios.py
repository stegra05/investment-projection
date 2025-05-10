from flask import Blueprint, request, jsonify, abort, current_app
from app import db
from app.models import Portfolio, Asset
from flask_jwt_extended import jwt_required, get_jwt_identity
import functools
from app.utils.decorators import handle_api_errors # Keep it for create/update
from decimal import Decimal # Add Decimal import
import logging

# Import Pydantic Schemas
from app.schemas.portfolio_schemas import (
    PortfolioSchema, PortfolioCreateSchema, PortfolioUpdateSchema,
    BulkAllocationUpdateSchema # Import the new schema
)

# Define the blueprint: 'portfolios', prefix: /api/v1/portfolios
portfolios_bp = Blueprint('portfolios', __name__, url_prefix='/api/v1/portfolios')

# --- Decorators ---

# NEW version of verify_portfolio_ownership
# This decorator assumes @jwt_required() has already been applied and JWT identity is available.
def verify_portfolio_ownership(f):
    """Decorator to fetch portfolio by ID, verify ownership, and inject portfolio.
    Assumes @jwt_required() has already validated the JWT for non-OPTIONS requests.
    """
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        # OPTIONS requests should be handled by Flask-CORS automatic_options
        # or by @jwt_required() pass-through before this decorator is fully executed
        # for methods other than OPTIONS.

        # For non-OPTIONS requests, JWT identity should be available via @jwt_required applied earlier.
        user_id_str = get_jwt_identity()
        if user_id_str is None:
            # This should ideally not happen if @jwt_required() is correctly applied before this decorator.
            abort(401, "Authentication required; user identity not found after JWT check.")
        try:
            current_user_id = int(user_id_str)
        except (ValueError, TypeError):
            abort(401, "Invalid user identity format in token.")

        portfolio_id = kwargs.get('portfolio_id')
        if portfolio_id is None:
            abort(500, "Developer error: portfolio_id missing in route arguments for ownership check.")

        portfolio = Portfolio.query.options(
            db.joinedload(Portfolio.assets),
        ).get(portfolio_id)

        if portfolio is None:
            abort(404, description=f"Portfolio with id {portfolio_id} not found.")

        if portfolio.user_id != current_user_id:
            logging.warning(f"Access denied: UserID='{current_user_id}' attempted to access PortfolioID='{portfolio_id}' owned by UserID='{portfolio.user_id}'. Source IP: {request.remote_addr}")
            abort(403, description="User does not have permission to access this portfolio.")

        kwargs['portfolio'] = portfolio
        return f(*args, **kwargs)
    return wrapper


# --- Helper Functions ---

def _validate_bulk_allocation_data(portfolio, allocation_data, current_app):
    """Helper function to validate bulk allocation data."""
    # --- Logging Incoming Data --- 
    # Already logged by caller or can be logged here if needed
    # current_app.logger.debug(f"Validation - Parsed allocation list: {allocation_data}")

    # --- Additional Validation --- 
    portfolio_asset_ids = {asset.asset_id for asset in portfolio.assets}
    payload_asset_ids = {item.asset_id for item in allocation_data}

    # Log IDs for comparison
    current_app.logger.debug(f"Validation - Portfolio Asset IDs: {portfolio_asset_ids}")
    current_app.logger.debug(f"Validation - Payload Asset IDs: {payload_asset_ids}")

    # 1. Check if the number of assets in payload matches the portfolio
    if len(portfolio_asset_ids) != len(payload_asset_ids):
        error_msg = "Payload must include allocation for all assets currently in the portfolio."
        current_app.logger.warning(f"Validation Error: {error_msg} (Payload: {len(payload_asset_ids)}, Portfolio: {len(portfolio_asset_ids)}) ")
        abort(400, description=error_msg)

    # 2. Check if all asset IDs in the payload belong to the portfolio (Set comparison)
    if payload_asset_ids != portfolio_asset_ids:
        missing_from_payload = portfolio_asset_ids - payload_asset_ids
        extra_in_payload = payload_asset_ids - portfolio_asset_ids
        error_msg = "Asset IDs in payload do not exactly match assets in portfolio."
        current_app.logger.warning(f"Validation Error: {error_msg} Missing: {missing_from_payload}, Extra: {extra_in_payload}")
        abort(400, description=f"{error_msg} Missing: {list(missing_from_payload)}, Extra: {list(extra_in_payload)}")

    # 3. Double check sum (already done by schema, but belt and braces)
    total_percentage = sum(item.allocation_percentage for item in allocation_data)
    current_app.logger.debug(f"Validation - Calculated total percentage: {total_percentage}")
    if not (Decimal('99.99') <= total_percentage <= Decimal('100.01')):
         # This case should ideally be caught by the schema validator
         error_msg = f"Internal check failed: Total allocation must be 100%. Received: {total_percentage:.2f}%"
         current_app.logger.error(f"Validation Error: {error_msg}") # Log as error if schema missed it
         abort(400, description=error_msg)


# --- Portfolio Routes (Task 5.3) ---

@portfolios_bp.route('/hello', methods=['GET'])
def debug_hello():
    return jsonify({"msg": "Hello from portfolios"}), 200

@portfolios_bp.route('/headers', methods=['GET'])
def debug_headers():
    headers = {k: v for k, v in request.headers.items()}
    current_app.logger.debug(f"Incoming headers: {headers}")
    return jsonify(headers), 200

@portfolios_bp.route('/', methods=['GET'])
@jwt_required()
def get_user_portfolios():
    """Retrieves a list of portfolios belonging to the authenticated user."""
    # For OPTIONS requests, @jwt_required() lets them pass through, and Flask-CORS
    # (with automatic_options=True) should handle the response before this view code is run.
    # This function will only fully execute for GET requests.

    # Exceptions are handled by the global 500 handler
    current_user_id = int(get_jwt_identity())
    # Eager load details for serialization
    portfolios = Portfolio.query.options(
            db.joinedload(Portfolio.assets),
            db.joinedload(Portfolio.planned_changes)
        ).filter_by(user_id=current_user_id).all()
    result = [PortfolioSchema.from_orm(p).model_dump(mode='json', by_alias=True) for p in portfolios]
    return jsonify(result), 200

@portfolios_bp.route('/', methods=['POST'])
@jwt_required()
@handle_api_errors(schema=PortfolioCreateSchema)
def create_portfolio(validated_data): # Receive validated_data from decorator
    """Creates a new portfolio for the authenticated user."""
    # Error handling, JSON parsing, and validation are now handled by the decorator
    current_user_id = int(get_jwt_identity())

    new_portfolio = Portfolio(
        user_id=current_user_id,
        **validated_data.dict() # Use validated data directly
    )
    db.session.add(new_portfolio)
    db.session.commit() # Explicitly commit *before* refreshing
    db.session.refresh(new_portfolio) # Refresh to get DB defaults like ID

    return jsonify(PortfolioSchema.from_orm(new_portfolio).model_dump(mode='json', by_alias=True)), 201
    # Removed try...except block and manual commit/rollback

@portfolios_bp.route('/<int:portfolio_id>/', methods=['GET'])
@jwt_required()
@verify_portfolio_ownership
def get_portfolio_details(portfolio_id, portfolio):
    """Retrieves details for a specific portfolio, with configurable data inclusion."""
    # OPTIONS requests are now handled by Flask-CORS automatic_options.

    # Get the include parameter from query string, default to 'full'
    include = request.args.get('include', 'full').lower()
    
    # Define valid include options
    valid_includes = {'summary', 'assets', 'changes', 'full'}
    
    # If invalid include value provided, default to 'full'
    if include not in valid_includes:
        include = 'full'
    
    # Configure query options based on include parameter
    query_options = []
    if include in ['assets', 'full']:
        query_options.append(db.joinedload(Portfolio.assets))
    if include in ['changes', 'full']:
        query_options.append(db.joinedload(Portfolio.planned_changes))
    
    # Refresh the portfolio with the configured options
    db.session.refresh(portfolio)
    if query_options:
        db.session.expire(portfolio, ['assets', 'planned_changes'])
        # Re-query with the specified options
        portfolio = Portfolio.query.options(*query_options).get(portfolio_id)
    
    # Serialize using Pydantic schema with conditional field exclusion
    exclude_fields = set()
    if include == 'summary':
        exclude_fields.update(['assets', 'planned_changes'])
    elif include == 'assets':
        exclude_fields.add('planned_changes')
    elif include == 'changes':
        exclude_fields.add('assets')
    
    return jsonify(
        PortfolioSchema.from_orm(portfolio).model_dump(
            mode='json',
            by_alias=True,
            exclude=exclude_fields if exclude_fields else None
        )
    ), 200

@portfolios_bp.route('/<int:portfolio_id>/', methods=['PUT', 'PATCH'])
@jwt_required()
@verify_portfolio_ownership
@handle_api_errors(schema=PortfolioUpdateSchema)
def update_portfolio(portfolio_id, portfolio, validated_data): # Receive portfolio and validated_data
    """Updates details for a specific portfolio."""
    # OPTIONS requests are now handled by Flask-CORS automatic_options.
    # Error handling, JSON parsing, and validation are now handled by the decorator

    # Update model fields from validated data (only non-None fields)
    for key, value in validated_data.dict(exclude_unset=True).items():
         setattr(portfolio, key, value)

    # db.session.commit() # Commit is handled by decorator
    # db.session.refresh(portfolio) # Remove this line - refresh happens after commit in decorator if needed
     # Serialize output using Pydantic schema
    # Return tuple (response, status_code) for the decorator
    return jsonify(PortfolioSchema.from_orm(portfolio).model_dump(mode='json', by_alias=True)), 200
    # Removed try...except block and manual commit/rollback

@portfolios_bp.route('/<int:portfolio_id>/', methods=['DELETE'])
@jwt_required()
@verify_portfolio_ownership
def delete_portfolio(portfolio_id, portfolio):
    """Deletes a specific portfolio."""
    # OPTIONS requests are now handled by Flask-CORS automatic_options.
    # Error handling (including rollback) is now managed by the global 500 handler
    db.session.delete(portfolio)
    db.session.commit()
    return jsonify({"message": "Portfolio deleted successfully"}), 200

# --- NEW: Allocation Update Route ---

@portfolios_bp.route('/<int:portfolio_id>/allocations/', methods=['PUT'])
@verify_portfolio_ownership
@handle_api_errors(schema=BulkAllocationUpdateSchema)
def update_allocations(portfolio_id, portfolio, validated_data):
    """Updates allocation percentages for all assets in a portfolio."""
    # --- Logging Incoming Data --- 
    current_app.logger.info(f"Update allocations request for portfolio {portfolio_id}")
    current_app.logger.debug(f"Incoming validated data: {validated_data}")
    allocation_data = validated_data.allocations
    # Log the extracted list for clarity
    current_app.logger.debug(f"Parsed allocation list: {allocation_data}")

    # --- Perform Validation ---
    _validate_bulk_allocation_data(portfolio, allocation_data, current_app)


    # --- Database Update ---
    try:
        assets_to_update = {asset.asset_id: asset for asset in portfolio.assets}
        current_app.logger.info(f"Updating {len(assets_to_update)} assets...")
        for item in allocation_data:
            asset = assets_to_update.get(item.asset_id)
            if asset:
                 asset.allocation_percentage = item.allocation_percentage
                 asset.allocation_value = None
                 current_app.logger.debug(f"  Asset {asset.asset_id}: Set allocation % to {item.allocation_percentage}")
            else:
                 # This should be caught above, but log defensively
                 current_app.logger.error(f"Consistency Error: Asset ID {item.asset_id} from validated payload not found in portfolio assets during update!")
                 raise Exception(f"Asset ID {item.asset_id} not found during update phase.")
        # Commit is handled by the handle_api_errors decorator
        current_app.logger.info("Allocations updated in session, awaiting commit.")
        return jsonify({"message": "Allocations updated successfully"}), 200
    except Exception as e:
        # Rollback handled by decorator
        current_app.logger.error(f"Error during allocation database update: {e}", exc_info=True)
        abort(500, description=f"An internal error occurred while updating allocations: {e}")


# --- Asset Routes (Task 5.4) ---

# --- Planned Future Change Routes (Task 5.5) --- 