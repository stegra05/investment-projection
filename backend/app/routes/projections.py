from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from pydantic import BaseModel, Field, ValidationError as PydanticValidationError, validator, root_validator # For schema validation
from typing import List, Optional # For type hinting
from decimal import Decimal, InvalidOperation
import datetime
import uuid

from app.services.projection_engine import calculate_projection
# Import models from app.models
from app.models import Portfolio # Removed PlannedFutureChange as it's not directly used here
# Import db instance from the app package
from app import db 
# Import Pydantic schemas for request/response and draft changes
from app.schemas.portfolio_schemas import PlannedChangeCreateSchema, OrmBaseModel 

projections_bp = Blueprint('projections_bp', __name__, url_prefix='/api/v1/portfolios')

# TEMPORARY: In-memory storage for task results. Not suitable for production.
TEMP_TASK_RESULTS = {}

# --- Pydantic Schemas for Projection Requests ---
class ProjectionRequestBase(OrmBaseModel):
    start_date: datetime.date = Field(..., example="2024-01-01")
    end_date: datetime.date = Field(..., example="2025-12-31")
    initial_total_value: Decimal = Field(..., ge=0, example="10000.00")

    @validator('end_date')
    def end_date_after_start_date(cls, v, values):
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('End date must be after start date')
        return v

class ProjectionTaskRequestSchema(ProjectionRequestBase):
    pass # Inherits all fields and validation

class ProjectionPreviewRequestSchema(ProjectionRequestBase):
    draft_planned_changes: Optional[List[PlannedChangeCreateSchema]] = Field(default_factory=list)

# --- Standard Projection Route (Task-based) ---
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

    # --- Actually run the projection (synchronously for now) and store result ---
    try:
        projection_data = calculate_projection(
            portfolio_id=portfolio_id,
            start_date=start_date,
            end_date=end_date,
            initial_total_value=initial_total_value
            # draft_changes_input is not used in the main projection route
        )
        # Format results into an object { "YYYY-MM-DD": "value_str", ... }
        # This matches what ProjectionPanel.js expects from status.result.data after Object.entries
        formatted_data_obj = {
            item_date.isoformat(): str(item_value)
            for item_date, item_value in projection_data
        }
        TEMP_TASK_RESULTS[task_id] = {
            "status": "COMPLETED",
            "result": {"data": formatted_data_obj}
        }
        current_app.logger.info(f"Projection task {task_id} completed and result stored.")
    except Exception as e:
        current_app.logger.error(f"Error during projection calculation for task {task_id}: {e}", exc_info=True)
        TEMP_TASK_RESULTS[task_id] = {
            "status": "FAILED",
            "error": "Projection calculation failed internally."
        }
    # -------------------------------------------------------------------------

    # TODO: Dispatch to background task (this synchronous call is temporary)

    return jsonify({
        "message": "Projection task accepted",
        "task_id": task_id
    }), 202 

# --- NEW: Projection Preview Route ---
@projections_bp.route('/<int:portfolio_id>/projections/preview', methods=['POST'])
@jwt_required()
def preview_portfolio_projection(portfolio_id):
    """
    Calculates a portfolio projection preview directly.
    Accepts start_date, end_date, initial_total_value, and an optional list of draft_planned_changes.
    Returns the projection result immediately.
    """
    current_user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        return jsonify({"message": "Request body must be JSON"}), 415 # Use 415 for wrong media type

    try:
        # Validate the incoming data with Pydantic schema
        preview_request_data = ProjectionPreviewRequestSchema(**data)
    except PydanticValidationError as e:
        return jsonify({"message": "Invalid input data", "errors": e.errors()}), 400
    except Exception as e: # Catch any other unexpected parsing errors
        current_app.logger.error(f"Error parsing preview request: {e}")
        return jsonify({"message": "Error processing request data."}), 400

    # --- Authorization Check: Ensure user owns the portfolio ---
    # (Reusing logic from above, could be refactored into a decorator/helper if used more)
    portfolio = Portfolio.query.filter_by(portfolio_id=portfolio_id, user_id=current_user_id).first()
    if not portfolio:
        if Portfolio.query.filter_by(portfolio_id=portfolio_id).first():
            return jsonify({"message": "Forbidden: You do not own this portfolio."}), 403
        else:
            return jsonify({"message": "Portfolio not found."}), 404

    try:
        # Call the projection engine with the validated and parsed data
        projection_results = calculate_projection(
            portfolio_id=portfolio_id,
            start_date=preview_request_data.start_date,
            end_date=preview_request_data.end_date,
            initial_total_value=preview_request_data.initial_total_value,
            draft_changes_input=preview_request_data.draft_planned_changes # Pass the list of Pydantic schema objects
        )
        
        # Format results for JSON response (dates to strings, Decimals to strings)
        formatted_results = [
            {"date": date.isoformat(), "value": str(value)}
            for date, value in projection_results
        ]
        return jsonify(formatted_results), 200

    except ValueError as e:
        # Catch ValueErrors from projection_engine (e.g., portfolio not found if somehow missed above, or other data issues)
        current_app.logger.warning(f"ValueError during projection calculation for preview: {e}")
        return jsonify({"message": str(e)}), 400 # Could also be 404 or other based on error type
    except Exception as e:
        current_app.logger.exception(f"Unexpected error during projection preview for portfolio {portfolio_id}")
        return jsonify({"message": "An unexpected error occurred during projection calculation."}), 500 