from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from pydantic import BaseModel, Field, ValidationError as PydanticValidationError, validator, root_validator # For schema validation
from typing import List, Optional # For type hinting
from decimal import Decimal, InvalidOperation
import datetime

from app.services.projection_engine import calculate_projection
from app.models import Portfolio, UserCeleryTask
from app import db 
from app.schemas.portfolio_schemas import PlannedChangeCreateSchema, OrmBaseModel 
from app.background_workers import run_projection_task

# Import custom exceptions
from app.utils.exceptions import (
    BadRequestError, PortfolioNotFoundError, AccessDeniedError, ApplicationException
)

projections_bp = Blueprint('projections_bp', __name__, url_prefix='/api/v1/portfolios')


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
        raise BadRequestError("Request body must be JSON")

    # --- Input Validation (using Pydantic for consistency, though manual validation is here) ---
    # For a more robust validation, use ProjectionTaskRequestSchema directly:
    # try:
    #     task_request_data = ProjectionTaskRequestSchema(**data)
    # except PydanticValidationError as e:
    #     return jsonify({"message": "Invalid input data", "errors": e.errors()}), 400
    # start_date = task_request_data.start_date
    # end_date = task_request_data.end_date
    # initial_total_value = task_request_data.initial_total_value

    # Current manual validation:
    required_fields = ['start_date', 'end_date', 'initial_total_value']
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        raise BadRequestError(f"Missing required fields: {', '.join(missing_fields)}")

    try:
        start_date_str = data['start_date']
        end_date_str = data['end_date']
        initial_value_str = data['initial_total_value']

        start_date = datetime.datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.datetime.strptime(end_date_str, '%Y-%m-%d').date()
        initial_total_value = Decimal(initial_value_str)

        if start_date >= end_date:
            raise BadRequestError("End date must be after start date")
        if initial_total_value < 0:
            raise BadRequestError("Initial total value cannot be negative")

    except (ValueError, TypeError) as e:
        raise BadRequestError(f"Invalid date format. Please use YYYY-MM-DD. Error: {e}")
    except InvalidOperation:
        raise BadRequestError("Invalid format for initial_total_value. Please provide a valid decimal string.")

    # --- Authorization Check: Ensure user owns the portfolio --- 
    portfolio = Portfolio.query.filter_by(portfolio_id=portfolio_id, user_id=current_user_id).first()
    if not portfolio:
        if Portfolio.query.filter_by(portfolio_id=portfolio_id).first():
            raise AccessDeniedError("Forbidden: You do not own this portfolio.")
        else:
            # return jsonify({"message": "Portfolio not found."}), 404
            raise PortfolioNotFoundError(f"Portfolio with id {portfolio_id} not found.")

    # Dispatch the Celery task
    try:
        # Pass arguments as strings, as the task expects to convert them
        task = run_projection_task.delay(
            portfolio_id=portfolio_id,
            start_date_str=start_date.isoformat(),
            end_date_str=end_date.isoformat(),
            initial_total_value_str=str(initial_total_value)
        )
        task_id = task.id
        current_app.logger.info(f"Projection task {task_id} dispatched for portfolio {portfolio_id}.")

        # --- Create UserCeleryTask Record IMMEDIATELY --- 
        try:
            UserCeleryTask.create_task_for_user(user_id=current_user_id, task_id=task_id)
            db.session.commit()
            current_app.logger.info(f"UserCeleryTask record created for task {task_id}, user {current_user_id}")
        except Exception as db_error:
            db.session.rollback()
            current_app.logger.error(f"Database error creating UserCeleryTask for task {task_id}, user {current_user_id}: {db_error}", exc_info=True)
            # Even if DB record fails, the task is already dispatched. Return 500, but client might still poll later.
            raise ApplicationException("Failed to record projection task status. Please try again later.", status_code=500)
        # --------------------------------------------------

        return jsonify({
            "message": "Projection task accepted",
            "task_id": task_id
        }), 202
        
    except Exception as e:
        current_app.logger.error(f"Failed to dispatch projection task for portfolio {portfolio_id}: {e}", exc_info=True)
        raise ApplicationException("Failed to initiate projection task. Please try again later.", status_code=500, logging_level="exception")

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
        raise ApplicationException("Request body must be JSON", status_code=415, logging_level="warning")

    try:
        preview_request_data = ProjectionPreviewRequestSchema(**data)
    except PydanticValidationError as e:
        raise BadRequestError("Invalid input data", payload={"errors": e.errors()})
    except Exception as e: # Catch any other unexpected parsing errors
        current_app.logger.error(f"Error parsing preview request: {e}")
        raise BadRequestError("Error processing request data.")

    # --- Authorization Check: Ensure user owns the portfolio ---
    # (Reusing logic from above, could be refactored into a decorator/helper if used more)
    portfolio = Portfolio.query.filter_by(portfolio_id=portfolio_id, user_id=current_user_id).first()
    if not portfolio:
        if Portfolio.query.filter_by(portfolio_id=portfolio_id).first():
            raise AccessDeniedError("Forbidden: You do not own this portfolio.")
        else:
            raise PortfolioNotFoundError(f"Portfolio with id {portfolio_id} not found.")

    try:
        # Call the projection engine with the validated and parsed data
        projection_results = calculate_projection(
            portfolio_id=portfolio_id,
            start_date=preview_request_data.start_date,
            end_date=preview_request_data.end_date,
            initial_total_value=preview_request_data.initial_total_value,
            draft_changes_input=preview_request_data.draft_planned_changes # Pass the list of Pydantic schema objects
        )
        
        formatted_results = [
            {"date": date.isoformat(), "value": str(value)}
            for date, value in projection_results
        ]
        return jsonify(formatted_results), 200

    except ValueError as e:
        # Catch ValueErrors from projection_engine (e.g., portfolio not found if somehow missed above, or other data issues)
        current_app.logger.warning(f"ValueError during projection calculation for preview: {e}")
        raise BadRequestError(str(e))
    except Exception as e:
        current_app.logger.exception(f"Unexpected error during projection preview for portfolio {portfolio_id}")
        raise ApplicationException("An unexpected error occurred during projection calculation.", status_code=500, logging_level="exception") 