from flask import Blueprint, jsonify, request, current_app, abort
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Portfolio
import functools
from datetime import date, datetime, timedelta
import logging

# Import the new schema
from app.schemas.analytics_schemas import RiskProfileSchema

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
    # Parse optional date parameters
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Convert to date objects if provided
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date() if start_date else date.today() - timedelta(days=30)
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date() if end_date else date.today()
        
        # Validate date range
        if start_date > end_date:
            abort(400, description="start_date must be before or equal to end_date")
            
        if start_date > date.today():
            abort(400, description="start_date cannot be in the future")
            
        if end_date > date.today():
            end_date = date.today()  # Cap end_date to today
            
    except ValueError:
        abort(400, description="Invalid date format. Use YYYY-MM-DD")
    
    # TODO: Implement actual performance calculation logic
    # For now, return placeholder time-series data
    performance_data = []
    current_date = start_date
    cumulative_return = 0.0
    
    while current_date <= end_date:
        # Simulate some return data
        if current_date != start_date:
            # Add small random returns for demonstration
            cumulative_return += 0.001  # 0.1% daily return for demo
        
        performance_data.append({
            "date": current_date.isoformat(),
            "cumulative_return": round(cumulative_return, 4)
        })
        
        current_date += timedelta(days=1)
    
    return jsonify(performance_data), 200 