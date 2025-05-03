from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from decimal import Decimal, InvalidOperation
import datetime
import uuid

from app.services.projection_engine import calculate_projection
# Import models from app.models
from app.models import Portfolio 
# Import db instance from the app package
from app import db 

projections_bp = Blueprint('projections_bp', __name__, url_prefix='/api/v1/portfolios')

@projections_bp.route('/<int:portfolio_id>/projections', methods=['POST'])
@jwt_required()
def create_portfolio_projection(portfolio_id):
    """
    Initiates a portfolio projection calculation task.
    Requires start_date, end_date, and initial_total_value in JSON body.
    Returns a task ID for tracking the calculation progress.
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
      202:
        description: Projection task accepted.
        schema:
          type: object
          properties:
            message:
              type: string
              description: Status message.
            task_id:
              type: string
              description: Unique identifier for tracking the projection task.
      400:
        description: Invalid input data (e.g., bad date format, missing fields, invalid value).
      401:
        description: Authentication required.
      403:
        description: User does not own this portfolio.
      404:
        description: Portfolio not found.
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
            return jsonify({"message": "Initial total value cannot be negative"}), 400

    except (ValueError, TypeError) as e:
        return jsonify({"message": f"Invalid date format. Please use YYYY-MM-DD. Error: {e}"}), 400
    except InvalidOperation:
        return jsonify({"message": "Invalid format for initial_total_value. Please provide a valid decimal string."}), 400

    # --- Authorization Check: Ensure user owns the portfolio --- 
    portfolio = Portfolio.query.filter_by(portfolio_id=portfolio_id, user_id=current_user_id).first()
    if not portfolio:
        # Distinguish between not found and not authorized
        if Portfolio.query.filter_by(portfolio_id=portfolio_id).first():
            return jsonify({"message": "Forbidden: You do not own this portfolio."}), 403
        else:
            return jsonify({"message": "Portfolio not found."}), 404

    # Generate a unique task ID
    task_id = uuid.uuid4().hex

    # Log the task initiation (replace with actual task dispatch later)
    current_app.logger.info(
        f"Projection task initiated - TaskID: {task_id}, PortfolioID: {portfolio_id}, "
        f"StartDate: {start_date}, EndDate: {end_date}, InitialValue: {initial_total_value}"
    )

    # TODO: Dispatch to background task
    # calculate_projection(
    #     portfolio_id=portfolio_id,
    #     start_date=start_date,
    #     end_date=end_date,
    #     initial_total_value=initial_total_value
    # )

    return jsonify({
        "message": "Projection task accepted",
        "task_id": task_id
    }), 202 