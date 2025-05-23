"""
Blueprint for handling portfolio-related CRUD operations and bulk updates.

This blueprint manages portfolios, including their creation, retrieval,
update, and deletion. It also provides an endpoint for bulk updating
asset allocations within a portfolio. All routes are prefixed with
`/api/v1/portfolios` and require JWT authentication and ownership verification.
"""
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
    BulkAllocationUpdateSchema, PortfolioSummarySchema, AssetAllocationSchema # Import the new summary schema
)

# Import custom exceptions
from app.utils.exceptions import (
    ApplicationException, PortfolioNotFoundError, AccessDeniedError, BadRequestError
)

# Define the blueprint: 'portfolios', with a URL prefix /api/v1/portfolios
portfolios_bp = Blueprint('portfolios', __name__, url_prefix='/api/v1/portfolios')

# --- Decorators ---

# Note: This decorator assumes @jwt_required() has already been applied to the route
# ensuring that `get_jwt_identity()` will return a valid user ID.
def verify_portfolio_ownership(f):
    """Decorator: Fetches a portfolio by ID and verifies user ownership.

    It expects `portfolio_id` to be a keyword argument in the route.
    If ownership is verified, the fetched `portfolio` object (with assets
    eagerly loaded) is injected into the wrapped function's `kwargs`.

    Handles OPTIONS requests by allowing them to pass through, assuming
    Flask-CORS or similar will manage preflight responses.

    Raises:
        ApplicationException: If `portfolio_id` is missing (developer error),
                              or if JWT identity is invalid.
        PortfolioNotFoundError: If the portfolio doesn't exist.
        AccessDeniedError: If the current user does not own the portfolio.
    """
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        # Bypass ownership check for OPTIONS preflight requests.
        # Flask-CORS and Flask-JWT-Extended should handle these.
        if request.method == 'OPTIONS':
            # current_app.make_default_options_response() might be too early if the
            # route itself has an OPTIONS handler or specific CORS setup.
            # Letting it pass to the route function which then relies on Flask-CORS is often safer.
            # If the route *doesn't* have an OPTIONS method, then this is appropriate:
            # return current_app.make_default_options_response()
            # For now, we assume routes with OPTIONS will handle it, or global CORS applies.
            # Thus, for OPTIONS, we might just call the function directly if no further processing is needed here.
            # However, the current structure implies this decorator runs *before* the route's own method check.
            # A common pattern is to have OPTIONS handled by global CORS or a specific OPTIONS route.
            # If this decorator is applied to a route without OPTIONS, this check is fine.
            # If applied to a route *with* OPTIONS, the route's handler should execute.
            # The most robust way is to let OPTIONS requests proceed to be handled by Flask/CORS mechanisms.
            # This decorator should primarily focus on non-OPTIONS methods for ownership.
             return f(*args, **kwargs) # Let OPTIONS pass through to be handled by Flask/CORS

        # For non-OPTIONS requests, proceed with ownership verification.
        user_id_str = get_jwt_identity() # Assumes @jwt_required was used.
        if user_id_str is None:
            # This case should ideally be caught by @jwt_required itself.
            current_app.logger.error(
                f"verify_portfolio_ownership: User identity not found even after @jwt_required. "
                f"Method: {request.method}, Path: {request.path}. This might indicate a configuration issue."
            )
            # Return 401 as per standard for missing/invalid JWT.
            # Replace abort with ApplicationException for consistency with custom error handling.
            raise ApplicationException(message="Authentication required; user identity not found.", status_code=401, logging_level="error")
        
        try:
            current_user_id = int(user_id_str)
        except (ValueError, TypeError):
            current_app.logger.warning(f"Invalid user identity format in JWT: '{user_id_str}'. IP: {request.remote_addr}")
            raise ApplicationException("Invalid user identity format in token.", status_code=401, logging_level="warning")

        portfolio_id = kwargs.get('portfolio_id')
        if portfolio_id is None:
            # This is a developer error - the route using this decorator must provide portfolio_id.
            current_app.logger.error("Developer error: verify_portfolio_ownership used on a route without 'portfolio_id' in kwargs.")
            raise ApplicationException("Server configuration error: portfolio_id missing for ownership check.", status_code=500)

        # Eagerly load assets along with the portfolio to reduce subsequent queries if assets are needed.
        # `joinedload` is generally efficient for one-to-many if the related items are usually accessed.
        portfolio = Portfolio.query.options(
            db.joinedload(Portfolio.assets), # Eager load assets
            # db.joinedload(Portfolio.planned_changes) # Optionally eager load changes if frequently needed
        ).get(portfolio_id)

        if portfolio is None:
            raise PortfolioNotFoundError(message=f"Portfolio with ID {portfolio_id} not found.")

        if portfolio.user_id != current_user_id:
            current_app.logger.warning(
                f"Access Denied: UserID='{current_user_id}' attempted to access PortfolioID='{portfolio_id}' "
                f"owned by UserID='{portfolio.user_id}'. Source IP: {request.remote_addr}"
            )
            raise AccessDeniedError(message="You do not have permission to access this portfolio.")

        kwargs['portfolio'] = portfolio # Inject the fetched portfolio into the route handler.
        return f(*args, **kwargs)
    return wrapper


# --- Helper Functions ---

def _validate_bulk_allocation_data(portfolio: Portfolio, 
                                   allocation_data: list[AssetAllocationSchema], 
                                   app_logger):
    """Validates data for bulk updating asset allocations within a portfolio.

    Ensures:
    1. The number of assets in the payload matches the number in the portfolio.
    2. All asset IDs in the payload correspond to assets actually in the portfolio.
    3. The sum of allocation percentages is approximately 100%. (Secondary check, schema should catch primary)

    Args:
        portfolio (Portfolio): The portfolio instance being updated.
        allocation_data (list): A list of allocation items (asset_id, allocation_percentage)
                                from the validated request schema.
        app_logger: The Flask current_app.logger instance for logging.

    Raises:
        BadRequestError: If any validation rule is violated.
    """
    app_logger.debug(f"Starting bulk allocation validation for PortfolioID '{portfolio.portfolio_id}'.")

    portfolio_asset_ids = {asset.asset_id for asset in portfolio.assets}
    payload_asset_ids = {item.asset_id for item in allocation_data}

    app_logger.debug(f"Portfolio Asset IDs: {portfolio_asset_ids}")
    app_logger.debug(f"Payload Asset IDs: {payload_asset_ids}")

    # 1. Check for mismatched number of assets.
    if len(portfolio_asset_ids) != len(payload_asset_ids):
        error_msg = (
            f"Payload must include allocation for all {len(portfolio_asset_ids)} assets "
            f"currently in the portfolio. Received {len(payload_asset_ids)}."
        )
        app_logger.warning(f"Validation Error (PortfolioID '{portfolio.portfolio_id}'): {error_msg}")
        raise BadRequestError(message=error_msg)

    # 2. Check if asset IDs in payload exactly match those in the portfolio.
    if payload_asset_ids != portfolio_asset_ids:
        missing_from_payload = portfolio_asset_ids - payload_asset_ids
        extra_in_payload = payload_asset_ids - portfolio_asset_ids
        error_parts = []
        if missing_from_payload:
            error_parts.append(f"Missing from payload: {list(missing_from_payload)}")
        if extra_in_payload:
            error_parts.append(f"Extra in payload: {list(extra_in_payload)}")
        full_error_msg = f"Asset IDs in payload do not exactly match assets in portfolio. {'; '.join(error_parts)}"
        app_logger.warning(f"Validation Error (PortfolioID '{portfolio.portfolio_id}'): {full_error_msg}")
        raise BadRequestError(message=full_error_msg)

    # 3. Verify sum of percentages (primarily as a safeguard; schema should enforce this).
    # Using Decimal for precision with financial calculations.
    total_percentage = sum(item.allocation_percentage for item in allocation_data)
    app_logger.debug(f"Calculated total allocation percentage: {total_percentage}")
    # Allow for minor floating point inaccuracies if schema uses float, though Decimal is preferred.
    if not (Decimal('99.99') <= total_percentage <= Decimal('100.01')):
         # This indicates an issue if the schema (BulkAllocationUpdateSchema) didn't catch it.
         error_msg = f"Total allocation percentage must be 100%. Received: {total_percentage:.2f}%."
         app_logger.error(f"Internal Validation Error (PortfolioID '{portfolio.portfolio_id}'): {error_msg} - Schema validator might need review.")
         raise BadRequestError(message=error_msg)
    app_logger.debug(f"Bulk allocation data validated successfully for PortfolioID '{portfolio.portfolio_id}'.")


# --- Portfolio Routes ---
# These include debug routes and CRUD operations for portfolios.

@portfolios_bp.route('/hello', methods=['GET'])
def debug_hello():
    """A simple debug endpoint to confirm the portfolio blueprint is active."""
    current_app.logger.info("Debug hello route accessed.")
    return jsonify({"message": "Hello from the portfolios blueprint!"}), 200

@portfolios_bp.route('/headers', methods=['GET'])
def debug_headers():
    """Debug endpoint to inspect request headers. Useful for Nginx/proxy debugging."""
    headers_dict = {k: v for k, v in request.headers.items()}
    current_app.logger.debug(f"Debug headers route accessed. Headers: {headers_dict}")
    return jsonify(headers_dict), 200

# Pydantic model for parsing and validating query parameters for the portfolio list endpoint.
class PortfolioQueryArgs(BaseModel):
    """Defines and validates query parameters for listing portfolios."""
    page: int = Field(1, ge=1, description="Page number for pagination, starting from 1.")
    per_page: int = Field(10, ge=1, le=100, description="Number of items per page (1-100).")
    sort_by: str = Field('created_at', description="Field to sort by. Allowed: 'name', 'created_at', 'updated_at'.")
    sort_order: str = Field('desc', description="Sort order. Allowed: 'asc', 'desc'.")
    filter_name: Optional[str] = Field(None, min_length=1, max_length=100, 
                                       description="Filter portfolios by name (case-insensitive, partial match).")

    @field_validator('sort_by')
    @classmethod
    def validate_sort_by_field(cls, value: str) -> str:
        """Validates that sort_by is one of the allowed field names."""
        allowed_fields = ['name', 'created_at', 'updated_at']
        if value not in allowed_fields:
            raise ValueError(f"Invalid 'sort_by' field. Allowed fields are: {', '.join(allowed_fields)}.")
        return value

    @field_validator('sort_order')
    @classmethod
    def validate_sort_order_value(cls, value: str) -> str:
        """Validates that sort_order is either 'asc' or 'desc'."""
        allowed_orders = ['asc', 'desc']
        if value.lower() not in allowed_orders:
            raise ValueError("Invalid 'sort_order' value. Allowed values are: 'asc', 'desc'.")
        return value.lower()

@portfolios_bp.route('/', methods=['GET'])
@jwt_required() # User must be authenticated
def get_user_portfolios():
    """Retrieves a paginated, sorted, and filtered list of portfolios for the authenticated user.

    Query Parameters:
        page (int): Page number (default: 1).
        per_page (int): Items per page (default: 10, max: 100).
        sort_by (str): Field to sort by ('name', 'created_at', 'updated_at'; default: 'created_at').
        sort_order (str): Sort order ('asc', 'desc'; default: 'desc').
        filter_name (str): Filter by portfolio name (case-insensitive partial match).

    Returns:
        JSON response with a list of portfolio summaries and pagination details.
    """
    current_user_id = int(get_jwt_identity())
    current_app.logger.info(f"Fetching portfolios for UserID '{current_user_id}' with args: {request.args}")

    # Collect query parameters from request.args, handling potential absence.
    # Pydantic will use default values if a parameter is not provided.
    request_args_dict = {
        key: request.args.get(key) for key in PortfolioQueryArgs.model_fields.keys() if request.args.get(key) is not None
    }
    # Ensure empty filter_name is treated as None by Pydantic if that's desired behavior.
    if 'filter_name' in request_args_dict and not request_args_dict['filter_name']:
        del request_args_dict['filter_name'] # Or set to None if Pydantic model expects Optional[str] = None

    try:
        # Validate query parameters using the Pydantic model.
        query_params = PortfolioQueryArgs(**request_args_dict)
    except ValueError as e: # Catches Pydantic validation errors (ValidationError)
        current_app.logger.warning(
            f"Invalid query parameters for UserID '{current_user_id}': {e.errors()}. Request args: {request.args}"
        )
        # Return Pydantic's structured error messages.
        # This is a direct jsonify response that could potentially be standardized if
        # a specific PydanticValidationError custom exception was caught by handle_api_errors.
        # For now, this is acceptable as Pydantic's e.errors() is already structured.
        # However, to fully align with raising exceptions, one might create a
        # PydanticValidationErr(messages=e.errors()) and let handle_api_errors format it.
        # Current approach: Keep as is, but note for future refactoring if stricter standardization is needed.
        raise BadRequestError(message="Invalid query parameters.", details=e.errors())

    # Construct the base query, filtering by the current user.
    # Eagerly load 'assets' for PortfolioSummarySchema's total_value calculation.
    query = Portfolio.query.options(selectinload(Portfolio.assets)).filter_by(user_id=current_user_id)

    # Apply name filtering if provided.
    if query_params.filter_name:
        query = query.filter(Portfolio.name.ilike(f"%{query_params.filter_name}%"))

    # Determine sort column and order.
    sort_column = getattr(Portfolio, query_params.sort_by, Portfolio.created_at) # Default to created_at if invalid somehow
    order_func = asc if query_params.sort_order == 'asc' else desc
    query = query.order_by(order_func(sort_column))

    # Execute paginated query.
    pagination_obj = query.paginate(
        page=query_params.page,
        per_page=query_params.per_page,
        error_out=False # Returns empty list if page is out of range, rather than 404.
    )
    
    portfolios_list = pagination_obj.items
    # Serialize using PortfolioSummarySchema for a concise list view.
    # `from_orm` is for Pydantic v1. For v2, use `model_validate`.
    # Assuming OrmBaseModel sets `from_attributes = True`.
    serialized_portfolios = [
        PortfolioSummarySchema.from_orm(p).model_dump(mode='json', by_alias=True) for p in portfolios_list
    ]

    current_app.logger.info(f"Returning {len(serialized_portfolios)} portfolios for UserID '{current_user_id}' on page {query_params.page}.")
    return jsonify({
        "data": serialized_portfolios,
        "pagination": {
            "page": pagination_obj.page,
            "per_page": pagination_obj.per_page,
            "total_pages": pagination_obj.pages,
            "total_items": pagination_obj.total,
            "next_page": pagination_obj.next_num,
            "prev_page": pagination_obj.prev_num,
            "has_next": pagination_obj.has_next,
            "has_prev": pagination_obj.has_prev
        }
    }), 200

@portfolios_bp.route('/', methods=['POST'])
@jwt_required()
@handle_api_errors(schema=PortfolioCreateSchema) # Handles validation, commit, rollback
def create_portfolio(validated_data: PortfolioCreateSchema):
    """Creates a new portfolio for the authenticated user.

    The request body must conform to `PortfolioCreateSchema`.

    Args:
        validated_data (PortfolioCreateSchema): Validated data from the request,
                                                injected by `handle_api_errors`.
    Returns:
        JSON response with the newly created portfolio data (PortfolioSchema) and 201 status.
    """
    current_user_id = int(get_jwt_identity())
    current_app.logger.info(f"Creating new portfolio for UserID '{current_user_id}' with data: {validated_data.model_dump()}")

    new_portfolio = Portfolio(
        user_id=current_user_id,
        **validated_data.model_dump() # Use Pydantic's model_dump for validated data
    )
    db.session.add(new_portfolio)
    # `handle_api_errors` decorator will handle db.session.commit() and db.session.refresh(new_portfolio).
    # If refresh is needed before serialization here (e.g., to get default DB values not set by app),
    # then flush might be used: db.session.flush(). However, decorator handles commit.
    
    # Note: `db.session.refresh(new_portfolio)` would typically be called *after* commit
    # if the object needs to be updated with DB-generated values (like auto-increment IDs or defaults).
    # The `handle_api_errors` decorator should manage this if configured to do so, or it can be done here
    # if the decorator only handles commit/rollback. Assuming decorator handles refresh if necessary.
    # For this example, explicit refresh is removed, relying on decorator or ORM state.
    # If ID is needed before commit, flush: db.session.flush()

    current_app.logger.info(f"Portfolio '{new_portfolio.name}' (ID pending commit) created for UserID '{current_user_id}'.")
    # `PortfolioSchema.from_orm(new_portfolio)` or `PortfolioSchema.model_validate(new_portfolio)`
    return jsonify(PortfolioSchema.from_orm(new_portfolio).model_dump(mode='json', by_alias=True)), 201

@portfolios_bp.route('/<int:portfolio_id>/', methods=['GET'])
@jwt_required()
@verify_portfolio_ownership # Verifies ownership and injects 'portfolio'
def get_portfolio_details(portfolio_id: int, portfolio: Portfolio):
    """Retrieves detailed information for a specific portfolio.

    Supports an 'include' query parameter to control the level of detail:
    - 'summary': Only portfolio fields (no assets or planned changes).
    - 'assets': Portfolio fields and associated assets.
    - 'changes': Portfolio fields and associated planned changes.
    - 'full' (default): Portfolio fields, assets, and planned changes.

    Args:
        portfolio_id (int): The ID of the portfolio (from URL).
        portfolio (Portfolio): The portfolio object, injected by `verify_portfolio_ownership`.

    Returns:
        JSON response with portfolio details (PortfolioSchema) and 200 status.
    """
    current_app.logger.info(f"Fetching details for PortfolioID '{portfolio_id}' for UserID '{portfolio.user_id}'.")
    # `verify_portfolio_ownership` already eagerly loaded `assets`.
    # We might need to load `planned_changes` if not already loaded and requested.

    include_param = request.args.get('include', 'full').lower()
    valid_includes = {'summary', 'assets', 'changes', 'full'}
    if include_param not in valid_includes:
        current_app.logger.warning(f"Invalid 'include' parameter '{include_param}'. Defaulting to 'full'.")
        include_param = 'full'
    
    # Dynamically load relationships if not already loaded by verify_portfolio_ownership or if specifically requested.
    # `verify_portfolio_ownership` loads `assets`. We need to ensure `planned_changes` is loaded if 'changes' or 'full'.
    options_to_load = []
    if include_param in ['changes', 'full'] and 'planned_changes' not in portfolio.__dict__: # Check if not loaded
        options_to_load.append(db.joinedload(Portfolio.planned_changes))
    
    if options_to_load:
        # Re-fetch or refresh the portfolio with additional eager loads if necessary.
        # Expiring current attributes that might be collections ensures they are reloaded.
        db.session.expire(portfolio, ['assets', 'planned_changes']) # Expire collections to force reload
        refreshed_portfolio = Portfolio.query.options(*options_to_load).get(portfolio_id)
        if not refreshed_portfolio: # Should not happen if verify_portfolio_ownership passed
             raise PortfolioNotFoundError(f"Portfolio with ID {portfolio_id} not found after refresh.")
        portfolio_to_serialize = refreshed_portfolio
    else:
        portfolio_to_serialize = portfolio

    # Determine fields to exclude based on 'include' parameter for serialization.
    exclude_fields = set()
    if include_param == 'summary':
        exclude_fields.update(['assets', 'planned_changes'])
    elif include_param == 'assets': # Already loaded by verify_portfolio_ownership
        exclude_fields.add('planned_changes')
    elif include_param == 'changes': # Needs planned_changes, exclude assets if not also requested by 'full'
        exclude_fields.add('assets')
    # 'full' means no exclusions from this list.
    
    current_app.logger.debug(f"Serializing PortfolioID '{portfolio_id}' with include='{include_param}', excluding: {exclude_fields}")
    return jsonify(
        PortfolioSchema.from_orm(portfolio_to_serialize).model_dump(
            mode='json',
            by_alias=True,
            exclude=exclude_fields if exclude_fields else None # Pydantic expects None for no exclusions
        )
    ), 200

@portfolios_bp.route('/<int:portfolio_id>/', methods=['PUT', 'PATCH'])
@jwt_required()
@verify_portfolio_ownership # Verifies ownership, injects 'portfolio'
@handle_api_errors(schema=PortfolioUpdateSchema) # Validates, commits, rollbacks
def update_portfolio(portfolio_id: int, portfolio: Portfolio, validated_data: PortfolioUpdateSchema):
    """Updates specified details for a portfolio.

    Request body must conform to `PortfolioUpdateSchema`. Only fields present
    in the request (and allowed by the schema) will be updated.

    Args:
        portfolio_id (int): The ID of the portfolio (from URL).
        portfolio (Portfolio): The portfolio object, injected by `verify_portfolio_ownership`.
        validated_data (PortfolioUpdateSchema): Validated data, injected by `handle_api_errors`.

    Returns:
        JSON response with the updated portfolio data (PortfolioSchema) and 200 status.
    """
    current_app.logger.info(f"Updating PortfolioID '{portfolio_id}' for UserID '{portfolio.user_id}'.")
    
    # Iterate over validated data fields and update the portfolio object.
    # `exclude_unset=True` ensures only fields actually provided in the request are iterated.
    update_data_dict = validated_data.model_dump(exclude_unset=True)
    for key, value in update_data_dict.items():
         setattr(portfolio, key, value)
    current_app.logger.debug(f"PortfolioID '{portfolio_id}' updated fields: {update_data_dict.keys()}")

    # `handle_api_errors` decorator will handle db.session.commit().
    # Serialization uses the current state of the 'portfolio' object.
    return jsonify(PortfolioSchema.from_orm(portfolio).model_dump(mode='json', by_alias=True)), 200

@portfolios_bp.route('/<int:portfolio_id>/', methods=['DELETE'])
@jwt_required()
@verify_portfolio_ownership # Verifies ownership, injects 'portfolio'
@handle_api_errors() # Manages commit/rollback for the delete operation
def delete_portfolio(portfolio_id: int, portfolio: Portfolio):
    """Deletes a specific portfolio and its associated assets and planned changes (due to cascade).

    Args:
        portfolio_id (int): The ID of the portfolio (from URL).
        portfolio (Portfolio): The portfolio object, injected by `verify_portfolio_ownership`.

    Returns:
        JSON response with a success message and a 200 status code.
    """
    current_app.logger.info(f"Deleting PortfolioID '{portfolio_id}' for UserID '{portfolio.user_id}'.")
    db.session.delete(portfolio)
    # `handle_api_errors` decorator will handle db.session.commit().
    return jsonify({"message": f"Portfolio with ID {portfolio_id} and all its associated data deleted successfully."}), 200

# --- Bulk Allocation Update Route ---

@portfolios_bp.route('/<int:portfolio_id>/allocations/', methods=['PUT', 'OPTIONS']) # Added OPTIONS
@jwt_required() # Ensure user is logged in for non-OPTIONS
@verify_portfolio_ownership # Verifies ownership, injects 'portfolio'
@handle_api_errors(schema=BulkAllocationUpdateSchema) # Validates request body, handles commit/rollback
def update_allocations(portfolio_id: int, portfolio: Portfolio, validated_data: BulkAllocationUpdateSchema):
    """Updates allocation percentages for all assets within a specific portfolio.

    The request body must conform to `BulkAllocationUpdateSchema`, containing a list
    of all assets in the portfolio with their new `allocation_percentage`.
    This operation sets `allocation_value` to None for all updated assets.

    Args:
        portfolio_id (int): The ID of the portfolio (from URL).
        portfolio (Portfolio): The portfolio object, injected by `verify_portfolio_ownership`.
                               Its `assets` collection is used for validation.
        validated_data (BulkAllocationUpdateSchema): Validated data, including the list of
                                                     allocations, injected by `handle_api_errors`.
    Returns:
        JSON response with a success message and a 200 status code.
    Raises:
        BadRequestError: If validation of allocation data fails (e.g., asset mismatch, sum not 100%).
        ApplicationException: For internal errors during the update process.
    """
    # OPTIONS requests are handled by Flask implicitly or by a global CORS setup.
    # If verify_portfolio_ownership or jwt_required block OPTIONS, they need adjustment
    # or this route needs a specific OPTIONS handler if not covered globally.
    # The verify_portfolio_ownership decorator was updated to allow OPTIONS to pass through.
    
    current_app.logger.info(f"Bulk update allocations request for PortfolioID '{portfolio_id}' (UserID '{portfolio.user_id}').")
    allocation_items_list = validated_data.allocations # This is List[AllocationItem]
    current_app.logger.debug(f"Validated allocation items received: {allocation_items_list}")

    # Perform detailed validation of the allocation data against the current portfolio state.
    _validate_bulk_allocation_data(portfolio, allocation_items_list, current_app.logger)
    current_app.logger.info(f"Allocation data validated for PortfolioID '{portfolio_id}'. Proceeding with update.")

    # --- Database Update ---
    # Map existing assets by ID for quick lookup and update.
    assets_in_portfolio_map = {asset.asset_id: asset for asset in portfolio.assets}
    
    updated_asset_ids = []
    for item_data in allocation_items_list:
        asset_to_update = assets_in_portfolio_map.get(item_data.asset_id)
        # This check is technically redundant due to _validate_bulk_allocation_data,
        # but good for defense in depth.
        if not asset_to_update:
             current_app.logger.error(
                 f"Consistency Error for PortfolioID '{portfolio_id}': AssetID '{item_data.asset_id}' from validated "
                 f"payload not found in portfolio's assets during update phase. This should have been caught earlier."
             )
             # Raise an exception that will be caught by `handle_api_errors` for rollback.
             raise ApplicationException(
                 message=f"Internal error: Asset ID {item_data.asset_id} mismatch during update.",
                 status_code=500, logging_level="error" # Log as error
             )
        
        asset_to_update.allocation_percentage = item_data.allocation_percentage
        asset_to_update.allocation_value = None # Explicitly nullify fixed value when percentage is set.
        updated_asset_ids.append(asset_to_update.asset_id)
        current_app.logger.debug(
            f"  PortfolioID '{portfolio_id}', AssetID '{asset_to_update.asset_id}': "
            f"Set allocation_percentage to {item_data.allocation_percentage}, allocation_value to None."
        )

    # `handle_api_errors` decorator will handle db.session.commit().
    current_app.logger.info(
        f"Successfully updated allocations for assets {updated_asset_ids} in PortfolioID '{portfolio_id}'. "
        "Changes queued for commit."
    )
    return jsonify({"message": "Allocations for all assets updated successfully."}), 200