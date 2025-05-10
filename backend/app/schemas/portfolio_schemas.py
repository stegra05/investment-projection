from pydantic import BaseModel, Field, validator, condecimal
from pydantic.alias_generators import to_camel
from typing import List, Optional, Dict
from datetime import date
from decimal import Decimal
from pydantic import BaseModel, Field, field_validator, condecimal, ValidationInfo

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

    @field_validator('days_of_week', mode='before')
    def check_days_of_week(cls, v, info: ValidationInfo):
        is_recurring = info.data.get('is_recurring')
        frequency = info.data.get('frequency')
        if is_recurring and frequency == FrequencyType.WEEKLY and not v:
            raise ValueError("For weekly recurrence, 'days_of_week' must be specified.")
        if is_recurring and frequency != FrequencyType.WEEKLY and v:
            raise ValueError("'days_of_week' can only be specified for weekly recurrence.")
        if not is_recurring and v:
            raise ValueError("'days_of_week' cannot be specified if 'is_recurring' is false.")
        return v

    @field_validator('day_of_month', mode='before')
    def check_day_of_month(cls, v, info: ValidationInfo):
        is_recurring = info.data.get('is_recurring')
        frequency = info.data.get('frequency')
        month_ordinal = info.data.get('month_ordinal')

        if is_recurring and frequency in [FrequencyType.MONTHLY, FrequencyType.YEARLY]:
            if month_ordinal is None and v is None:
                 if frequency == FrequencyType.MONTHLY:
                    raise ValueError("For monthly recurrence without ordinal, 'day_of_month' must be specified.")
            if month_ordinal is not None and v is not None:
                 raise ValueError("'day_of_month' cannot be specified if 'month_ordinal' is used.")
        elif is_recurring and v is not None:
            raise ValueError(f"'day_of_month' can only be specified for monthly or yearly recurrence, not {frequency}.")
        elif not is_recurring and v is not None:
             raise ValueError("'day_of_month' cannot be specified if 'is_recurring' is false.")
        return v

    @field_validator('month_ordinal', 'month_ordinal_day', mode='before')
    def check_month_ordinal_pair(cls, v, info: ValidationInfo):
        is_recurring = info.data.get('is_recurring')
        frequency = info.data.get('frequency')
        month_ordinal = info.data.get('month_ordinal')
        month_ordinal_day = info.data.get('month_ordinal_day')

        if is_recurring and frequency in [FrequencyType.MONTHLY, FrequencyType.YEARLY]:
            if month_ordinal and not month_ordinal_day:
                raise ValueError("'month_ordinal_day' must be specified if 'month_ordinal' is used.")
            if month_ordinal_day and not month_ordinal:
                raise ValueError("'month_ordinal' must be specified if 'month_ordinal_day' is used.")
            if (month_ordinal or month_ordinal_day) and info.data.get('day_of_month') is not None:
                raise ValueError("Cannot use 'month_ordinal'/'month_ordinal_day' with 'day_of_month'.")
        elif is_recurring and v is not None:
            raise ValueError(f"'{info.field_name}' can only be specified for monthly or yearly recurrence, not {frequency}.")
        elif not is_recurring and v is not None:
            raise ValueError(f"'{info.field_name}' cannot be specified if 'is_recurring' is false.")
        return v

    @field_validator('month_of_year', mode='before')
    def check_month_of_year(cls, v, info: ValidationInfo):
        is_recurring = info.data.get('is_recurring')
        frequency = info.data.get('frequency')
        if is_recurring and frequency == FrequencyType.YEARLY and v is None:
            raise ValueError("For yearly recurrence, 'month_of_year' must be specified.")
        if is_recurring and frequency != FrequencyType.YEARLY and v:
            raise ValueError("'month_of_year' can only be specified for yearly recurrence.")
        if not is_recurring and v:
            raise ValueError("'month_of_year' cannot be specified if 'is_recurring' is false.")
        return v

    # TODO: Add validators for conditional recurrence fields (e.g., days_of_week only if frequency is WEEKLY)

class PlannedChangeCreateSchema(PlannedChangeBase):
    @field_validator('amount', mode='before')
    def amount_required_for_contribution_withdrawal(cls, v, info: ValidationInfo):
        change_type = info.data.get('change_type')
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

    @field_validator('amount', mode='before')
    def check_amount_consistency(cls, v, info: ValidationInfo):
        change_type = info.data.get('change_type')
        if change_type in [ChangeType.CONTRIBUTION, ChangeType.WITHDRAWAL] and v is None:
            pass
        elif change_type == ChangeType.REALLOCATION and v is not None:
            raise ValueError(f"'{ChangeType.REALLOCATION.value}' change type should not include an 'amount'.")
        return v

class PlannedChangeSchema(PlannedChangeBase):
    change_id: int = Field(..., alias='id')
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

    @field_validator('allocations')
    def check_total_allocation(cls, v):
        if not v:
            return v

        total = sum(item.allocation_percentage for item in v)
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
    #     pass

# Update Forward Refs if needed (often automatic in newer Pydantic/Python)
# PortfolioSchema.update_forward_refs()
# AssetSchema.update_forward_refs()
# PlannedChangeSchema.update_forward_refs() 