"""
Blueprint for handling analytics-related routes for portfolios.

This includes routes for fetching risk profiles and performance data.
Portfolio ownership is verified for all routes in this blueprint.
"""
from flask import Blueprint, jsonify, request, current_app, abort
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Portfolio, Asset, PlannedFutureChange
import functools
from datetime import date, datetime, timedelta
import logging
from decimal import Decimal, InvalidOperation
import json
from app.schemas.analytics_schemas import RiskProfileSchema
from app.services.analytics_service import calculate_historical_performance

# Import custom exceptions
from app.utils.exceptions import (
    ApplicationException, PortfolioNotFoundError, AccessDeniedError, BadRequestError
)

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/v1/portfolios/<int:portfolio_id>/analytics')

# --- Decorators ---

def verify_portfolio_ownership(f):
    """Decorator to fetch a portfolio by ID and verify ownership.

    This decorator ensures that the current JWT-authenticated user is the owner
    of the portfolio being accessed. If the portfolio doesn't exist or the user
    is not the owner, appropriate error responses (404 or 403) are raised.
    The fetched portfolio object is injected into the wrapped function's kwargs.

    Raises:
        ApplicationException: If portfolio_id is missing in route arguments (500).
        ApplicationException: If user identity in JWT is invalid (401).
        PortfolioNotFoundError: If the portfolio does not exist (404).
        AccessDeniedError: If the user does not own the portfolio (403).
    """
    @functools.wraps(f)
    @jwt_required() # Ensures user is logged in first
    def wrapper(*args, **kwargs):
        portfolio_id = kwargs.get('portfolio_id')
        if portfolio_id is None:
            # This indicates a routing configuration error, not a user error.
            current_app.logger.error("Developer error: portfolio_id missing in route arguments for ownership check.")
            raise ApplicationException("Server configuration error: portfolio_id missing.", status_code=500)

        try:
            user_id_str = get_jwt_identity() # JWT identity is expected to be the user ID as a string
            current_user_id = int(user_id_str)
        except (ValueError, TypeError):
            current_app.logger.warning(f"Invalid user identity format in JWT: '{user_id_str}'. IP: {request.remote_addr}")
            raise ApplicationException("Invalid user identity in token.", status_code=401, logging_level="warning")

        # Fetch the portfolio by its ID
        portfolio = Portfolio.query.get(portfolio_id)

        if portfolio is None:
            # Standard "not found" response if portfolio doesn't exist
            raise PortfolioNotFoundError(message=f"Portfolio with id {portfolio_id} not found.")

        # Verify ownership
        if portfolio.user_id != current_user_id:
            # Log the unauthorized access attempt
            current_app.logger.warning(
                f"Access denied: UserID='{current_user_id}' attempted to access PortfolioID='{portfolio_id}' "
                f"owned by UserID='{portfolio.user_id}'. Source IP: {request.remote_addr}"
            )
            raise AccessDeniedError(message="You do not have permission to access this portfolio.")

        # Inject the fetched portfolio object into the route handler's keyword arguments
        kwargs['portfolio'] = portfolio
        return f(*args, **kwargs)
    return wrapper

# --- Analytics Routes ---

@analytics_bp.route('/risk-profile', methods=['GET'])
@verify_portfolio_ownership
def get_risk_profile(portfolio_id: int, portfolio: Portfolio):
    """Retrieve and return the risk profile for the specified portfolio.

    The actual risk calculation is pending implementation. Currently, this route
    returns a placeholder risk profile.

    Args:
        portfolio_id (int): The ID of the portfolio (from URL).
        portfolio (Portfolio): The portfolio object, injected by verify_portfolio_ownership.

    Returns:
        JSON response containing the risk profile data and a 200 status code.
    """
    # TODO: Implement actual risk calculation logic based on portfolio assets and market data.
    # For now, return placeholder values using the RiskProfileSchema
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
def get_performance(portfolio_id: int, portfolio: Portfolio):
    """Retrieve and return historical performance data for the specified portfolio.

    Query parameters 'start_date' and 'end_date' (YYYY-MM-DD) can be used
    to define the performance period. Defaults to the last 30 days if
    start_date is not provided, and today if end_date is not provided.

    Args:
        portfolio_id (int): The ID of the portfolio (from URL).
        portfolio (Portfolio): The portfolio object, injected by verify_portfolio_ownership.

    Returns:
        JSON response containing the historical performance data and a 200 status code.

    Raises:
        BadRequestError: If date formats are invalid or start_date is after end_date.
    """
    try:
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')

        # Default to 30 days ago if start_date is not provided, and today if end_date is not provided.
        default_start_date = date.today() - timedelta(days=30)
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date() if start_date_str else default_start_date
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date() if end_date_str else date.today()

        # Validate date logic
        if start_date > end_date:
            raise BadRequestError(message="start_date must be before or equal to end_date.")
        if end_date > date.today(): # Cap end_date to today to prevent requesting future performance.
            current_app.logger.info(f"Performance request for PortfolioID {portfolio_id} had end_date '{end_date_str}' beyond today. Capping to today.")
            end_date = date.today()
        
        # Note: The calculate_historical_performance service is responsible for handling cases
        # where the requested start_date is before the portfolio's creation.
        # It will typically return zero performance for periods before the portfolio existed.

    except ValueError: # Catches strptime parsing errors
        raise BadRequestError(message="Invalid date format. Please use YYYY-MM-DD.")

    # Call the service function to calculate performance
    performance_data = calculate_historical_performance(
        portfolio=portfolio,
        start_date=start_date,
        end_date=end_date,
        # portfolio_id is passed again here, but calculate_historical_performance could also get it from portfolio.portfolio_id
        # Consider standardizing if portfolio_id is always available from the portfolio object.
        # For now, keeping it as it was.
        portfolio_id_for_logging=portfolio_id
    )
    
    return jsonify(performance_data), 200 