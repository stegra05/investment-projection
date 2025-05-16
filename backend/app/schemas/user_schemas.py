from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from decimal import Decimal

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserSchema(UserBase):
    id: int
    # portfolios: list = [] # Add if needed for user responses

    class Config:
        from_attributes = True

# New Schemas for User Settings
class UserSettingsSchema(BaseModel):
    default_inflation_rate: Optional[Decimal] = Field(None, ge=0, le=100, description="Default annual inflation rate as a percentage (e.g., 2.5 for 2.5%)")

    class Config:
        from_attributes = True

class UserSettingsUpdateSchema(BaseModel):
    default_inflation_rate: Optional[Decimal] = Field(None, ge=0, le=100, description="Default annual inflation rate as a percentage (e.g., 2.5 for 2.5%)")
    # Add other updatable settings here in the future 