"""
General helper utilities for the Flask application.

This module provides miscellaneous helper functions that can be used across
various parts of the application, such as utility functions for common
database queries or data manipulation tasks that don't fit neatly into
a specific service or route module.
"""
from flask import abort # For raising HTTP errors
from sqlalchemy.orm import object_mapper, RelationshipProperty # For SQLAlchemy introspection
from typing import Type, TypeVar, Any
# Assuming db instance is accessible via app package. Adjust if needed.
from app import db
# from app.models import db # Common pattern in Flask apps -- THIS IS INCORRECT
from flask import current_app
from werkzeug.exceptions import HTTPException # Import HTTPException

# Import custom exceptions
from app.utils.exceptions import ChildResourceNotFoundError, ApplicationException, DatabaseError, BadRequestError

# Define a generic type variable for SQLAlchemy models.
# `TypeVar` is used for generic typing. `bound=Any` means ModelType can be any type,
# but it's typically used to represent SQLAlchemy model classes.
ModelType = TypeVar('ModelType', bound=Any) # `Any` is from `typing`

def get_owned_child_or_404(
    parent_instance: Any, # The parent SQLAlchemy model instance (e.g., a Portfolio object)
    child_relationship_name: str, # Name of the attribute on parent that lists children (e.g., "assets")
    child_id: int, # The primary key value of the child resource to find
    child_model: Type[ModelType], # The SQLAlchemy model class of the child (e.g., Asset)
    child_pk_attr: str # The name of the primary key attribute on the child model (e.g., "asset_id")
) -> ModelType: # Returns an instance of the child model if found
    """Retrieves a child entity associated with a parent, raising custom errors if not found.

    This function first attempts to find the child entity within the parent's
    eagerly loaded collection (if available). If not found there, it performs
    a direct database query, ensuring the child belongs to the given parent.

    This is useful for nested routes (e.g., /portfolios/<pid>/assets/<aid>) to
    efficiently fetch and validate ownership of a child resource.

    Args:
        parent_instance: The SQLAlchemy model instance of the parent (e.g., a specific Portfolio).
        child_relationship_name: The name of the relationship attribute on the parent
                                 model that holds the collection of child entities
                                 (e.g., 'assets' for a Portfolio model).
        child_id: The primary key value of the child entity being requested.
        child_model: The SQLAlchemy model class of the child entity (e.g., `Asset`).
        child_pk_attr: The name of the primary key attribute on the `child_model`
                       (e.g., 'asset_id' for the Asset model).

    Returns:
        The found child entity instance (of type `ModelType`).

    Raises:
        ChildResourceNotFoundError (subclass of ApplicationException, typically 404):
            If the child resource with the given ID is not found or does not belong
            to the specified parent instance.
        ApplicationException (500): For internal configuration issues (e.g., incorrect
                                   relationship name, non-standard model PK/FK setup)
                                   or unexpected database errors during the fallback query.
        AttributeError: If `parent_instance` does not have an attribute matching
                        `child_relationship_name`, or if a child object in the
                        collection does not have `child_pk_attr`. This usually
                        indicates a programming error.
        ValueError: If the SQLAlchemy relationship configuration is unexpected (e.g.,
                    parent model has a composite primary key not handled by this helper,
                    or the foreign key relationship on the child cannot be determined).
    """
    current_app.logger.debug(
        f"Attempting to get child '{child_model.__name__}' with ID '{child_id}' "
        f"for parent '{parent_instance.__class__.__name__}' (ID: {getattr(parent_instance, object_mapper(parent_instance).primary_key[0].name, 'N/A')}) "
        f"via relationship '{child_relationship_name}'."
    )
    try:
        # Stage 1: Check if the child is in an eagerly loaded collection on the parent.
        # This is an optimization to avoid a database query if the parent was fetched
        # with its children already loaded (e.g., using `joinedload` or `selectinload`).
        child_collection = getattr(parent_instance, child_relationship_name, None)
        if child_collection is not None:
            for child_instance in child_collection:
                # Check if the current child instance in the collection matches the requested child_id.
                if hasattr(child_instance, child_pk_attr) and getattr(child_instance, child_pk_attr) == child_id:
                    current_app.logger.debug(f"Child found in eagerly loaded collection: {child_instance}")
                    return child_instance # Child found in the loaded collection.

        # Stage 2: Fallback to a direct database query if not found in the loaded collection.
        # This query explicitly filters by both the child's PK and its foreign key to the parent,
        # ensuring the child belongs to THIS parent.
        current_app.logger.debug(
            f"Child not found in eager load for '{child_relationship_name}'. "
            f"Falling back to direct DB query for {child_model.__name__} ID '{child_id}'."
        )

        # Dynamically determine parent's primary key name and value for the query.
        parent_mapper = object_mapper(parent_instance)
        parent_pk_columns = parent_mapper.primary_key
        if len(parent_pk_columns) != 1: # This helper assumes single-column PKs for simplicity.
            raise ValueError(f"Parent model '{parent_instance.__class__.__name__}' must have a single primary key column for this helper.")
        parent_pk_name = parent_pk_columns[0].name
        parent_pk_value = getattr(parent_instance, parent_pk_name)

        # Introspect the relationship to find the foreign key attribute on the child model
        # that references the parent's primary key.
        relationship_property = parent_mapper.get_property(child_relationship_name)
        if not isinstance(relationship_property, RelationshipProperty):
            raise ValueError(
                f"Attribute '{child_relationship_name}' on '{parent_instance.__class__.__name__}' "
                "is not a valid SQLAlchemy relationship property."
            )

        # `remote_side` typically contains the foreign key column(s) on the child table.
        # Expecting a single FK column for a simple parent-to-child (one-to-many) relationship.
        child_foreign_key_columns = relationship_property.remote_side
        if not child_foreign_key_columns or len(child_foreign_key_columns) != 1:
            raise ValueError(
                f"Could not determine a single foreign key attribute on '{child_model.__name__}' "
                f"for relationship '{child_relationship_name}'. Verify relationship configuration "
                "(e.g., `foreign_keys`, `remote_side` arguments in `relationship()`)."
            )
        child_fk_attr_on_child_model = list(child_foreign_key_columns)[0].name

        # Construct filter conditions for the query:
        # - Child's PK must match `child_id`.
        # - Child's FK (pointing to parent) must match `parent_pk_value`.
        filter_conditions = {
            child_fk_attr_on_child_model: parent_pk_value, # Ensures child belongs to this parent
            child_pk_attr: child_id # Matches the specific child ID
        }
        
        current_app.logger.debug(f"Executing fallback query on {child_model.__name__} with filters: {filter_conditions}")
        child_instance_from_db = child_model.query.filter_by(**filter_conditions).first()

        if child_instance_from_db is None:
            # If still not found, raise a specific ChildResourceNotFoundError.
            current_app.logger.warning(
                f"Child resource '{child_model.__name__}' ID '{child_id}' not found for "
                f"parent '{parent_instance.__class__.__name__}' ID '{parent_pk_value}' via fallback query."
            )
            raise ChildResourceNotFoundError(
                child_model_name=child_model.__name__,
                child_id=child_id,
                parent_model_name=parent_instance.__class__.__name__,
                parent_id=parent_pk_value
            )
        
        current_app.logger.debug(f"Child found via fallback DB query: {child_instance_from_db}")
        return child_instance_from_db

    except AttributeError as e:
        # This error typically indicates a programming mistake:
        # - `parent_instance` might not have an attribute `child_relationship_name`.
        # - An object in `child_collection` might not have `child_pk_attr`.
        current_app.logger.error(f"AttributeError in get_owned_child_or_404: {e}. This may indicate a misconfiguration or programming error.", exc_info=True)
        raise ApplicationException(
            message=f"Internal configuration error: Problem accessing attribute for relationship or primary key. Details: {e}", 
            status_code=500
        )
    except ValueError as e:
        # This error indicates issues with the SQLAlchemy model/relationship setup
        # that this helper function cannot work with (e.g., composite PKs, unresolvable FKs).
        current_app.logger.error(f"ValueError in get_owned_child_or_404 due to model/relationship configuration: {e}", exc_info=True)
        raise ApplicationException(
            message=f"Internal configuration error: Problem with model or relationship setup. Details: {e}", 
            status_code=500
        )
    except HTTPException:
        # Re-raise HTTPExceptions (like 404 from ChildResourceNotFoundError or aborts) directly.
        raise
    except Exception as e:
        # Catch any other unexpected errors, potentially database-related during the fallback query.
        current_app.logger.exception( # Logs with full stack trace
            f"Unexpected error in get_owned_child_or_404 for child {child_model.__name__} (PK attr: {child_pk_attr}) ID '{child_id}'. Error: {e}"
        )
        # Raise a DatabaseError or a generic ApplicationException for client.
        raise DatabaseError(message="An unexpected error occurred while trying to retrieve the requested item.")