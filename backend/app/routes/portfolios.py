from flask import Blueprint, request, jsonify, abort, current_app
from app import db
from app.models import Portfolio, Asset
from flask_jwt_extended import jwt_required, get_jwt_identity
import functools
from app.utils.decorators import handle_api_errors # Keep it for create/update
from decimal import Decimal 
import logging
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from sqlalchemy import desc, asc
from sqlalchemy.orm import selectinload # Add import for selectinload

# Import Pydantic Schemas
from app.schemas.portfolio_schemas import (
    PortfolioSchema, PortfolioCreateSchema, PortfolioUpdateSchema,
    BulkAllocationUpdateSchema, PortfolioSummarySchema # Import the new summary schema
)

# Import custom exceptions
from app.utils.exceptions import (
    ApplicationException, PortfolioNotFoundError, AccessDeniedError, BadRequestError
)

# Define the blueprint: 'portfolios', prefix: /api/v1/portfolios
portfolios_bp = Blueprint('portfolios', __name__, url_prefix='/api/v1/portfolios')

# --- Decorators ---

# This decorator assumes @jwt_required() has already been applied and JWT identity is available.
def verify_portfolio_ownership(f):
    """Decorator to fetch portfolio by ID, verify ownership, and inject portfolio.
    Assumes @jwt_required() has already validated the JWT for non-OPTIONS requests.
    Flask-CORS and Flask-JWT-Extended are expected to handle OPTIONS preflight requests correctly.
    """
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        # If the request is an OPTIONS request, Flask-CORS and Flask-JWT-Extended will handle it.
        # Bypass decorator logic for OPTIONS to allow preflight requests.
        if request.method == 'OPTIONS':
            return current_app.make_default_options_response()
                                      # if the route itself doesn't need to handle OPTIONS.
                                      # However, given the routes specify 'OPTIONS', letting it pass
                                      # to the route function which then relies on Flask-CORS is safer.

        # For non-OPTIONS requests, JWT identity should be available via @jwt_required applied earlier.
        user_id_str = get_jwt_identity()
        if user_id_str is None:
            # This should ideally not happen if @jwt_required() is correctly applied before this decorator
            # or if an OPTIONS request somehow bypassed earlier handlers.
            current_app.logger.warning(f"verify_portfolio_ownership: User identity not found. Request method: {request.method}. Path: {request.path}")
            # Abort with 401 if no identity is found, which is standard for missing/invalid JWT.
            abort(401, description="Authentication required; user identity not found.")
        try:
            current_user_id = int(user_id_str)
        except (ValueError, TypeError):
            raise ApplicationException("Invalid user identity format in token.", status_code=401, logging_level="warning")

        portfolio_id = kwargs.get('portfolio_id')
        if portfolio_id is None:
            raise ApplicationException("Developer error: portfolio_id missing in route arguments for ownership check.", status_code=500)

        portfolio = Portfolio.query.options(
            db.joinedload(Portfolio.assets),
        ).get(portfolio_id)

        if portfolio is None:
            raise PortfolioNotFoundError(message=f"Portfolio with id {portfolio_id} not found.")

        if portfolio.user_id != current_user_id:
            current_app.logger.warning(f"Access denied: UserID='{current_user_id}' attempted to access PortfolioID='{portfolio_id}' owned by UserID='{portfolio.user_id}'. Source IP: {request.remote_addr}")
            raise AccessDeniedError(message="User does not have permission to access this portfolio.")

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
        raise BadRequestError(message=error_msg)

    # 2. Check if all asset IDs in the payload belong to the portfolio (Set comparison)
    if payload_asset_ids != portfolio_asset_ids:
        missing_from_payload = portfolio_asset_ids - payload_asset_ids
        extra_in_payload = payload_asset_ids - portfolio_asset_ids
        error_msg = "Asset IDs in payload do not exactly match assets in portfolio."
        current_app.logger.warning(f"Validation Error: {error_msg} Missing: {missing_from_payload}, Extra: {extra_in_payload}")
        full_error_msg = f"{error_msg} Missing: {list(missing_from_payload)}, Extra: {list(extra_in_payload)}"
        raise BadRequestError(message=full_error_msg)

    # 3. Double check sum (already done by schema, but belt and braces)
    total_percentage = sum(item.allocation_percentage for item in allocation_data)
    current_app.logger.debug(f"Validation - Calculated total percentage: {total_percentage}")
    if not (Decimal('99.99') <= total_percentage <= Decimal('100.01')):
         # This case should ideally be caught by the schema validator
         error_msg = f"Internal check failed: Total allocation must be 100%. Received: {total_percentage:.2f}%"
         current_app.logger.error(f"Validation Error: {error_msg}") # Log as error if schema missed it
         raise BadRequestError(message=error_msg)


# --- Portfolio Routes (Task 5.3) ---

@portfolios_bp.route('/hello', methods=['GET'])
def debug_hello():
    return jsonify({"msg": "Hello from portfolios"}), 200

@portfolios_bp.route('/headers', methods=['GET'])
def debug_headers():
    headers = {k: v for k, v in request.headers.items()}
    current_app.logger.debug(f"Incoming headers: {headers}")
    return jsonify(headers), 200

# Pydantic model for query parameters for get_user_portfolios
class PortfolioQueryArgs(BaseModel):
    page: int = Field(1, ge=1, description="Page number for pagination.")
    per_page: int = Field(10, ge=1, le=100, description="Number of items per page.")
    sort_by: str = Field('created_at', description="Field to sort by. Allowed values: name, created_at, updated_at.")
    sort_order: str = Field('desc', description="Sort order. Allowed values: asc, desc.")
    filter_name: Optional[str] = Field(None, min_length=1, max_length=100, description="Filter portfolios by name (case-insensitive, partial match).")

    @field_validator('sort_by')
    @classmethod
    def validate_sort_by(cls, value):
        allowed_fields = ['name', 'created_at', 'updated_at']
        if value not in allowed_fields:
            raise ValueError(f"Invalid sort_by field. Allowed fields: {', '.join(allowed_fields)}")
        return value

    @field_validator('sort_order')
    @classmethod
    def validate_sort_order(cls, value):
        allowed_orders = ['asc', 'desc']
        if value.lower() not in allowed_orders:
            raise ValueError("Invalid sort_order. Allowed values: asc, desc")
        return value.lower()

@portfolios_bp.route('/', methods=['GET'])
@jwt_required()
def get_user_portfolios():
    """Retrieves a list of portfolios belonging to the authenticated user,
    with support for pagination, sorting, and filtering."""
    current_user_id = int(get_jwt_identity())

    # Collect present query parameters
    request_args = {}
    if 'page' in request.args:
        request_args['page'] = request.args.get('page')
    if 'per_page' in request.args:
        request_args['per_page'] = request.args.get('per_page')
    if 'sort_by' in request.args:
        request_args['sort_by'] = request.args.get('sort_by')
    if 'sort_order' in request.args:
        request_args['sort_order'] = request.args.get('sort_order')
    if 'filter_name' in request.args:
        request_args['filter_name'] = request.args.get('filter_name')
        # Handle empty string for filter_name as None if necessary, or let Pydantic handle it
        if request_args['filter_name'] == '':
            request_args['filter_name'] = None


    # Parse and validate query parameters
    try:
        query_params = PortfolioQueryArgs(**request_args)
    except ValueError as e: # Handles Pydantic validation errors
        # It's better to return Pydantic's structured errors
        current_app.logger.warning(f"PortfolioQueryArgs validation failed for user {current_user_id}: {e.errors()}")
        return jsonify({"errors": e.errors()}), 400

    # Base query - Add selectinload for assets
    query = Portfolio.query.options(selectinload(Portfolio.assets)).filter_by(user_id=current_user_id)

    # Apply filtering
    if query_params.filter_name:
        query = query.filter(Portfolio.name.ilike(f"%{query_params.filter_name}%"))

    # Apply sorting
    sort_column = getattr(Portfolio, query_params.sort_by, Portfolio.created_at)
    if query_params.sort_order == 'asc':
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    # Apply pagination
    pagination = query.paginate(
        page=query_params.page,
        per_page=query_params.per_page,
        error_out=False
    )
    
    portfolios = pagination.items
    # Use PortfolioSummarySchema for the list view
    result = [PortfolioSummarySchema.from_orm(p).model_dump(mode='json', by_alias=True) for p in portfolios]

    return jsonify({
        "data": result,
        "pagination": {
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total_pages": pagination.pages,
            "total_items": pagination.total,
            "next_page": pagination.next_num,
            "prev_page": pagination.prev_num,
            "has_next": pagination.has_next,
            "has_prev": pagination.has_prev
        }
    }), 200

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
        raise ApplicationException(message=f"An internal error occurred while updating allocations: {e}", status_code=500, logging_level="exception")