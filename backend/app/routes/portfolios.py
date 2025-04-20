from flask import Blueprint, request, jsonify, abort
from app import db
from app.models import Portfolio
from flask_jwt_extended import jwt_required, get_jwt_identity
import functools
from app.utils.decorators import handle_api_errors # Keep it for create/update

# Import Pydantic Schemas
from app.schemas.portfolio_schemas import (
    PortfolioSchema, PortfolioCreateSchema, PortfolioUpdateSchema
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
    # db.session.commit() # Commit is handled by decorator - (comment kept for context)
    db.session.refresh(new_portfolio) # Refresh to get DB defaults like ID

    # Serialize output using Pydantic schema
    # Return tuple (response, status_code) for the decorator
    return jsonify(PortfolioSchema.from_orm(new_portfolio).model_dump(mode='json', by_alias=True)), 201
    # Removed try...except block and manual commit/rollback

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
@handle_api_errors(schema=PortfolioUpdateSchema)
def update_portfolio(portfolio_id, portfolio, validated_data): # Receive portfolio and validated_data
    """Updates details for a specific portfolio."""
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

# --- Planned Future Change Routes (Task 5.5) --- 