from pydantic import BaseModel, Field, validator, condecimal
from pydantic.alias_generators import to_camel
from typing import List, Optional, Dict
from datetime import date
from decimal import Decimal

from app.enums import AssetType, ChangeType, FrequencyType, MonthOrdinalType, OrdinalDayType, EndsOnType

# --- Base Schemas (for common fields/config) ---
class OrmBaseModel(BaseModel):
    model_config = {
        "from_attributes": True,
        "populate_by_name": True,
        "str_strip_whitespace": True
    }

# --- Planned Change Schemas ---
class PlannedChangeBase(OrmBaseModel):
    change_type: ChangeType = Field(..., example=ChangeType.CONTRIBUTION)
    change_date: date = Field(..., example="2024-08-15")
    amount: Optional[condecimal(max_digits=15, decimal_places=2)] = Field(None, example="500.00")
    description: Optional[str] = Field(None, example="Monthly savings addition")
    target_allocation_json: Optional[Dict] = Field(None, example={"asset_id_1": 0.5, "asset_id_2": 0.5})

    # Recurrence fields
    is_recurring: bool = Field(default=False)
    frequency: FrequencyType = Field(default=FrequencyType.ONE_TIME)
    interval: int = Field(default=1, ge=1)
    days_of_week: Optional[List[int]] = Field(default=None, example=[0, 2, 4]) # Mon, Wed, Fri
    day_of_month: Optional[int] = Field(default=None, ge=1, le=31)
    month_ordinal: Optional[MonthOrdinalType] = Field(default=None)
    month_ordinal_day: Optional[OrdinalDayType] = Field(default=None)
    month_of_year: Optional[int] = Field(default=None, ge=1, le=12)
    ends_on_type: EndsOnType = Field(default=EndsOnType.NEVER)
    ends_on_occurrences: Optional[int] = Field(default=None, ge=1)
    ends_on_date: Optional[date] = Field(default=None)

    model_config = {
        "alias_generator": to_camel,
        "populate_by_name": True,
        "from_attributes": True
    }

    # TODO: Add validators for conditional recurrence fields (e.g., days_of_week only if frequency is WEEKLY)

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
    target_allocation_json: Optional[Dict] = Field(None, example={"asset_id_1": 0.5, "asset_id_2": 0.5})

    # Recurrence fields (Optional for update)
    is_recurring: Optional[bool] = Field(None)
    frequency: Optional[FrequencyType] = Field(None)
    interval: Optional[int] = Field(None, ge=1)
    days_of_week: Optional[List[int]] = Field(None, example=[0, 2, 4])
    day_of_month: Optional[int] = Field(None, ge=1, le=31)
    month_ordinal: Optional[MonthOrdinalType] = Field(None)
    month_ordinal_day: Optional[OrdinalDayType] = Field(None)
    month_of_year: Optional[int] = Field(None, ge=1, le=12)
    ends_on_type: Optional[EndsOnType] = Field(None)
    ends_on_occurrences: Optional[int] = Field(None, ge=1)
    ends_on_date: Optional[date] = Field(None)

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
    # Recurrence fields are inherited from PlannedChangeBase, so they will be part of the response schema

# --- Asset Schemas ---
class AssetBase(OrmBaseModel):
    asset_type: AssetType = Field(..., example=AssetType.STOCK)
    name_or_ticker: Optional[str] = Field(None, alias='name', example="AAPL")
    allocation_percentage: Optional[condecimal(max_digits=5, decimal_places=2)] = Field(None, ge=0, le=100, example="60.50")
    allocation_value: Optional[condecimal(max_digits=15, decimal_places=2)] = Field(None, ge=0, example="10000.00")
    manual_expected_return: Optional[condecimal(max_digits=5, decimal_places=2)] = Field(None, example="7.5")

class AssetCreateSchema(AssetBase):
    pass # Fields inherited from AssetBase
    # Validator removed: check_allocation_exclusivity
    # Logic is now: if neither allocation_percentage nor allocation_value is provided,
    # the route will default allocation_percentage to 0.
    # If one is provided, the model validator ensures the other is None.

class AssetUpdateSchema(AssetBase):
    asset_type: Optional[AssetType] = Field(None, example=AssetType.STOCK)
    name_or_ticker: Optional[str] = Field(None, alias='name', example="AAPL")
    allocation_percentage: Optional[condecimal(max_digits=5, decimal_places=2)] = Field(None, ge=0, le=100, example="60.50")
    allocation_value: Optional[condecimal(max_digits=15, decimal_places=2)] = Field(None, ge=0, example="10000.00")
    manual_expected_return: Optional[condecimal(max_digits=5, decimal_places=2)] = Field(None, example="7.5")

    # No validator here as exclusivity is handled in the route during update logic
    # (setting one field to None when the other is updated)

class AssetSchema(AssetBase):
    asset_id: int = Field(..., alias='id')
    portfolio_id: int

# --- NEW: Schemas for Bulk Allocation Update ---
class AssetAllocationSchema(OrmBaseModel):
    asset_id: int = Field(..., example=101)
    # Ensure allocation is non-negative, max handled by DB/model
    allocation_percentage: condecimal(max_digits=5, decimal_places=2, ge=0, le=100) = Field(..., example="45.50")

class BulkAllocationUpdateSchema(OrmBaseModel):
    allocations: List[AssetAllocationSchema]

    @validator('allocations')
    def check_total_allocation(cls, v):
        if not v: # Handle empty list case
            # Depending on requirements, could raise error or allow (if portfolio has no assets)
            # For now, let's assume an empty list might be valid if the portfolio has 0 assets, route will handle
            return v

        total = sum(item.allocation_percentage for item in v)
        # Allow for minor floating point inaccuracies
        if not (Decimal('99.99') <= total <= Decimal('100.01')):
            raise ValueError(f"Total allocation percentage must sum to 100%. Current sum: {total:.2f}%")
        return v

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
    # Add calculated total value field
    total_value: Optional[Decimal] = Field(None, alias='totalValue')
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