from flask import Blueprint, jsonify, request, current_app, abort
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Portfolio, Asset, PlannedFutureChange
import functools
from datetime import date, datetime, timedelta
import logging
from decimal import Decimal, InvalidOperation
import json

# Import the new schema
from app.schemas.analytics_schemas import RiskProfileSchema
# Import the new service function
from app.services.analytics_service import calculate_historical_performance

# Define the blueprint: 'analytics', prefix: /api/v1/portfolios/<int:portfolio_id>/analytics
analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/v1/portfolios/<int:portfolio_id>/analytics')

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

        portfolio = Portfolio.query.get(portfolio_id)

        if portfolio is None:
            abort(404, description=f"Portfolio with id {portfolio_id} not found.")

        if portfolio.user_id != current_user_id:
            # Log access control denial
            logging.warning(f"Access denied: UserID='{current_user_id}' attempted to access PortfolioID='{portfolio_id}' owned by UserID='{portfolio.user_id}'. Source IP: {request.remote_addr}")
            abort(403, description="User does not have permission to access this portfolio.")

        kwargs['portfolio'] = portfolio
        return f(*args, **kwargs)
    return wrapper

# --- Analytics Routes ---

@analytics_bp.route('/risk-profile', methods=['GET'])
@verify_portfolio_ownership
def get_risk_profile(portfolio_id, portfolio):
    """Returns the risk profile analysis for a specific portfolio."""
    # TODO: Implement actual risk calculation logic
    # For now, return placeholder values using the schema
    risk_profile = RiskProfileSchema(
        risk_score=0.75,
        volatility_estimate=0.15,
        sharpe_ratio=1.2,
        confidence_interval_low_95=-0.05,
        confidence_interval_high_95=0.25,
        calculation_date=date.today()
    )
    
    return jsonify(risk_profile.model_dump(mode='json', by_alias=True)), 200

@analytics_bp.route('/performance', methods=['GET'])
@verify_portfolio_ownership
def get_performance(portfolio_id, portfolio):
    """Returns historical performance data for a specific portfolio."""
    try:
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')

        # Default to 30 days ago if start_date is not provided
        default_start_date = date.today() - timedelta(days=30)
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date() if start_date_str else default_start_date
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date() if end_date_str else date.today()

        if start_date > end_date:
            abort(400, description="start_date must be before or equal to end_date")
        if end_date > date.today(): # Cap end_date to today
            end_date = date.today()
        # Ensure start_date is not before portfolio creation date for calculation logic
        # However, the user can request an earlier start_date; performance will be 0 until portfolio creation.
        
    except ValueError:
        abort(400, description="Invalid date format. Use YYYY-MM-DD")

    # Call the service function to calculate performance data
    performance_data = calculate_historical_performance(portfolio, start_date, end_date, portfolio_id)
    
    return jsonify(performance_data), 200 