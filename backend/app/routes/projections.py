from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from decimal import Decimal, InvalidOperation
import datetime

from app.services.projection_engine import calculate_projection
from app.models import Portfolio, db # Import Portfolio to verify ownership

projections_bp = Blueprint('projections_bp', __name__, url_prefix='/api/v1/portfolios')

@projections_bp.route('/<int:portfolio_id>/projections', methods=['POST'])
@jwt_required()
def create_portfolio_projection(portfolio_id):
    """
    Calculates and returns the projection for a specific portfolio.
    Requires start_date, end_date, and initial_total_value in JSON body.
    --- 
    parameters:
      - name: portfolio_id
        in: path
        type: integer
        required: true
        description: ID of the portfolio to project.
      - name: body
        in: body
        required: true
        schema:
          id: ProjectionRequest
          required:
            - start_date
            - end_date
            - initial_total_value
          properties:
            start_date:
              type: string
              format: date
              description: Start date for projection (YYYY-MM-DD).
            end_date:
              type: string
              format: date
              description: End date for projection (YYYY-MM-DD).
            initial_total_value:
              type: string
              description: Initial total value of the portfolio as a decimal string.
    responses:
      200:
        description: Projection calculated successfully.
        schema:
          type: array
          items:
            type: object
            properties:
              date:
                type: string
                format: date
              value:
                type: string 
                description: Projected value as a decimal string.
      400:
        description: Invalid input data (e.g., bad date format, missing fields, invalid value).
      401:
        description: Authentication required.
      403:
        description: User does not own this portfolio.
      404:
        description: Portfolio not found.
      500:
        description: Internal server error during calculation.
    """
    current_user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        return jsonify({"message": "Request body must be JSON"}), 400

    # --- Input Validation ---
    required_fields = ['start_date', 'end_date', 'initial_total_value']
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        return jsonify({"message": f"Missing required fields: {', '.join(missing_fields)}"}), 400

    try:
        start_date_str = data['start_date']
        end_date_str = data['end_date']
        initial_value_str = data['initial_total_value']

        start_date = datetime.datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.datetime.strptime(end_date_str, '%Y-%m-%d').date()
        initial_total_value = Decimal(initial_value_str)

        if start_date >= end_date:
            return jsonify({"message": "End date must be after start date"}), 400
        if initial_total_value < 0:
             # Allowing zero, but not negative initial value? Adjust if needed.
            return jsonify({"message": "Initial total value cannot be negative"}), 400

    except (ValueError, TypeError) as e:
        return jsonify({"message": f"Invalid date format. Please use YYYY-MM-DD. Error: {e}"}), 400
    except InvalidOperation:
        return jsonify({"message": "Invalid format for initial_total_value. Please provide a valid decimal string."}), 400

    # --- Authorization Check: Ensure user owns the portfolio --- 
    portfolio = Portfolio.query.filter_by(id=portfolio_id, user_id=current_user_id).first()
    if not portfolio:
        # Distinguish between not found and not authorized
        if Portfolio.query.filter_by(id=portfolio_id).first():
             return jsonify({"message": "Forbidden: You do not own this portfolio."}), 403
        else:
             return jsonify({"message": "Portfolio not found."}), 404

    # --- Call Projection Service ---
    try:
        projection_results = calculate_projection(
            portfolio_id=portfolio_id,
            start_date=start_date,
            end_date=end_date,
            initial_total_value=initial_total_value
        )

        # --- Format Results for JSON ---
        formatted_results = [
            {
                "date": date.strftime('%Y-%m-%d'),
                "value": str(value) # Convert Decimal to string for precise JSON representation
            }
            for date, value in projection_results
        ]

        return jsonify(formatted_results), 200

    except ValueError as e:
        # This might catch the "Portfolio not found" from the service again, though we check above.
        # It could also catch other validation errors raised within the service.
        return jsonify({"message": f"Error calculating projection: {e}"}), 400 
    except Exception as e:
        # Catch-all for unexpected errors during calculation
        print(f"ERROR calculating projection for portfolio {portfolio_id}: {e}") # Log the error
        return jsonify({"message": "An internal error occurred during projection calculation."}), 500 