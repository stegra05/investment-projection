from pydantic import BaseModel, Field, validator, condecimal
from typing import List, Optional
from datetime import date
from decimal import Decimal

from app.enums import AssetType, ChangeType # Import Enums

# --- Base Schemas (for common fields/config) ---
class OrmBaseModel(BaseModel):
    class Config:
        from_attributes = True  # Enable reading data directly from ORM models (Pydantic V2)
        populate_by_name = True # Replaces allow_population_by_field_name
        str_strip_whitespace = True # Replaces anystr_strip_whitespace

# --- Planned Change Schemas ---
class PlannedChangeBase(OrmBaseModel):
    change_type: ChangeType = Field(..., example=ChangeType.CONTRIBUTION)
    change_date: date = Field(..., example="2024-08-15")
    amount: Optional[condecimal(max_digits=15, decimal_places=2)] = Field(None, example="500.00")
    description: Optional[str] = Field(None, example="Monthly savings addition")

class PlannedChangeCreateSchema(PlannedChangeBase):
    @validator('amount')
    def amount_required_for_contribution_withdrawal(cls, v, values):
        change_type = values.get('change_type')
        if change_type in [ChangeType.CONTRIBUTION, ChangeType.WITHDRAWAL] and v is None:
            raise ValueError(f"'{change_type.value}' requires an 'amount'.")
        if change_type == ChangeType.REALLOCATION and v is not None:
            raise ValueError(f"'{ChangeType.REALLOCATION.value}' change type should not include an 'amount'.")
        return v

class PlannedChangeUpdateSchema(PlannedChangeBase):
    change_type: Optional[ChangeType] = Field(None, example=ChangeType.CONTRIBUTION)
    change_date: Optional[date] = Field(None, example="2024-08-15")
    amount: Optional[condecimal(max_digits=15, decimal_places=2)] = Field(None, example="500.00")
    description: Optional[str] = Field(None, example="Monthly savings addition")

    @validator('amount')
    def check_amount_consistency(cls, v, values):
        change_type = values.get('change_type')
        if change_type in [ChangeType.CONTRIBUTION, ChangeType.WITHDRAWAL] and v is None:
            pass
        elif change_type == ChangeType.REALLOCATION and v is not None:
            raise ValueError(f"'{ChangeType.REALLOCATION.value}' change type should not include an 'amount'.")
        return v

class PlannedChangeSchema(PlannedChangeBase):
    change_id: int
    portfolio_id: int

# --- Asset Schemas ---
class AssetBase(OrmBaseModel):
    asset_type: AssetType = Field(..., example=AssetType.STOCK)
    name_or_ticker: Optional[str] = Field(None, example="AAPL")
    allocation_percentage: Optional[condecimal(max_digits=5, decimal_places=2)] = Field(None, ge=0, le=100, example="60.50")
    allocation_value: Optional[condecimal(max_digits=15, decimal_places=2)] = Field(None, ge=0, example="10000.00")
    manual_expected_return: Optional[condecimal(max_digits=5, decimal_places=2)] = Field(None, example="7.5")

class AssetCreateSchema(AssetBase):
    @validator('allocation_value')
    def check_allocation_exclusivity(cls, v, values):
        if v is not None and values.get('allocation_percentage') is not None:
            raise ValueError("Provide either allocation_percentage or allocation_value, not both.")
        if v is None and values.get('allocation_percentage') is None:
            raise ValueError("Either allocation_percentage or allocation_value must be provided.")
        return v

class AssetUpdateSchema(AssetBase):
    asset_type: Optional[AssetType] = Field(None, example=AssetType.STOCK)
    name_or_ticker: Optional[str] = Field(None, example="AAPL")
    allocation_percentage: Optional[condecimal(max_digits=5, decimal_places=2)] = Field(None, ge=0, le=100, example="60.50")
    allocation_value: Optional[condecimal(max_digits=15, decimal_places=2)] = Field(None, ge=0, example="10000.00")
    manual_expected_return: Optional[condecimal(max_digits=5, decimal_places=2)] = Field(None, example="7.5")

    # No validator here as exclusivity is handled in the route during update logic
    # (setting one field to None when the other is updated)

class AssetSchema(AssetBase):
    asset_id: int
    portfolio_id: int

# --- Portfolio Schemas ---
class PortfolioBase(OrmBaseModel):
    name: str = Field(..., min_length=1, example="My Retirement Fund")
    description: Optional[str] = Field(None, example="Long term growth portfolio")

class PortfolioCreateSchema(PortfolioBase):
    pass # Inherits fields and validation from Base

class PortfolioUpdateSchema(PortfolioBase):
    # Make fields optional for PATCH updates
    name: Optional[str] = Field(None, min_length=1, example="My Retirement Fund")
    description: Optional[str] = Field(None, example="Long term growth portfolio")

class PortfolioSchema(PortfolioBase):
    portfolio_id: int
    user_id: int
    # Include nested details when serializing
    assets: Optional[List[AssetSchema]] = []
    planned_changes: Optional[List[PlannedChangeSchema]] = [] # Removed alias='changes'

    # Config is now inherited correctly from OrmBaseModel
    # class Config(OrmBaseModel.Config):
    #     # Ensure nested models are also processed from ORM
    #     # from_attributes = True # Now inherited
    #     pass

# Update Forward Refs if needed (often automatic in newer Pydantic/Python)
# PortfolioSchema.update_forward_refs()
# AssetSchema.update_forward_refs()
# PlannedChangeSchema.update_forward_refs() 