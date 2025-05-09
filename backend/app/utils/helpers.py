from flask import abort
from sqlalchemy.orm import object_mapper, RelationshipProperty
from typing import Type, TypeVar, Any
# Assuming db instance is accessible via app package. Adjust if needed.
from app import db
# from app.models import db # Common pattern in Flask apps -- THIS IS INCORRECT
from flask import current_app
from werkzeug.exceptions import HTTPException # Import HTTPException

# Define a generic type variable for SQLAlchemy models
# Using Type[Any] for simplicity, could refine further if needed.
ModelType = TypeVar('ModelType', bound=Any)

def get_owned_child_or_404(
    parent_instance: Any,
    child_relationship_name: str,
    child_id: int,
    child_model: Type[ModelType],
    child_pk_attr: str # Must be explicitly provided now
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
        NotFound: Flask abort(404) if the child is not found.
        AttributeError: If the parent_instance does not have the specified relationship.
        ValueError: If the relationship configuration is unexpected.
        Exception: If there's an issue querying the child model.
    """
    try:
        # 1. Check eagerly loaded collection first
        child_collection = getattr(parent_instance, child_relationship_name)
        if child_collection is not None: # Ensure the collection exists
            for child in child_collection:
                # Check if child has the pk attribute and if it matches
                if hasattr(child, child_pk_attr) and getattr(child, child_pk_attr) == child_id:
                    return child

        # 2. Fallback: Query the database directly using parent linkage
        # Inspect the relationship to find the foreign key on the child model
        mapper = object_mapper(parent_instance)
        prop = mapper.get_property(child_relationship_name)

        if not isinstance(prop, RelationshipProperty):
             raise ValueError(f"'{child_relationship_name}' is not a relationship property on {parent_instance.__class__.__name__}")

        # Find the column on the child model that holds the foreign key to the parent
        parent_pk_cols = mapper.primary_key
        if len(parent_pk_cols) != 1:
             raise ValueError("Parent model must have a single primary key column for this helper.")
        parent_pk_name = parent_pk_cols[0].name
        parent_pk_value = getattr(parent_instance, parent_pk_name)

        # Get the corresponding foreign key attribute name on the child model
        # This relies on standard backref or explicit foreign_keys configuration
        child_fk_attrs = prop.remote_side # Columns on the child side of the relationship
        if not child_fk_attrs or len(child_fk_attrs) != 1:
             raise ValueError(f"Could not determine single foreign key attribute on {child_model.__name__} for relationship '{child_relationship_name}'.")
        child_fk_attr_name = list(child_fk_attrs)[0].name # Get the string name

        # Construct filter conditions
        filter_conditions = {
            child_fk_attr_name: parent_pk_value,
            child_pk_attr: child_id
        }

        # Execute fallback query
        child_fallback = child_model.query.filter_by(**filter_conditions).first()

        if child_fallback is None:
             abort(404, description=f"{child_model.__name__} with {child_pk_attr}={child_id} not found associated with {parent_instance.__class__.__name__} {parent_pk_name}={parent_pk_value}.")

        return child_fallback

    except AttributeError as e:
         # Parent might not have the relationship attribute, or child lacks PK attr
         # Or getattr failed on child in loop
         print(f"AttributeError in get_owned_child_or_404: {e}") # Log this
         abort(500, description=f"Internal configuration error accessing relationship or attribute: {e}")
    except ValueError as e:
        # Raised if relationship inspection fails
        print(f"ValueError in get_owned_child_or_404: {e}")
        abort(500, description=f"Internal configuration error: {e}")
    except HTTPException as e:
        # Re-raise HTTPExceptions (like 404 Not Found) so they are handled by Flask
        raise e
    except Exception as e:
         # Catch other potential DB errors during fallback query
         current_app.logger.exception(f"Unexpected error in get_owned_child_or_404 fallback query for child {child_pk_attr}={child_id}")
         abort(500, description="An unexpected error occurred while retrieving the requested item.") 