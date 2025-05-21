"""
Blueprint for handling portfolio projection calculations.

This includes routes for initiating long-running projection tasks via Celery
and for fetching immediate projection previews with draft changes.
All routes are nested under a specific portfolio and require JWT authentication
and ownership verification.
"""
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

# Define the blueprint: 'projections_bp'
# URL prefix /api/v1/portfolios is applied here, so routes like '/<pid>/projections'
# become /api/v1/portfolios/<pid>/projections.
projections_bp = Blueprint('projections_bp', __name__, url_prefix='/api/v1/portfolios')


# --- Pydantic Schemas for Projection Requests ---

class ProjectionRequestBase(OrmBaseModel):
    """Base schema for projection requests, defining common fields."""
    start_date: datetime.date = Field(..., description="Start date for the projection (YYYY-MM-DD).", example="2024-01-01")
    end_date: datetime.date = Field(..., description="End date for the projection (YYYY-MM-DD).", example="2025-12-31")
    initial_total_value: Decimal = Field(
        ..., 
        ge=0, 
        description="Initial total value of the portfolio for the projection.",
        example="10000.00"
    )

    @validator('end_date')
    def validate_end_date_after_start_date(cls, end_date_value, values):
        """Ensures that the end_date is after the start_date."""
        start_date_value = values.get('start_date')
        if start_date_value and end_date_value <= start_date_value:
            raise ValueError('End date must be after start date.')
        return end_date_value

class ProjectionTaskRequestSchema(ProjectionRequestBase):
    """Schema for initiating a background projection task.
    Currently identical to the base, but can be extended if needed.
    """
    pass # Inherits all fields and validation logic from ProjectionRequestBase.

class ProjectionPreviewRequestSchema(ProjectionRequestBase):
    """Schema for requesting an immediate projection preview.
    Allows for optional 'draft_planned_changes' to be included in the preview.
    """
    draft_planned_changes: Optional[List[PlannedChangeCreateSchema]] = Field(
        default_factory=list, 
        description="Optional list of draft planned changes to include in the preview calculation."
    )

# --- Standard Projection Route (Task-based) ---
@projections_bp.route('/<int:portfolio_id>/projections', methods=['POST'])
@jwt_required() # User must be authenticated.
def create_portfolio_projection(portfolio_id: int):
    """Initiates a background Celery task for portfolio projection.

    Requires `start_date`, `end_date`, and `initial_total_value` in the JSON body,
    validated by `ProjectionTaskRequestSchema`.

    Args:
        portfolio_id (int): The ID of the portfolio for which to run the projection.

    Returns:
        JSON response with a message and task_id if successful (202),
        or an error response (400, 401, 403, 404, 500).
        
    Raises:
        BadRequestError: For invalid or missing request data.
        AccessDeniedError: If the user does not own the portfolio.
        PortfolioNotFoundError: If the portfolio ID is not found.
        ApplicationException: For internal server errors during task dispatch or recording.
    """
    current_user_id_str = get_jwt_identity()
    # It's good practice to ensure current_user_id is int if used for DB queries directly.
    # Here, it's used for UserCeleryTask.create_task_for_user and auth check.
    # Assuming get_jwt_identity() returns string ID, convert as needed or ensure consistency.
    try:
        current_user_id = int(current_user_id_str)
    except (ValueError, TypeError):
        current_app.logger.error(f"Invalid user ID format in JWT: {current_user_id_str}")
        raise ApplicationException("Invalid user identity.", status_code=401)

    json_data = request.get_json()
    if not json_data:
        raise BadRequestError("Request body must be JSON.")

    # Validate request data using Pydantic schema
    try:
        task_request = ProjectionTaskRequestSchema(**json_data)
    except PydanticValidationError as e:
        current_app.logger.warning(f"Projection request validation failed for PortfolioID {portfolio_id}: {e.errors()}")
        raise BadRequestError("Invalid input data.", payload={"errors": e.errors()})

    # Authorization Check: Ensure the current user owns the portfolio.
    # This check is crucial for data security.
    portfolio_owner_check = Portfolio.query.filter_by(portfolio_id=portfolio_id, user_id=current_user_id).first()
    if not portfolio_owner_check:
        # Distinguish between portfolio not existing and not owned for accurate error reporting/logging.
        if Portfolio.query.filter_by(portfolio_id=portfolio_id).first():
            current_app.logger.warning(
                f"Access Denied: UserID '{current_user_id}' attempted to run projection for PortfolioID '{portfolio_id}' "
                "which they do not own."
            )
            raise AccessDeniedError("You do not have permission to access this portfolio.")
        else:
            raise PortfolioNotFoundError(f"Portfolio with ID {portfolio_id} not found.")

    # Dispatch the Celery task for background processing.
    try:
        # Pass validated and correctly typed data to the Celery task.
        # Dates are converted to ISO format strings, Decimal to string for JSON compatibility if task expects strings.
        celery_task_instance = run_projection_task.delay(
            portfolio_id=portfolio_id,
            start_date_str=task_request.start_date.isoformat(),
            end_date_str=task_request.end_date.isoformat(),
            initial_total_value_str=str(task_request.initial_total_value)
        )
        celery_task_id = celery_task_instance.id
        current_app.logger.info(f"Projection Celery task '{celery_task_id}' dispatched for PortfolioID '{portfolio_id}'.")

        # Record the link between the user and the Celery task in the database.
        # This allows users to later query the status of their tasks.
        try:
            UserCeleryTask.create_task_for_user(user_id=current_user_id, task_id=celery_task_id)
            db.session.commit()
            current_app.logger.info(f"UserCeleryTask record created for TaskID '{celery_task_id}', UserID '{current_user_id}'.")
        except Exception as db_exc:
            db.session.rollback()
            current_app.logger.error(
                f"Database error creating UserCeleryTask for TaskID '{celery_task_id}', UserID '{current_user_id}': {db_exc}", 
                exc_info=True
            )
            # The Celery task is already dispatched. This failure means the user might not be able to track it via API.
            # Return a 500 error, as the system is in an inconsistent state regarding task tracking.
            raise ApplicationException(
                "Failed to record projection task status. The task may be processing, but you might not be able to track it.", 
                status_code=500
            )
        
        return jsonify({
            "message": "Projection task accepted and is being processed.",
            "task_id": celery_task_id
        }), 202 # HTTP 202 Accepted: request accepted for processing.
        
    except Exception as e:
        current_app.logger.error(f"Failed to dispatch Celery projection task for PortfolioID '{portfolio_id}': {e}", exc_info=True)
        # This is a general catch-all if Celery dispatch itself fails (e.g., broker unavailable).
        raise ApplicationException("Failed to initiate the projection task due to a server error. Please try again later.", status_code=500)

# --- Projection Preview Route ---
@projections_bp.route('/<int:portfolio_id>/projections/preview', methods=['POST'])
@jwt_required() # User must be authenticated.
def preview_portfolio_projection(portfolio_id: int):
    """Calculates and returns a portfolio projection preview immediately.

    Accepts `start_date`, `end_date`, `initial_total_value`, and an optional
    list of `draft_planned_changes` in the JSON body, validated by
    `ProjectionPreviewRequestSchema`.

    Args:
        portfolio_id (int): The ID of the portfolio for the preview.

    Returns:
        JSON response with the projection result (list of date-value pairs) if successful (200),
        or an error response (400, 401, 403, 404, 500).
        
    Raises:
        BadRequestError: For invalid or missing request data.
        AccessDeniedError: If the user does not own the portfolio.
        PortfolioNotFoundError: If the portfolio ID is not found.
        ApplicationException: For internal server errors during calculation.
    """
    current_user_id_str = get_jwt_identity()
    try:
        current_user_id = int(current_user_id_str)
    except (ValueError, TypeError):
        current_app.logger.error(f"Invalid user ID format in JWT for preview: {current_user_id_str}")
        raise ApplicationException("Invalid user identity.", status_code=401)

    json_data = request.get_json()
    if not json_data:
        # Use ApplicationException for non-payload related errors like wrong content type.
        raise ApplicationException("Request body must be JSON.", status_code=415, logging_level="warning")

    # Validate request data using Pydantic schema.
    try:
        preview_request = ProjectionPreviewRequestSchema(**json_data)
    except PydanticValidationError as e:
        current_app.logger.warning(f"Projection preview request validation failed for PortfolioID {portfolio_id}: {e.errors()}")
        raise BadRequestError("Invalid input data for projection preview.", payload={"errors": e.errors()})
    except Exception as e: # Catch any other unexpected parsing errors
        current_app.logger.error(f"Unexpected error parsing projection preview request for PortfolioID {portfolio_id}: {e}", exc_info=True)
        raise BadRequestError("Error processing request data. Ensure format is correct.")

    # Authorization Check: Ensure the current user owns the portfolio.
    portfolio_owner_check = Portfolio.query.filter_by(portfolio_id=portfolio_id, user_id=current_user_id).first()
    if not portfolio_owner_check:
        if Portfolio.query.filter_by(portfolio_id=portfolio_id).first():
            current_app.logger.warning(
                f"Access Denied: UserID '{current_user_id}' attempted projection preview for PortfolioID '{portfolio_id}' "
                "which they do not own."
            )
            raise AccessDeniedError("You do not have permission to access this portfolio.")
        else:
            raise PortfolioNotFoundError(f"Portfolio with ID {portfolio_id} not found.")
    
    current_app.logger.info(f"Calculating projection preview for PortfolioID '{portfolio_id}' (UserID '{current_user_id}').")
    try:
        # Call the projection engine directly with the validated and parsed data.
        # `draft_planned_changes` are passed as Pydantic model instances.
        projection_points = calculate_projection(
            portfolio_id=portfolio_id, # Or pass portfolio_owner_check if it contains all needed data (e.g. assets)
            start_date=preview_request.start_date,
            end_date=preview_request.end_date,
            initial_total_value=preview_request.initial_total_value,
            draft_changes_input=preview_request.draft_planned_changes 
        )
        
        # Format results for JSON response (dates to ISO strings, Decimals to strings).
        formatted_projection_points = [
            {"date": date_point.isoformat(), "value": str(value_point)}
            for date_point, value_point in projection_points
        ]
        current_app.logger.info(f"Projection preview calculated successfully for PortfolioID '{portfolio_id}'.")
        return jsonify(formatted_projection_points), 200

    except ValueError as ve: # Catch specific ValueErrors from the projection engine.
        current_app.logger.warning(f"ValueError during projection preview calculation for PortfolioID '{portfolio_id}': {ve}", exc_info=True)
        raise BadRequestError(f"Error in projection parameters or data: {str(ve)}")
    except Exception as e:
        current_app.logger.exception(f"Unexpected error during projection preview for PortfolioID '{portfolio_id}'.")
        # General error for unexpected issues in the calculation.
        raise ApplicationException("An unexpected error occurred during the projection preview calculation.", status_code=500)