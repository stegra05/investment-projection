"""
Blueprint for handling planned future change-related routes.

This blueprint manages CRUD operations for planned future changes, which are
always nested under a specific portfolio. For example, to add a change, the
endpoint would be /api/v1/portfolios/<portfolio_id>/changes/.
Portfolio ownership is verified for all change operations.
"""
from flask import Blueprint, jsonify, abort
from app import db
from app.models import Portfolio, PlannedFutureChange # Keep Portfolio for type hint
from app.routes.portfolios import verify_portfolio_ownership # Import decorator
from app.utils.decorators import handle_api_errors
from flask_jwt_extended import jwt_required # Import jwt_required
from app.schemas.portfolio_schemas import ( # Import relevant schemas
    PlannedChangeSchema, PlannedChangeCreateSchema, PlannedChangeUpdateSchema
)
from app.utils.helpers import get_owned_child_or_404 # Import the new helper

# Import custom exceptions
from app.utils.exceptions import PlannedChangeNotFoundError, BadRequestError

# Define the blueprint: 'changes'.
# The URL prefix (e.g., /portfolios/<int:portfolio_id>/changes) is defined
# when this blueprint is registered in app/__init__.py.
changes_bp = Blueprint('changes', __name__)

# --- Helper Function (Deprecated) ---
# The get_change_or_404 helper is kept here for historical context or if direct use is ever needed,
# but primary fetching is now done by get_owned_child_or_404 for consistency in routes.
def get_change_or_404(portfolio: Portfolio, change_id: int) -> PlannedFutureChange:
     """DEPRECATED: Gets a planned change by ID within a portfolio.
     
     Prefer using `get_owned_child_or_404` in route handlers.
     Checks eagerly loaded changes first, then falls back to a direct query.

     Args:
         portfolio (Portfolio): The parent portfolio instance.
         change_id (int): The ID of the planned change to retrieve.

     Returns:
         PlannedFutureChange: The found planned change object.

     Raises:
         PlannedChangeNotFoundError: If the change is not found.
     """
     # Attempt to find in already loaded changes (if portfolio was loaded with its changes)
     for change_obj in portfolio.planned_changes: # Assumes relationship name is 'planned_changes'
        if change_obj.change_id == change_id:
            return change_obj
     # Fallback: Query the database directly if not found in preloaded list
     change_fallback = PlannedFutureChange.query.filter_by(
         portfolio_id=portfolio.portfolio_id, 
         change_id=change_id
     ).first()
     if change_fallback is None:
        raise PlannedChangeNotFoundError(
            message=f"Planned change with id {change_id} not found within portfolio {portfolio.portfolio_id}."
        )
     return change_fallback

# --- Planned Future Change Routes ---
# These routes operate on planned changes within a specific portfolio.
# `portfolio_id` is from the URL. `verify_portfolio_ownership` injects `portfolio`.
# `handle_api_errors` manages validation and DB transaction lifecycle.

@changes_bp.route('/', methods=['OPTIONS']) # Endpoint: /portfolios/<pid>/changes/ (OPTIONS for POST)
def add_planned_change_options(portfolio_id: int):
    """Handles OPTIONS preflight requests for creating planned changes.
    
    Flask-CORS, if globally configured, usually handles this automatically.
    Explicitly defining an OPTIONS handler can be useful for specific middleware
    or if global CORS doesn't cover all cases.

    Args:
        portfolio_id (int): The ID of the portfolio (unused in this handler, but part of the route).
    """
    # Typically, Flask-CORS (if used) would add necessary Access-Control-* headers.
    # This route confirms the endpoint is available for POST.
    return jsonify(message="Preflight for creating planned changes is OK."), 200

@changes_bp.route('/', methods=['POST']) # Endpoint: /portfolios/<pid>/changes/
@jwt_required()
@verify_portfolio_ownership # Ensures user owns the portfolio, injects 'portfolio'
@handle_api_errors(schema=PlannedChangeCreateSchema) # Validates request against PlannedChangeCreateSchema
def add_planned_change(portfolio_id: int, portfolio: Portfolio, validated_data: PlannedChangeCreateSchema):
    """Adds a new planned future change to the specified portfolio.

    Request body must conform to `PlannedChangeCreateSchema`.

    Args:
        portfolio_id (int): The ID of the portfolio (from URL).
        portfolio (Portfolio): The portfolio object, injected by `verify_portfolio_ownership`.
        validated_data (PlannedChangeCreateSchema): Validated data, injected by `handle_api_errors`.

    Returns:
        JSON response with the new planned change data (PlannedChangeSchema) and 201 status.
    """
    # Create the new PlannedFutureChange instance
    new_change = PlannedFutureChange(
        portfolio_id=portfolio.portfolio_id, # Set portfolio_id from the verified portfolio
        **validated_data.model_dump() # Unpack other validated data
    )
    db.session.add(new_change)
    db.session.flush() # Flush to assign `change_id` to `new_change` before serialization
    
    # Commit is handled by the `handle_api_errors` decorator.
    # Serialization uses `from_orm` (now `model_validate` in Pydantic v2 context if schemas inherit from OrmBaseModel)
    return jsonify(PlannedChangeSchema.from_orm(new_change).model_dump(mode='json', by_alias=True)), 201

@changes_bp.route('/<int:change_id>/', methods=['OPTIONS']) # Endpoint: /portfolios/<pid>/changes/<cid>/ (OPTIONS for PUT, PATCH, DELETE)
def update_planned_change_options(portfolio_id: int, change_id: int):
    """Handles OPTIONS preflight requests for specific planned changes.

    Args:
        portfolio_id (int): The ID of the portfolio.
        change_id (int): The ID of the planned change.
    """
    return jsonify(message="Preflight for specific planned change is OK."), 200

@changes_bp.route('/<int:change_id>/', methods=['PUT', 'PATCH']) # Endpoint: /portfolios/<pid>/changes/<cid>/
@jwt_required()
@verify_portfolio_ownership
@handle_api_errors(schema=PlannedChangeUpdateSchema) # Validates request against PlannedChangeUpdateSchema
def update_planned_change(portfolio_id: int, change_id: int, portfolio: Portfolio, validated_data: PlannedChangeUpdateSchema):
    """Updates an existing planned future change within the specified portfolio.

    Request body must conform to `PlannedChangeUpdateSchema`. Only fields present
    in the request are updated. Includes post-update consistency checks.

    Args:
        portfolio_id (int): The ID of the portfolio (from URL).
        change_id (int): The ID of the planned change to update (from URL).
        portfolio (Portfolio): The portfolio object, injected by `verify_portfolio_ownership`.
        validated_data (PlannedChangeUpdateSchema): Validated data, injected by `handle_api_errors`.

    Returns:
        JSON response with updated planned change data (PlannedChangeSchema) and 200 status.
    Raises:
        BadRequestError: If post-update consistency checks fail (e.g., 'amount' missing for 'Contribution').
    """
    change = get_owned_child_or_404(
        parent_instance=portfolio,
        child_relationship_name='planned_changes', # Relationship attribute on Portfolio model
        child_id=change_id,
        child_model=PlannedFutureChange,
        child_pk_attr='change_id' # Primary key attribute on PlannedFutureChange model
    )
    
    update_data = validated_data.model_dump(exclude_unset=True) # Get only provided fields

    # Apply updates to the model instance
    for key, value in update_data.items():
        setattr(change, key, value)

    # Post-update consistency validation (business logic specific to change types)
    # This ensures that the change remains valid after partial updates.
    # For example, if `change_type` is updated to 'Contribution', an 'amount' must exist.
    if change.change_type in ['Contribution', 'Withdrawal'] and change.amount is None:
        # This could also be handled by a Pydantic schema validator if the entire object state
        # were re-validated post-update, but here it's a specific business rule check.
        raise BadRequestError(message=f"A change of type '{change.change_type.value}' requires an 'amount'.")
    if change.change_type == 'Reallocation' and change.amount is not None:
        # Reallocations are defined by target_allocation_json, not a single amount.
        raise BadRequestError(message="A 'Reallocation' change type should not include an 'amount'. Consider setting amount to null or removing it.")

    # Commit is handled by `handle_api_errors`.
    return jsonify(PlannedChangeSchema.from_orm(change).model_dump(mode='json', by_alias=True)), 200

@changes_bp.route('/<int:change_id>/', methods=['DELETE']) # Endpoint: /portfolios/<pid>/changes/<cid>/
@jwt_required()
@verify_portfolio_ownership
@handle_api_errors() # No schema for DELETE body, but handles DB commit/rollback.
def delete_planned_change(portfolio_id: int, change_id: int, portfolio: Portfolio):
    """Deletes a planned future change from the specified portfolio.

    Args:
        portfolio_id (int): The ID of the portfolio (from URL).
        change_id (int): The ID of the planned change to delete (from URL).
        portfolio (Portfolio): The portfolio object, injected by `verify_portfolio_ownership`.

    Returns:
        JSON response with a success message and a 200 status code.
    """
    change = get_owned_child_or_404(
        parent_instance=portfolio,
        child_relationship_name='planned_changes',
        child_id=change_id,
        child_model=PlannedFutureChange,
        child_pk_attr='change_id'
    )
    
    db.session.delete(change)
    # Commit is handled by `handle_api_errors`.
    
    return jsonify({"message": "Planned change deleted successfully"}), 200 