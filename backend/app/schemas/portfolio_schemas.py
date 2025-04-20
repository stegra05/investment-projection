from pydantic import BaseModel, Field, validator, condecimal
from typing import List, Optional
from datetime import date
from decimal import Decimal

# --- Base Schemas (for common fields/config) ---
class OrmBaseModel(BaseModel):
    class Config:
        orm_mode = True # Enable reading data directly from ORM models
        allow_population_by_field_name = True
        anystr_strip_whitespace = True # Strip whitespace from strings

# --- Planned Change Schemas ---
class PlannedChangeBase(OrmBaseModel):
    change_type: str = Field(..., example="Contribution")
    change_date: date = Field(..., example="2024-08-15")
    amount: Optional[condecimal(max_digits=15, decimal_places=2)] = Field(None, example="500.00")
    description: Optional[str] = Field(None, example="Monthly savings addition")

class PlannedChangeCreateSchema(PlannedChangeBase):
    # Add specific validation for creation if needed, e.g., based on change_type
    @validator('amount')
    def amount_required_for_contribution_withdrawal(cls, v, values):
        change_type = values.get('change_type')
        if change_type in ['Contribution', 'Withdrawal'] and v is None:
            raise ValueError(f"'{change_type}' requires an 'amount'.")
        if change_type == 'Reallocation' and v is not None:
            raise ValueError("'Reallocation' change type should not include an 'amount'.")
        return v

class PlannedChangeUpdateSchema(PlannedChangeBase):
    # Make fields optional for PATCH updates
    change_type: Optional[str] = Field(None, example="Contribution")
    change_date: Optional[date] = Field(None, example="2024-08-15")
    # Amount can be explicitly set to None
    amount: Optional[condecimal(max_digits=15, decimal_places=2)] = Field(None, example="500.00")
    description: Optional[str] = Field(None, example="Monthly savings addition")

    # Re-validate consistency on update
    @validator('amount')
    def check_amount_consistency(cls, v, values):
        change_type = values.get('change_type')
        if change_type in ['Contribution', 'Withdrawal'] and v is None:
            # This check might depend on whether change_type is also being updated.
            # For simplicity, assume if amount is provided, it must be valid for the *intended* type.
            # More complex validation might be needed depending on PATCH semantics.
            pass # Allow setting to None if change_type isn't specified or changing to Reallocation?
        elif change_type == 'Reallocation' and v is not None:
            raise ValueError("'Reallocation' change type should not include an 'amount'.")
        return v

class PlannedChangeSchema(PlannedChangeBase):
    change_id: int
    portfolio_id: int

# --- Asset Schemas ---
class AssetBase(OrmBaseModel):
    asset_type: str = Field(..., example="Stock")
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
    # Make fields optional for PATCH updates
    asset_type: Optional[str] = Field(None, example="Stock")
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
    planned_changes: Optional[List[PlannedChangeSchema]] = Field([], alias='changes') # Match ORM relationship name if different

    class Config(OrmBaseModel.Config):
        # Ensure nested models are also processed from ORM
        pass

# Update Forward Refs if needed (often automatic in newer Pydantic/Python)
# PortfolioSchema.update_forward_refs()
# AssetSchema.update_forward_refs()
# PlannedChangeSchema.update_forward_refs() 