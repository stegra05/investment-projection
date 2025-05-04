from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

# Import the base model if it exists and is needed, otherwise define directly
# Assuming OrmBaseModel might be defined elsewhere or use BaseModel directly
try:
    # Attempt to import a shared base model if it exists (like portfolio_schemas.py)
    from .portfolio_schemas import OrmBaseModel
except ImportError:
    # Fallback to standard Pydantic BaseModel if OrmBaseModel is not found/needed
    class OrmBaseModel(BaseModel):
        class Config:
            from_attributes = True # Pydantic v2+ way to read from ORM models

# --- User Registration Schema ---
class UserRegistrationSchema(BaseModel):
    username: str = Field(..., min_length=3, max_length=64, example="newuser")
    email: EmailStr = Field(..., example="user@example.com")
    password: str = Field(..., min_length=8, example="Str0ngP@sswOrd!")
    # Add confirm_password if required by frontend/logic, otherwise omit
    # confirm_password: str = Field(..., min_length=8)

    # Add password complexity validation if not handled solely in the route
    # @validator('password')
    # def password_complexity(cls, v):
    #     # Re-use or adapt complexity checks from auth route if needed here
    #     # Example: Check length, uppercase, lowercase, digit, special char
    #     if len(v) < 8:
    #         raise ValueError('Password must be at least 8 characters long')
    #     # ... add other checks ...
    #     return v

    # Add validator if confirm_password is used
    # @validator('confirm_password')
    # def passwords_match(cls, v, values):
    #     if 'password' in values and v != values['password']:
    #         raise ValueError('Passwords do not match')
    #     return v

    class Config:
        # Example for Pydantic v1: orm_mode = True
        # Pydantic v2 uses from_attributes in the base model (OrmBaseModel)
        pass


# --- User Login Schema ---
class UserLoginSchema(BaseModel):
    # Allow login via either username or email
    username_or_email: str = Field(..., example="newuser or user@example.com")
    password: str = Field(..., example="Str0ngP@sswOrd!")


# --- User Schema (for returning user data) ---
class UserSchema(OrmBaseModel): # Inherit from OrmBaseModel for ORM compatibility
    id: int = Field(..., example=1)
    username: str = Field(..., example="newuser")
    email: EmailStr = Field(..., example="user@example.com")
    created_at: datetime = Field(..., example="2023-10-27T10:30:00")

    # Configuration inherited from OrmBaseModel (for from_attributes=True)

# Optional: Schema for Token response if needed separately
# class TokenSchema(BaseModel):
#     access_token: str
#     refresh_token: str
#     token_type: str = "bearer" 