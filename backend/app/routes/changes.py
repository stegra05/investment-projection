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

changes_bp = Blueprint('changes', __name__)

# --- Helper Function ---

def get_change_or_404(portfolio: Portfolio, change_id: int):
     """Gets a planned change by ID within a portfolio, aborting if not found."""
     # Check eager loaded changes first
     for change in portfolio.planned_changes: # Assuming relationship name is planned_changes
        if change.change_id == change_id:
            return change
     # Fallback query
     change_fallback = PlannedFutureChange.query.filter_by(portfolio_id=portfolio.portfolio_id, change_id=change_id).first()
     if change_fallback is None:
        raise PlannedChangeNotFoundError(message=f"Planned change with id {change_id} not found within portfolio {portfolio.portfolio_id}.")
     return change_fallback

# --- Planned Future Change Routes (Moved from portfolios.py, Task 5.5) ---

# Note: portfolio_id is captured from the URL prefix during blueprint registration
# The verify_portfolio_ownership decorator injects the 'portfolio' object

@changes_bp.route('/', methods=['OPTIONS'])
def add_planned_change_options(portfolio_id):
    """Handles OPTIONS preflight requests for adding planned changes."""
    # Flask-CORS, initialized globally, will add the necessary Access-Control-* headers.
    # This route just needs to exist and return a successful HTTP response.
    return jsonify(message="Preflight for planned changes OK"), 200

@changes_bp.route('/', methods=['POST'])
@jwt_required()
@verify_portfolio_ownership
@handle_api_errors(schema=PlannedChangeCreateSchema)
def add_planned_change(portfolio_id, portfolio, validated_data):
    """Adds a new planned future change to a specific portfolio."""
    new_change = PlannedFutureChange(
        portfolio_id=portfolio.portfolio_id,
        **validated_data.dict()
    )
    db.session.add(new_change)
    db.session.flush() # Flush to assign the change_id before serialization
    # Commit handled by decorator
    # db.session.refresh(new_change) # Removed - Refresh needs a flush/commit first. Object state is known.
    # Serialize output
    return jsonify(PlannedChangeSchema.from_orm(new_change).model_dump(mode='json', by_alias=True)), 201

@changes_bp.route('/<int:change_id>/', methods=['OPTIONS'])
def update_planned_change_options(portfolio_id, change_id):
    """Handles OPTIONS preflight requests for updating/deleting specific planned changes."""
    return jsonify(message="Preflight for specific planned change OK"), 200

@changes_bp.route('/<int:change_id>/', methods=['PUT', 'PATCH'])
@jwt_required()
@verify_portfolio_ownership
@handle_api_errors(schema=PlannedChangeUpdateSchema)
def update_planned_change(portfolio_id, change_id, portfolio, validated_data):
    """Updates an existing planned change within a portfolio."""
    change = get_owned_child_or_404(
        parent_instance=portfolio,
        child_relationship_name='planned_changes',
        child_id=change_id,
        child_model=PlannedFutureChange,
        child_pk_attr='change_id'
    )
    validated_dict = validated_data.dict(exclude_unset=True)

    # Update model fields
    for key, value in validated_dict.items():
        setattr(change, key, value)

    # Re-validate consistency after potential updates
    # The handle_api_errors decorator doesn't currently handle this kind of post-update validation.
    # We might need a custom check here, or enhance the decorator/schema.
    # For now, keeping the manual check as it was.
    if change.change_type in ['Contribution', 'Withdrawal'] and change.amount is None:
        raise BadRequestError(message=f"'{change.change_type}' requires an 'amount'.")
    if change.change_type == 'Reallocation' and change.amount is not None:
        raise BadRequestError(message="'Reallocation' change type should not include an 'amount'.")

    # Commit handled by decorator
    # db.session.refresh(change) # Also removed - Refresh might be unnecessary here too after update.
    # Serialize output
    return jsonify(PlannedChangeSchema.from_orm(change).model_dump(mode='json', by_alias=True)), 200

@changes_bp.route('/<int:change_id>/', methods=['DELETE'])
@jwt_required()
@verify_portfolio_ownership
def delete_planned_change(portfolio_id, change_id, portfolio):
    """Deletes a planned change from a portfolio."""
    change = get_owned_child_or_404(
        parent_instance=portfolio,
        child_relationship_name='planned_changes',
        child_id=change_id,
        child_model=PlannedFutureChange,
        child_pk_attr='change_id'
    )
    # Error handling (including rollback) is now managed by the global 500 handler
    db.session.delete(change)
    db.session.commit()
    return jsonify({"message": "Planned change deleted successfully"}), 200 