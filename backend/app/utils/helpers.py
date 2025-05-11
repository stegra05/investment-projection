from flask import abort
from sqlalchemy.orm import object_mapper, RelationshipProperty
from typing import Type, TypeVar, Any
# Assuming db instance is accessible via app package. Adjust if needed.
from app import db
# from app.models import db # Common pattern in Flask apps -- THIS IS INCORRECT
from flask import current_app
from werkzeug.exceptions import HTTPException # Import HTTPException

# Import custom exceptions
from app.utils.exceptions import ChildResourceNotFoundError, ApplicationException, DatabaseError, BadRequestError

# Define a generic type variable for SQLAlchemy models
# Using Type[Any] for simplicity, could refine further if needed.
ModelType = TypeVar('ModelType', bound=Any)

def get_owned_child_or_404(
    parent_instance: Any,
    child_relationship_name: str,
    child_id: int,
    child_model: Type[ModelType],
    child_pk_attr: str
) -> ModelType:
    """
    Gets a child entity by ID within a parent's collection or via direct query,
    aborting with 404 if not found. Assumes parent has the child relationship
    eagerly loaded or accessible.

    Args:
        parent_instance: The SQLAlchemy model instance of the parent (e.g., Portfolio).
        child_relationship_name: The name of the relationship attribute on the parent
                                  that holds the child collection (e.g., 'assets').
        child_id: The ID of the child entity to find.
        child_model: The SQLAlchemy model class of the child (e.g., Asset).
        child_pk_attr: The name of the primary key attribute on the child model
                       (e.g., 'asset_id', 'change_id'). *Must be provided.*

    Returns:
        The found child entity instance.

    Raises:
        ChildResourceNotFoundError: If the child is not found.
        ApplicationException: For internal configuration or unexpected errors.
        AttributeError: If the parent_instance does not have the specified relationship.
        ValueError: If the relationship configuration is unexpected.
    """
    try:
        # Stage 1: Check eagerly loaded collection first.
        # This is an optimization. If the parent object (e.g., a Portfolio) was loaded
        # from the database with its child collection (e.g., its 'assets') already joined
        # (eagerly loaded), then iterating through this in-memory collection is faster
        # than issuing a new database query.
        child_collection = getattr(parent_instance, child_relationship_name)
        if child_collection is not None:
            for child in child_collection:
                if hasattr(child, child_pk_attr) and getattr(child, child_pk_attr) == child_id:
                    return child

        # Stage 2: Fallback to a direct database query.
        # If the child was not found in an eagerly loaded collection (or the collection
        # wasn't loaded), this part attempts to fetch the child directly from the database.
        # This requires ensuring the child belongs to the specified parent.

        # Inspect the relationship to dynamically find the foreign key on the child model
        # that links it to the parent model. This makes the helper more generic.
        mapper = object_mapper(parent_instance)
        prop = mapper.get_property(child_relationship_name)

        if not isinstance(prop, RelationshipProperty):
            # The `prop` must be a RelationshipProperty, which describes how two models are related
            # (e.g., one-to-many, many-to-many). If it's not, the provided
            # `child_relationship_name` is not a valid SQLAlchemy relationship attribute.
            raise ValueError(f"'{child_relationship_name}' is not a relationship property on {parent_instance.__class__.__name__}")

        # Determine the parent's primary key name and value to filter the child query.
        parent_pk_cols = mapper.primary_key
        if len(parent_pk_cols) != 1:
            raise ValueError("Parent model must have a single primary key column for this helper.")
        parent_pk_name = parent_pk_cols[0].name
        parent_pk_value = getattr(parent_instance, parent_pk_name)

        # `prop.remote_side` refers to the columns on the "many" side of a one-to-many relationship
        # (or the other side in a many-to-many, though this helper is more geared towards one-to-many).
        # These are typically the foreign key columns on the child model that point back to the parent.
        # We expect a single foreign key column for a simple parent-child link.
        child_fk_attrs = prop.remote_side
        if not child_fk_attrs or len(child_fk_attrs) != 1:
            raise ValueError(f"Could not determine single foreign key attribute on {child_model.__name__} for relationship '{child_relationship_name}'. Check relationship configuration and foreign_keys/remote_side.")
        child_fk_attr_name = list(child_fk_attrs)[0].name

        # Construct filter conditions to find the child with the given ID (child_pk_attr)
        # AND ensure it is linked to the parent (child_fk_attr_name == parent_pk_value).
        filter_conditions = {
            child_fk_attr_name: parent_pk_value,
            child_pk_attr: child_id
        }

        child_fallback = child_model.query.filter_by(**filter_conditions).first()

        if child_fallback is None:
            raise ChildResourceNotFoundError(
                child_model_name=child_model.__name__,
                child_id=child_id,
                parent_model_name=parent_instance.__class__.__name__,
                parent_id=getattr(parent_instance, parent_pk_name, None)
            )

        return child_fallback

    except AttributeError as e:
        # Parent might not have the relationship attribute, or child lacks PK attr
        # Or getattr failed on child in loop
        current_app.logger.error(f"AttributeError in get_owned_child_or_404: {e}") # Log this
        # This suggests a potential coding or configuration error.
        raise ApplicationException(message=f"Internal configuration error accessing relationship or attribute: {e}", status_code=500)
    except ValueError as e:
        # Raised if relationship inspection fails - likely a setup/coding error
        current_app.logger.error(f"ValueError in get_owned_child_or_404: {e}")
        raise ApplicationException(message=f"Internal configuration error: {e}", status_code=500)
    except HTTPException:
        # Re-raise HTTPExceptions (like those from abort() if any were kept, or Werkzeug's)
        raise
    except Exception as e:
        # Catch other potential DB errors during fallback query or other unexpected issues
        current_app.logger.exception(f"Unexpected error in get_owned_child_or_404 fallback query for child {child_pk_attr}={child_id}")
        # Raise a more specific DatabaseError or a generic ApplicationException
        raise DatabaseError(message="An unexpected error occurred while retrieving the requested item.") 