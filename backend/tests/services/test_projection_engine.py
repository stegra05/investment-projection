import pytest
import datetime
from decimal import Decimal
from dateutil.relativedelta import relativedelta
from app.services.projection_engine import calculate_projection
from app.models import Portfolio, Asset, PlannedFutureChange # Need models to create test data
from app.enums import AssetType, ChangeType # <-- Import ChangeType

# Tolerance for comparing Decimal values
DECIMAL_TOLERANCE = Decimal('0.01')

@pytest.fixture
def setup_portfolio_no_changes(db, test_user):
    """Portfolio with one asset, 5% return, no planned changes."""
    portfolio = Portfolio(user_id=test_user.id, name="Simple Growth Portfolio")
    asset = Asset(
        portfolio=portfolio,
        name_or_ticker="Growth Stock",
        asset_type=AssetType.STOCK, # <-- Use Enum member
        allocation_value=Decimal("10000.00"),
        manual_expected_return=Decimal("5.0") # 5% annual return
    )
    db.session.add_all([portfolio, asset])
    db.session.commit()
    return portfolio

@pytest.fixture
def setup_portfolio_with_contributions(db, test_user):
    """Portfolio with one asset (10k@6%), and monthly contributions."""
    portfolio = Portfolio(user_id=test_user.id, name="Contribution Portfolio")
    asset = Asset(
        portfolio=portfolio,
        name_or_ticker="Index Fund",
        asset_type=AssetType.STOCK, # <-- Use Enum member
        allocation_value=Decimal("10000.00"),
        manual_expected_return=Decimal("6.0") # 6% annual return
    )
    # Add monthly contributions for 1 year
    changes = []
    start_date = datetime.date.today().replace(day=15) # Mid-month
    for i in range(12):
        change_date = start_date + relativedelta(months=i)
        change = PlannedFutureChange(
            portfolio=portfolio,
            change_date=change_date,
            change_type=ChangeType.CONTRIBUTION, # <-- Use Enum member
            amount=Decimal("200.00")
        )
        changes.append(change)

    db.session.add_all([portfolio, asset] + changes)
    db.session.commit()
    return portfolio

@pytest.fixture
def setup_portfolio_with_withdrawals(db, test_user):
    """Portfolio with one asset (20k@4%), and monthly withdrawals."""
    portfolio = Portfolio(user_id=test_user.id, name="Withdrawal Portfolio")
    asset = Asset(
        portfolio=portfolio,
        name_or_ticker="Bond Fund",
        asset_type=AssetType.BOND, # <-- Use Enum member
        allocation_value=Decimal("20000.00"),
        manual_expected_return=Decimal("4.0") # 4% annual return
    )
    # Add monthly withdrawals starting in 3 months for 6 months
    changes = []
    start_date = datetime.date.today().replace(day=10) + relativedelta(months=3)
    for i in range(6):
        change_date = start_date + relativedelta(months=i)
        change = PlannedFutureChange(
            portfolio=portfolio,
            change_date=change_date,
            change_type=ChangeType.WITHDRAWAL, # <-- Use Enum member
            amount=Decimal("150.00")
        )
        changes.append(change)

    db.session.add_all([portfolio, asset] + changes)
    db.session.commit()
    return portfolio

@pytest.fixture
def setup_portfolio_mixed_assets(db, test_user):
    """Portfolio with multiple assets, different returns, % allocation, and contribution."""
    portfolio = Portfolio(user_id=test_user.id, name="Mixed Portfolio")
    # Note: % allocation requires initial_total_value passed to calculate_projection
    asset1 = Asset(
        portfolio=portfolio,
        name_or_ticker="Aggressive Stock",
        asset_type=AssetType.STOCK, # <-- Use Enum member
        allocation_percentage=Decimal("60.0"), # 60%
        manual_expected_return=Decimal("8.0")  # 8% annual
    )
    asset2 = Asset(
        portfolio=portfolio,
        name_or_ticker="Stable Bond",
        asset_type=AssetType.BOND, # <-- Use Enum member
        allocation_percentage=Decimal("40.0"), # 40%
        manual_expected_return=Decimal("3.0")  # 3% annual
    )
    change = PlannedFutureChange(
        portfolio=portfolio,
        change_date=datetime.date.today().replace(day=5) + relativedelta(months=2),
        change_type=ChangeType.CONTRIBUTION, # <-- Use Enum member
        amount=Decimal("1000.00")
    )
    db.session.add_all([portfolio, asset1, asset2, change])
    db.session.commit()
    return portfolio

# --- calculate_projection Tests ---

def test_projection_simple_growth(db, app, setup_portfolio_no_changes):
    """Test projection with only growth, no cash flows."""
    portfolio = setup_portfolio_no_changes
    start_date = datetime.date.today()
    end_date = start_date + relativedelta(years=1) - relativedelta(days=1) # 1 year projection
    initial_value = Decimal("10000.00")

    # Need app context for DB access within the function
    with app.app_context():
        results = calculate_projection(portfolio.portfolio_id, start_date, end_date, initial_value)

    assert len(results) == 13 # Start date + 12 months
    assert results[0][0] == start_date
    assert abs(results[0][1] - initial_value) < DECIMAL_TOLERANCE

    # Check end value - roughly 10000 * (1 + 0.05) = 10500
    # Monthly rate approx (1.05)^(1/12) - 1 = 0.004074
    # Approximate manual calculation for 12 months: 10000 * (1 + 0.004074)^12 ~= 10500
    final_value = results[-1][1]
    expected_final_value = initial_value * (Decimal('1.05')) # Approximate annual growth
    # Allow slightly larger tolerance due to monthly compounding difference
    assert abs(final_value - expected_final_value) < Decimal('1.0')
    # Check monotonicity (value should generally increase)
    assert all(results[i][1] <= results[i+1][1] for i in range(len(results)-1))

def test_projection_with_contributions(db, app, setup_portfolio_with_contributions):
    """Test projection including growth and regular contributions."""
    portfolio = setup_portfolio_with_contributions
    start_date = datetime.date.today().replace(day=1)
    end_date = start_date + relativedelta(years=1) - relativedelta(days=1)
    initial_value = Decimal("10000.00")

    with app.app_context():
        results = calculate_projection(portfolio.portfolio_id, start_date, end_date, initial_value)

    assert len(results) == 13
    assert results[0][0] == start_date
    assert abs(results[0][1] - initial_value) < DECIMAL_TOLERANCE

    # End value should be significantly higher than simple growth due to contributions
    # Approx: 10000 * 1.06 (growth) + 12 * 200 (contributions) + growth on contributions
    # Should be > 10600 + 2400 = 13000
    final_value = results[-1][1]
    assert final_value > Decimal("13000.00")
    # Check monotonicity (value should increase)
    assert all(results[i][1] <= results[i+1][1] for i in range(len(results)-1))

def test_projection_with_withdrawals(db, app, setup_portfolio_with_withdrawals):
    """Test projection including growth and regular withdrawals."""
    portfolio = setup_portfolio_with_withdrawals
    start_date = datetime.date.today().replace(day=1)
    end_date = start_date + relativedelta(years=1) - relativedelta(days=1)
    initial_value = Decimal("20000.00")

    with app.app_context():
        results = calculate_projection(portfolio.portfolio_id, start_date, end_date, initial_value)

    assert len(results) == 13
    assert results[0][0] == start_date
    assert abs(results[0][1] - initial_value) < DECIMAL_TOLERANCE

    # End value should be lower than simple growth due to withdrawals
    # Approx: 20000 * 1.04 (growth) - 6 * 150 (withdrawals) - lost growth on withdrawals
    # Should be < 20800 - 900 = 19900
    final_value = results[-1][1]
    simple_growth_final = initial_value * Decimal('1.04')
    assert final_value < simple_growth_final
    assert final_value < Decimal("20000.00") # Expect overall decrease with these numbers


def test_projection_mixed_assets_percentage(db, app, setup_portfolio_mixed_assets):
    """Test projection with percentage-based assets and initial value."""
    portfolio = setup_portfolio_mixed_assets
    start_date = datetime.date.today().replace(day=1)
    end_date = start_date + relativedelta(years=1) - relativedelta(days=1)
    initial_value = Decimal("50000.00") # NEED initial value for % allocation

    with app.app_context():
        results = calculate_projection(portfolio.portfolio_id, start_date, end_date, initial_value)

    assert len(results) == 13
    assert results[0][0] == start_date
    assert abs(results[0][1] - initial_value) < DECIMAL_TOLERANCE

    # Check growth reflects weighted average + contribution
    # Weighted avg return approx (0.6 * 8%) + (0.4 * 3%) = 4.8% + 1.2% = 6%
    # Final value approx 50000 * 1.06 + 1000 contribution + growth on contribution
    # Should be > 53000 + 1000 = 54000
    final_value = results[-1][1]
    assert final_value > Decimal("54000.00")

def test_projection_zero_initial_value_with_contributions(db, app, test_user):
    """Test projection starting from zero with only contributions."""
    portfolio = Portfolio(user_id=test_user.id, name="Zero Start Portfolio")
    asset = Asset(portfolio=portfolio, name_or_ticker="Savings", asset_type=AssetType.CASH, allocation_value=Decimal("0.0"), manual_expected_return=Decimal("1.0")) # <-- Use Enum member
    changes = []
    start_contrib_date = datetime.date.today().replace(day=15)
    for i in range(6):
        change = PlannedFutureChange(portfolio=portfolio, change_date=start_contrib_date+relativedelta(months=i), change_type=ChangeType.CONTRIBUTION, amount=Decimal("100.00")) # <-- Use Enum member
        changes.append(change)
    db.session.add_all([portfolio, asset] + changes)
    db.session.commit()

    start_date = datetime.date.today().replace(day=1)
    end_date = start_date + relativedelta(years=1) - relativedelta(days=1)
    initial_value = Decimal("0.00")

    with app.app_context():
        results = calculate_projection(portfolio.portfolio_id, start_date, end_date, initial_value)

    assert len(results) == 13
    assert abs(results[0][1] - initial_value) < DECIMAL_TOLERANCE

    # Final value should be slightly more than total contributions (6 * 100) due to minor growth
    total_contributions = Decimal("600.00")
    final_value = results[-1][1]
    assert final_value > total_contributions
    assert abs(final_value - total_contributions) < Decimal("10.0") # Allow some room for growth

def test_projection_portfolio_not_found(db, app):
    """Test projection raises ValueError for non-existent portfolio ID."""
    start_date = datetime.date.today()
    end_date = start_date + relativedelta(years=1)

    with app.app_context():
        with pytest.raises(ValueError, match="Portfolio with id 9999 not found."):
            calculate_projection(9999, start_date, end_date, Decimal("1000"))

# TODO: Add tests for edge cases:
# - Very long projection periods
# - Negative returns
# - Withdrawals exceeding portfolio value (should it go negative or stop at zero?)
# - Reallocation change types (if implemented)
# - Assets with allocation_percentage but no initial_total_value provided
# - Assets with neither value nor percentage

# --- calculate_projection Tests --- 