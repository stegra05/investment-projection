from pydantic import BaseModel, Field
from typing import Optional
from datetime import date
from decimal import Decimal

from app.schemas.portfolio_schemas import OrmBaseModel  # Import the base model

class RiskProfileSchema(OrmBaseModel):
    """
    Schema for portfolio risk profile analysis.
    """
    risk_score: float = Field(
        ...,
        ge=0,
        le=1,
        description="Overall risk score between 0 (lowest risk) and 1 (highest risk)",
        example=0.75
    )
    volatility_estimate: Optional[float] = Field(
        None,
        ge=0,
        description="Estimated annualized volatility (standard deviation of returns)",
        example=0.15
    )
    sharpe_ratio: Optional[float] = Field(
        None,
        description="Risk-adjusted return measure (higher is better)",
        example=1.2
    )
    confidence_interval_low_95: Optional[float] = Field(
        None,
        description="Lower bound of 95% confidence interval for expected returns",
        example=-0.05
    )
    confidence_interval_high_95: Optional[float] = Field(
        None,
        description="Upper bound of 95% confidence interval for expected returns",
        example=0.25
    )
    calculation_date: date = Field(
        ...,
        description="Date when the risk analysis was calculated",
        example="2024-03-21"
    ) 