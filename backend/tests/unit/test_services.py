import pytest
from unittest.mock import MagicMock, patch
from datetime import date, datetime, timedelta
from decimal import Decimal

# Functions to test
from app.services.analytics_service import calculate_historical_performance
from app.services.analytics_service import _calculate_initial_portfolio_state, _get_current_day_allocations, \
                                         _calculate_portfolio_daily_return_rate, _apply_daily_cash_flows, \
                                         _apply_daily_growth_and_cash_flow

# Models and Enums that might be part of the data structures
from app.models.portfolio import Portfolio 
# Asset, PlannedFutureChange are not directly used by calculate_historical_performance, 
# but their data structures are returned by mocked functions.
from app.enums import AssetTypes, Currencies, ChangeTypes 

# --- Mocks for data preparation functions ---
# These functions are imported into analytics_service.py, so we patch them there.

@pytest.fixture
def mock_fetch_asset_data():
    with patch('app.services.analytics_service.fetch_and_process_asset_data') as mock:
        yield mock

@pytest.fixture
def mock_fetch_reallocations():
    with patch('app.services.analytics_service.fetch_and_process_reallocations') as mock:
        yield mock

@pytest.fixture
def mock_get_daily_changes():
    with patch('app.services.analytics_service.get_daily_changes') as mock:
        yield mock

# --- Test for calculate_historical_performance ---

def test_calculate_historical_performance_simple_scenario(
    mock_fetch_asset_data, mock_fetch_reallocations, mock_get_daily_changes
):
    """
    Test calculate_historical_performance with a simple scenario:
    - Portfolio created on start_date.
    - One asset with constant expected return.
    - One contribution on the first day.
    - No reallocations.
    - Calculation period of 3 days.
    """
    portfolio_id = 1
    start_date = date(2023, 1, 1)
    end_date = date(2023, 1, 3)
    
    mock_portfolio = MagicMock(spec=Portfolio)
    mock_portfolio.id = portfolio_id
    mock_portfolio.created_at = start_date # Portfolio created on start_date

    # Mock return values for data preparation functions
    # 1. Assets Data
    mock_fetch_asset_data.return_value = {
        1: { # asset_id = 1
            "created_at": start_date,
            "base_allocation_percentage": Decimal('1.0'), # 100% allocated to this asset
            "manual_expected_return": Decimal('10.0') # 10% annual return
        }
    }
    # 2. Reallocations Data
    mock_fetch_reallocations.return_value = [] # No reallocations

    # 3. Daily Changes Data
    initial_contribution = Decimal('1000.0')
    mock_get_daily_changes.return_value = {
        start_date: [{
            "type": "Contribution", "amount": initial_contribution
        }]
    }

    # Call the function to test
    performance_data = calculate_historical_performance(mock_portfolio, start_date, end_date, portfolio_id)

    # Assertions
    assert mock_fetch_asset_data.called_once_with(portfolio_id)
    assert mock_fetch_reallocations.called_once_with(portfolio_id, end_date)
    assert mock_get_daily_changes.called_once_with(portfolio_id, end_date)
    
    assert len(performance_data) == 3 # For 3 days: Jan 1, Jan 2, Jan 3

    # Day 1 (2023-01-01)
    # Value starts at 0, contribution of 1000. Growth is applied *after* contribution on current value.
    # Initial value = 0. Contribution = 1000. Value after contribution = 1000.
    # Net contributions = 1000.
    # Daily return rate for 10% annual: (1 + 0.10)^(1/365) - 1 approx 0.000261158
    # Growth on day 1: 1000 * 0.000261158 = 0.261158
    # Value at end of day 1: 1000 + 0.261158 = 1000.261158
    # Cumulative return: (1000.261158 - 1000) / 1000 = 0.000261
    day1_data = performance_data[0]
    assert day1_data["date"] == "2023-01-01"
    assert abs(day1_data["cumulative_return"] - 0.000261) < 1e-5 

    # Day 2 (2023-01-02)
    # Value at start of day 2: 1000.261158. Net contributions = 1000.
    # Growth on day 2: 1000.261158 * 0.000261158 = 0.261226
    # Value at end of day 2: 1000.261158 + 0.261226 = 1000.522384
    # Cumulative return: (1000.522384 - 1000) / 1000 = 0.000522
    day2_data = performance_data[1]
    assert day2_data["date"] == "2023-01-02"
    assert abs(day2_data["cumulative_return"] - 0.000522) < 1e-5

    # Day 3 (2023-01-03)
    # Value at start of day 3: 1000.522384. Net contributions = 1000.
    # Growth on day 3: 1000.522384 * 0.000261158 = 0.261294
    # Value at end of day 3: 1000.522384 + 0.261294 = 1000.783678
    # Cumulative return: (1000.783678 - 1000) / 1000 = 0.000784 
    # (Note: slight diff due to rounding in example, actual calc will be more precise)
    day3_data = performance_data[2]
    assert day3_data["date"] == "2023-01-03"
    # Expected: ( (1 + 0.000261158)^3 * 1000 - 1000 ) / 1000 = (1.000261158^3 -1) = 0.00078368
    assert abs(day3_data["cumulative_return"] - 0.000784) < 1e-5 


def test_calculate_historical_performance_portfolio_created_before_start_date(
    mock_fetch_asset_data, mock_fetch_reallocations, mock_get_daily_changes
):
    """
    Test scenario where portfolio was created before the analytics start_date.
    Ensure _calculate_initial_portfolio_state correctly computes starting value and contributions.
    """
    portfolio_id = 2
    portfolio_creation_date = date(2022, 12, 1)
    start_date = date(2023, 1, 1) # Analytics start one month after creation
    end_date = date(2023, 1, 2)

    mock_portfolio = MagicMock(spec=Portfolio)
    mock_portfolio.id = portfolio_id
    mock_portfolio.created_at = portfolio_creation_date

    # Mock assets: one asset created with the portfolio
    mock_fetch_asset_data.return_value = {
        1: {"created_at": portfolio_creation_date, "base_allocation_percentage": Decimal('1.0'), "manual_expected_return": Decimal('5.0')}
    }
    mock_fetch_reallocations.return_value = []

    # Mock changes: a contribution before start_date, and one on start_date
    contribution_before_start = Decimal('500.0')
    contribution_on_start = Decimal('200.0')
    mock_get_daily_changes.return_value = {
        date(2022, 12, 15): [{"type": "Contribution", "amount": contribution_before_start}], # Before analytics window
        start_date: [{"type": "Contribution", "amount": contribution_on_start}] # On analytics start_date
    }

    performance_data = calculate_historical_performance(mock_portfolio, start_date, end_date, portfolio_id)
    
    assert len(performance_data) == 2

    # Check Day 1 (2023-01-01)
    # Initial value (carried from before start_date): 500 (from Dec 15 contribution)
    # Growth on this 500 from Dec 15 to Dec 31 (17 days)
    # Daily rate for 5% annual: (1 + 0.05)^(1/365) - 1 approx 0.00013368
    # Value on Dec 31 eve: 500 * (1 + 0.00013368)^17 = 500 * 1.002275 = 501.1375
    # Net contributions before start_date: 500
    # On start_date (Jan 1):
    #   Value before Jan 1 events: 501.1375
    #   Contribution of 200. Value = 501.1375 + 200 = 701.1375
    #   Net contributions = 500 (carried) + 200 = 700
    #   Growth on Jan 1: 701.1375 * 0.00013368 = 0.09373
    #   Value end of Jan 1: 701.1375 + 0.09373 = 701.23123
    #   Cumulative return: (701.23123 - 700) / 700 = 1.23123 / 700 = 0.0017589
    
    day1_data = performance_data[0]
    assert day1_data["date"] == "2023-01-01"
    # This calculation is sensitive. The python code would have run the loop.
    # _calculate_initial_portfolio_state:
    #   loops from portfolio_creation_date (Dec 1) to start_date (Jan 1, exclusive)
    #   Dec 15: current_value = 500, net_contributions = 500
    #   No growth is applied in _calculate_initial_portfolio_state. It only sums up cash flows.
    #   So, entering the main loop: current_value = 500, net_contributions = 500.

    # Main loop, Day 1 (Jan 1):
    #   current_day_allocations: asset 1 = 100%
    #   portfolio_daily_return_rate: 0.00013368
    #   Growth: current_value (500) * 0.00013368 = 0.06684
    #   current_value after growth = 500 + 0.06684 = 500.06684
    #   Apply cash flows for Jan 1:
    #     Contribution of 200. current_value = 500.06684 + 200 = 700.06684
    #     net_contributions = 500 + 200 = 700
    #   Cumulative return: (700.06684 - 700) / 700 = 0.06684 / 700 = 0.0000954
    assert abs(day1_data["cumulative_return"] - 0.000095) < 1e-5

    # Main loop, Day 2 (Jan 2):
    #   current_value at start: 700.06684. net_contributions: 700.
    #   Growth: 700.06684 * 0.00013368 = 0.09358
    #   current_value after growth = 700.06684 + 0.09358 = 700.16042
    #   No cash flows on Jan 2.
    #   Cumulative return: (700.16042 - 700) / 700 = 0.16042 / 700 = 0.000229
    day2_data = performance_data[1]
    assert day2_data["date"] == "2023-01-02"
    assert abs(day2_data["cumulative_return"] - 0.000229) < 1e-5

# TODO: Add more tests for:
# - Withdrawals
# - Reallocations changing asset weights
# - Assets created/removed during the period
# - Periods where portfolio value is zero
# - No assets in portfolio
# - Zero expected return for assets
# - Start date before portfolio creation date (handled by current code, cumulative return is 0)
# - Edge cases for _get_current_day_allocations (e.g. sum of allocations not 1, or 0)

# It might also be beneficial to test some of the helper functions directly,
# especially _get_current_day_allocations due to its complex logic.
# For example:
def test_get_current_day_allocations_no_realloc_equal_split():
    """Test _get_current_day_allocations: no realloc, assets get equal split if base is 0."""
    calc_date = date(2023,1,1)
    assets_data = {
        1: {"created_at": date(2023,1,1), "base_allocation_percentage": Decimal('0.0')},
        2: {"created_at": date(2023,1,1), "base_allocation_percentage": Decimal('0.0')}
    }
    processed_reallocations = []
    allocations = _get_current_day_allocations(calc_date, assets_data, processed_reallocations)
    assert allocations[1] == Decimal('0.5')
    assert allocations[2] == Decimal('0.5')

def test_get_current_day_allocations_uses_base_allocation():
    """Test _get_current_day_allocations: uses base allocation if present and sums to 1."""
    calc_date = date(2023,1,1)
    assets_data = {
        1: {"created_at": date(2023,1,1), "base_allocation_percentage": Decimal('0.7')},
        2: {"created_at": date(2023,1,1), "base_allocation_percentage": Decimal('0.3')}
    }
    processed_reallocations = []
    allocations = _get_current_day_allocations(calc_date, assets_data, processed_reallocations)
    assert allocations[1] == Decimal('0.7')
    assert allocations[2] == Decimal('0.3')

def test_get_current_day_allocations_normalizes_base_allocation():
    """Test _get_current_day_allocations: normalizes base allocation if sum is not 1."""
    calc_date = date(2023,1,1)
    assets_data = {
        1: {"created_at": date(2023,1,1), "base_allocation_percentage": Decimal('1.0')}, # e.g. 100%
        2: {"created_at": date(2023,1,1), "base_allocation_percentage": Decimal('1.0')}  # e.g. 100%
    } # Sums to 2.0, should be normalized to 0.5 each
    processed_reallocations = []
    allocations = _get_current_day_allocations(calc_date, assets_data, processed_reallocations)
    assert allocations[1] == Decimal('0.5')
    assert allocations[2] == Decimal('0.5')

def test_get_current_day_allocations_with_reallocation():
    """Test _get_current_day_allocations: uses active reallocation."""
    calc_date = date(2023,1,15)
    assets_data = { # Base allocations are ignored due to active reallocation
        1: {"created_at": date(2023,1,1), "base_allocation_percentage": Decimal('1.0')},
        2: {"created_at": date(2023,1,1), "base_allocation_percentage": Decimal('0.0')}
    }
    processed_reallocations = [
        {"change_date": date(2023,1,10), "allocations": {1: Decimal('0.2'), 2: Decimal('0.8')}}
    ]
    allocations = _get_current_day_allocations(calc_date, assets_data, processed_reallocations)
    assert allocations[1] == Decimal('0.2')
    assert allocations[2] == Decimal('0.8')

def test_get_current_day_allocations_asset_created_after_calc_date():
    """Test _get_current_day_allocations: asset created after calc date is not included."""
    calc_date = date(2023,1,1)
    assets_data = {
        1: {"created_at": date(2023,1,1), "base_allocation_percentage": Decimal('1.0')},
        2: {"created_at": date(2023,1,2), "base_allocation_percentage": Decimal('0.0')} # Created tomorrow
    }
    processed_reallocations = []
    allocations = _get_current_day_allocations(calc_date, assets_data, processed_reallocations)
    assert 1 in allocations
    assert 2 not in allocations # Asset 2 not active yet
    assert allocations[1] == Decimal('1.0') # Asset 1 gets full allocation

def test_get_current_day_allocations_no_active_assets_eligible():
    """Test _get_current_day_allocations: no assets eligible for allocation."""
    calc_date = date(2023,1,1)
    assets_data = {
        1: {"created_at": date(2023,1,2), "base_allocation_percentage": Decimal('1.0')},
    }
    processed_reallocations = []
    allocations = _get_current_day_allocations(calc_date, assets_data, processed_reallocations)
    assert len(allocations) == 0 # No assets should be allocated to


# --- Tests for ProjectionEngine (calculate_projection) ---

from app.services.projection_engine import calculate_projection
from app.models.asset import Asset # Needed for mock_fetch_portfolio_assets
from app.models.planned_future_change import PlannedFutureChange
from app.schemas.portfolio_schemas import PlannedChangeCreateSchema
from app.enums import ChangeTypes, RecurrencePatterns, EndsOnType, ValueTypes # Added ValueTypes
from dateutil.relativedelta import relativedelta


@pytest.fixture
def mock_fetch_portfolio_assets():
    # Mocks the internal _fetch_portfolio_and_assets function
    with patch('app.services.projection_engine._fetch_portfolio_and_assets') as mock:
        # Setup default mock portfolio and assets
        mock_portfolio = MagicMock(spec=Portfolio)
        mock_portfolio.id = 1
        mock_portfolio.planned_changes = [] # Default to no existing changes
        
        mock_asset1 = MagicMock(spec=Asset)
        mock_asset1.id = 101
        mock_asset1.asset_type = AssetTypes.STOCK
        mock_asset1.current_value = Decimal('5000') # Used by initialize_projection if initial_total_value is None
        mock_asset1.manual_expected_return = Decimal('7.0') # Used by initialize_projection
        mock_asset1.allocation_percentage = Decimal('1.0') # Used by initialize_projection

        mock.return_value = (mock_portfolio, [mock_asset1])
        yield mock

@pytest.fixture
def mock_initialize_projection():
    with patch('app.services.projection_engine.initialize_projection') as mock:
        # Default: one asset, 100% allocation, 7% annual return, initial value 10k
        # monthly_asset_returns: {asset_id: monthly_rate}
        # (1 + 0.07)^(1/12) - 1 = 0.005654145
        mock.return_value = (
            {101: Decimal('10000.0')}, # current_asset_values {asset_id: value}
            {101: Decimal('0.005654145')}, # monthly_asset_returns
            Decimal('10000.0') # current_total_value
        )
        yield mock

@pytest.fixture
def mock_get_occurrences():
    with patch('app.services.projection_engine.get_occurrences_for_month') as mock:
        mock.return_value = [] # Default to no occurrences in a month
        yield mock

@pytest.fixture
def mock_calculate_single_month():
    with patch('app.services.projection_engine.calculate_single_month') as mock:
        # Default behavior: simple pass-through or slight increment
        def default_side_effect(current_date, current_asset_values, monthly_asset_returns, actual_changes_for_this_month):
            new_total_value = sum(current_asset_values.values())
            # Apply a minimal growth for simplicity if no changes
            if not actual_changes_for_this_month:
                 new_total_value *= Decimal('1.001') 
            else: # If changes, assume they are handled and a new value is derived
                for change in actual_changes_for_this_month:
                    if change.change_type in [ChangeTypes.ONE_TIME_INVESTMENT, ChangeTypes.RECURRING_INVESTMENT]:
                        new_total_value += change.value
                    elif change.change_type in [ChangeTypes.ONE_TIME_WITHDRAWAL, ChangeTypes.RECURRING_WITHDRAWAL]:
                        new_total_value -= change.value

            new_asset_values = {k: v / sum(current_asset_values.values()) * new_total_value if sum(current_asset_values.values()) > 0 else Decimal(0) for k,v in current_asset_values.items()}
            if not new_asset_values and new_total_value > 0: # Handle case where asset values might be empty but total value exists
                new_asset_values = {101: new_total_value} # Assign to a default asset if needed

            return new_asset_values, new_total_value
        
        mock.side_effect = default_side_effect
        yield mock


def test_calculate_projection_no_changes(
    mock_fetch_portfolio_assets, mock_initialize_projection, 
    mock_get_occurrences, mock_calculate_single_month
):
    portfolio_id = 1
    start_date = date(2024, 1, 1)
    end_date = date(2024, 3, 31) # 3 months projection
    initial_total_value = Decimal('10000.0')

    # mock_initialize_projection already set up to return initial_total_value
    mock_initialize_projection.return_value = (
        {101: initial_total_value}, {101: Decimal('0.001')}, initial_total_value
    )
    # mock_calculate_single_month will apply 0.1% growth if no changes.

    results = calculate_projection(portfolio_id, start_date, end_date, initial_total_value, None)

    assert len(results) == 4 # Initial state + 3 month ends
    assert results[0] == (start_date, initial_total_value)
    
    # Check month ends
    assert results[1][0] == date(2024, 1, 31)
    assert results[1][1] == initial_total_value * Decimal('1.001')
    assert results[2][0] == date(2024, 2, 29) # Leap year
    assert results[2][1] == initial_total_value * Decimal('1.001')**2
    assert results[3][0] == date(2024, 3, 31)
    assert results[3][1] == initial_total_value * Decimal('1.001')**3

    assert mock_fetch_portfolio_assets.called_once_with(portfolio_id)
    # initialize_projection is called with assets from _fetch_portfolio_and_assets and initial_total_value
    mock_initialize_projection.assert_called_once_with(
        mock_fetch_portfolio_assets.return_value[1], # assets
        initial_total_value
    )
    assert mock_get_occurrences.call_count == 3 # Called for Jan, Feb, Mar
    assert mock_calculate_single_month.call_count == 3


def test_calculate_projection_with_one_time_investment(
    mock_fetch_portfolio_assets, mock_initialize_projection,
    mock_get_occurrences, mock_calculate_single_month
):
    portfolio_id = 1
    start_date = date(2024, 1, 1)
    end_date = date(2024, 2, 29) # 2 months
    initial_total_value = Decimal('10000.0')

    investment_date = date(2024, 1, 15)
    investment_value = Decimal('1000.0')
    
    one_time_change = PlannedFutureChange(
        change_id='chg1',
        portfolio_id=portfolio_id,
        description="One time investment",
        change_type=ChangeTypes.ONE_TIME_INVESTMENT,
        value=investment_value,
        value_type=ValueTypes.FIXED,
        change_date=investment_date,
        currency=Currencies.USD,
        is_recurring=False
    )
    # Configure mock_fetch_portfolio_assets to return this change
    mock_portfolio, mock_assets = mock_fetch_portfolio_assets.return_value
    mock_portfolio.planned_changes = [one_time_change]
    mock_fetch_portfolio_assets.return_value = (mock_portfolio, mock_assets)

    # Configure get_occurrences to return this change in Jan 2024
    def get_occurrences_side_effect(rule, year, month):
        if rule.change_id == 'chg1' and year == 2024 and month == 1:
            # Create a mock instance for the occurrence if needed, or return the rule itself
            # if it's structured like an occurrence for non-recurring.
            # For one-time, the rule itself is the occurrence if its date matches.
            return [rule] 
        return []
    mock_get_occurrences.side_effect = get_occurrences_side_effect
    
    # Configure initialize_projection
    mock_initialize_projection.return_value = (
        {101: initial_total_value}, {101: Decimal('0.0')}, initial_total_value # No passive growth for simplicity
    )

    # Configure calculate_single_month to apply the investment
    # The default side_effect for mock_calculate_single_month already adds the value.

    results = calculate_projection(portfolio_id, start_date, end_date, initial_total_value, None)

    assert len(results) == 3 # Initial + 2 months
    assert results[0] == (start_date, initial_total_value)
    
    # Jan 2024: initial + investment
    assert results[1][0] == date(2024, 1, 31)
    assert results[1][1] == initial_total_value + investment_value 
    
    # Feb 2024: value from Jan (no further changes or growth in this simplified test)
    assert results[2][0] == date(2024, 2, 29)
    assert results[2][1] == initial_total_value + investment_value 

    mock_get_occurrences.assert_any_call(one_time_change, 2024, 1)
    mock_calculate_single_month.assert_any_call(
        date(2024,1,1), # current_date for Jan calculation
        {101: initial_total_value}, # current_asset_values
        {101: Decimal('0.0')}, # monthly_asset_returns
        [one_time_change] # actual_changes_for_this_month
    )


def test_calculate_projection_with_draft_changes(
    mock_fetch_portfolio_assets, mock_initialize_projection,
    mock_get_occurrences, mock_calculate_single_month
):
    portfolio_id = 1
    start_date = date(2024, 1, 1)
    end_date = date(2024, 1, 31) # 1 month
    initial_total_value = Decimal('20000.0')

    draft_change_schema = PlannedChangeCreateSchema(
        description="Draft investment",
        change_type=ChangeTypes.ONE_TIME_INVESTMENT,
        value=Decimal('500.0'),
        value_type=ValueTypes.FIXED,
        change_date=date(2024, 1, 10),
        currency=Currencies.EUR, # Assuming schema handles this
        is_recurring=False
        # portfolio_id will be set by the projection_engine from context
    )
    
    # Ensure _fetch_portfolio_and_assets returns a portfolio with no *existing* changes
    mock_portfolio, mock_assets = mock_fetch_portfolio_assets.return_value
    mock_portfolio.planned_changes = [] 
    mock_fetch_portfolio_assets.return_value = (mock_portfolio, mock_assets)

    # Configure get_occurrences: it will be called with a PlannedFutureChange instance
    # created from the draft_change_schema.
    def get_occurrences_side_effect_draft(rule_instance, year, month):
        # rule_instance here is the temporary PlannedFutureChange object
        if rule_instance.description == "Draft investment" and year == 2024 and month == 1:
            return [rule_instance]
        return []
    mock_get_occurrences.side_effect = get_occurrences_side_effect_draft
    
    mock_initialize_projection.return_value = (
        {101: initial_total_value}, {101: Decimal('0.0')}, initial_total_value # No passive growth
    )
    # Default mock_calculate_single_month will add the value.

    results = calculate_projection(portfolio_id, start_date, end_date, initial_total_value, [draft_change_schema])

    assert len(results) == 2 # Initial + 1 month
    assert results[0] == (start_date, initial_total_value)
    assert results[1][0] == date(2024, 1, 31)
    assert results[1][1] == initial_total_value + Decimal('500.0') # Initial + draft investment

    # Check that get_occurrences was called with an instance of PlannedFutureChange
    # that matches the draft schema's data.
    found_matching_call_to_get_occurrences = False
    for call_args in mock_get_occurrences.call_args_list:
        args, _ = call_args
        rule_instance, year, month = args
        if isinstance(rule_instance, PlannedFutureChange) and \
           rule_instance.description == "Draft investment" and \
           rule_instance.value == Decimal('500.0') and \
           year == 2024 and month == 1:
            found_matching_call_to_get_occurrences = True
            break
    assert found_matching_call_to_get_occurrences


def test_calculate_projection_ends_on_occurrences(
    mock_fetch_portfolio_assets, mock_initialize_projection,
    mock_get_occurrences, mock_calculate_single_month
):
    portfolio_id = 1
    start_date = date(2024, 1, 1)
    end_date = date(2024, 3, 31) # 3 months
    initial_total_value = Decimal('10000.0')

    recurring_change = PlannedFutureChange(
        change_id='rc1',
        portfolio_id=portfolio_id,
        description="Recurring deposit",
        change_type=ChangeTypes.RECURRING_INVESTMENT,
        value=Decimal('100.0'),
        value_type=ValueTypes.FIXED,
        change_date=start_date, # Starts from first month
        recurrence_pattern=RecurrencePatterns.MONTHLY,
        day_of_month=1,
        is_recurring=True,
        ends_on_type=EndsOnType.AFTER_OCCURRENCES,
        ends_on_occurrences=2 # Should occur only twice (Jan, Feb)
    )
    mock_portfolio, mock_assets = mock_fetch_portfolio_assets.return_value
    mock_portfolio.planned_changes = [recurring_change]
    mock_fetch_portfolio_assets.return_value = (mock_portfolio, mock_assets)
    
    mock_initialize_projection.return_value = (
        {101: initial_total_value}, {101: Decimal('0.0')}, initial_total_value # No passive growth
    )

    # get_occurrences should return the change for Jan and Feb, but not Mar
    # The logic inside calculate_projection handles the `ends_on_occurrences` limit.
    # So, get_occurrences itself can be "dumb" and just return based on month if the rule matches.
    # The projection loop will stop asking/using them.
    def get_occurrences_side_effect_recurring(rule, year, month):
        if rule.change_id == 'rc1' and rule.recurrence_pattern == RecurrencePatterns.MONTHLY:
            # Simulate that it *could* occur each month based on pattern
            return [rule] # Return the rule instance itself as the occurrence
        return []
    mock_get_occurrences.side_effect = get_occurrences_side_effect_recurring
    # Default mock_calculate_single_month adds the value.

    results = calculate_projection(portfolio_id, start_date, end_date, initial_total_value, None)

    assert len(results) == 4 # Initial + 3 months
    assert results[0] == (start_date, initial_total_value)
    
    # Jan: initial + 100
    assert results[1][0] == date(2024, 1, 31)
    assert results[1][1] == initial_total_value + Decimal('100.0')
    
    # Feb: Jan_val + 100
    assert results[2][0] == date(2024, 2, 29)
    assert results[2][1] == initial_total_value + Decimal('100.0') + Decimal('100.0')
    
    # Mar: Feb_val (no more occurrences of the change)
    assert results[3][0] == date(2024, 3, 31)
    assert results[3][1] == initial_total_value + Decimal('100.0') + Decimal('100.0')
    
    # Check that calculate_single_month received the change for Jan and Feb, but not Mar
    # Jan Call
    assert mock_calculate_single_month.call_args_list[0][0][3] == [recurring_change]
    # Feb Call
    assert mock_calculate_single_month.call_args_list[1][0][3] == [recurring_change]
    # Mar Call
    assert mock_calculate_single_month.call_args_list[2][0][3] == []


# TODO: More tests:
# - Initial value is None (triggers calculation from assets)
# - Different recurrence patterns (weekly, yearly)
# - Changes with percentage values (ValueTypes.PERCENTAGE_OF_PORTFOLIO)
# - EndsOnType.ON_DATE
# - Complex scenarios with multiple assets, multiple changes of different types.
# - Error handling (e.g., portfolio not found - though _fetch_portfolio_and_assets is mocked here)


# --- Tests for RecurrenceService (get_occurrences_for_month) ---

from app.services.recurrence_service import get_occurrences_for_month
# PlannedFutureChange is already imported
# Enums like RecurrencePatterns, EndsOnType, ChangeTypes, Currencies are already imported
from app.enums import FrequencyType, MonthOrdinalType, OrdinalDayType # Specific for recurrence rules

# Helper to create PlannedFutureChange objects for recurrence tests
def create_recurrence_change_rule(
    change_date: date,
    is_recurring: bool = True,
    frequency: FrequencyType = FrequencyType.MONTHLY, # Note: model uses RecurrencePatterns, service maps it
    recurrence_pattern: RecurrencePatterns = RecurrencePatterns.MONTHLY, # Model field
    interval: int = 1,
    days_of_week: list[int] | None = None, # 0=Mon, 6=Sun
    day_of_month: int | None = None,
    month_ordinal: MonthOrdinalType | None = None,
    month_ordinal_day: OrdinalDayType | None = None,
    month_of_year: int | None = None,
    ends_on_type: EndsOnType = EndsOnType.NEVER,
    ends_on_date: date | None = None,
    ends_on_occurrences: int | None = None,
    change_type: ChangeTypes = ChangeTypes.RECURRING_INVESTMENT,
    value: Decimal = Decimal("100.00")
) -> PlannedFutureChange:
    # The recurrence_service maps the model's `recurrence_pattern` (an enum like RecurrencePatterns.MONTHLY)
    # to its internal `frequency` (an enum like FrequencyType.MONTHLY) for rrule.
    # So, when creating the model instance, we use `recurrence_pattern`.
    # The `frequency` attribute on the model itself is what recurrence_service.py reads.
    # Let's ensure the model's `frequency` field is set according to `recurrence_pattern`
    # for the tests to correctly simulate model data.
    
    # Mapping RecurrencePatterns to FrequencyType for setting the model's 'frequency' field
    pattern_to_freq_map = {
        RecurrencePatterns.DAILY: FrequencyType.DAILY,
        RecurrencePatterns.WEEKLY: FrequencyType.WEEKLY,
        RecurrencePatterns.MONTHLY: FrequencyType.MONTHLY,
        RecurrencePatterns.YEARLY: FrequencyType.YEARLY,
        RecurrencePatterns.ONE_TIME: FrequencyType.ONE_TIME, # Though for recurring, this won't be used
    }
    model_frequency_field = pattern_to_freq_map.get(recurrence_pattern, FrequencyType.ONE_TIME if not is_recurring else None)
    if is_recurring and model_frequency_field is None:
        raise ValueError(f"Invalid recurrence_pattern for a recurring change: {recurrence_pattern}")


    return PlannedFutureChange(
        portfolio_id=1, # Dummy portfolio_id
        change_id='test_rule_id', # Dummy change_id
        change_date=change_date,
        description="Test Recurring Change",
        change_type=change_type, # Defaulted to RECURRING_INVESTMENT for convenience
        value=value,
        value_type=ValueTypes.FIXED,
        currency=Currencies.USD,
        is_recurring=is_recurring,
        frequency=model_frequency_field, # This is what recurrence_service.py uses for FREQUENCY_CONFIG
        recurrence_pattern=recurrence_pattern, # This is the actual model field name
        interval=interval,
        days_of_week=days_of_week,
        day_of_month=day_of_month,
        month_ordinal=month_ordinal,
        month_ordinal_day=month_ordinal_day,
        month_of_year=month_of_year,
        ends_on_type=ends_on_type,
        ends_on_date=ends_on_date,
        ends_on_occurrences=ends_on_occurrences
    )

# Test for non-recurring changes
def test_get_occurrences_non_recurring():
    rule = create_recurrence_change_rule(change_date=date(2024, 1, 15), is_recurring=False)
    # In target month
    occurrences = get_occurrences_for_month(rule, 2024, 1)
    assert len(occurrences) == 1
    assert occurrences[0].change_date == date(2024, 1, 15)
    assert occurrences[0] == rule # Non-recurring returns the rule itself

    # Outside target month
    occurrences = get_occurrences_for_month(rule, 2024, 2)
    assert len(occurrences) == 0

# Test daily recurrence
def test_get_occurrences_daily():
    rule = create_recurrence_change_rule(change_date=date(2024, 1, 30), recurrence_pattern=RecurrencePatterns.DAILY, interval=1)
    occurrences = get_occurrences_for_month(rule, 2024, 2) # Target Feb 2024
    assert len(occurrences) == 29 # Feb 2024 is a leap year
    assert occurrences[0].change_date == date(2024, 2, 1)
    assert occurrences[-1].change_date == date(2024, 2, 29)
    for occ in occurrences:
        assert occ.is_recurring is False
        assert occ.frequency == FrequencyType.ONE_TIME

# Test weekly recurrence
def test_get_occurrences_weekly():
    # Every Monday, starting Mon, Jan 1, 2024
    rule = create_recurrence_change_rule(
        change_date=date(2024, 1, 1), 
        recurrence_pattern=RecurrencePatterns.WEEKLY, 
        days_of_week=[0] # Monday
    )
    occurrences = get_occurrences_for_month(rule, 2024, 1) # Target Jan 2024
    expected_dates = [date(2024, 1, 1), date(2024, 1, 8), date(2024, 1, 15), date(2024, 1, 22), date(2024, 1, 29)]
    assert len(occurrences) == len(expected_dates)
    for i, occ_date in enumerate(expected_dates):
        assert occurrences[i].change_date == occ_date

# Test monthly recurrence by day_of_month
def test_get_occurrences_monthly_day_of_month():
    rule = create_recurrence_change_rule(change_date=date(2024, 1, 15), day_of_month=15)
    occurrences = get_occurrences_for_month(rule, 2024, 2) # Target Feb 2024
    assert len(occurrences) == 1
    assert occurrences[0].change_date == date(2024, 2, 15)

def test_get_occurrences_monthly_day_31_in_short_month():
    rule = create_recurrence_change_rule(change_date=date(2024, 1, 31), day_of_month=31)
    occurrences = get_occurrences_for_month(rule, 2024, 2) # Target Feb 2024 (leap)
    # rrule bymonthday=-1 or specific day logic will make it land on Feb 29
    # The current recurrence_service seems to use `bymonthday = change.day_of_month` which means
    # rrule itself will skip Feb if day_of_month is 31.
    assert len(occurrences) == 0 # Correct, rrule skips if day doesn't exist

    # Test with "last day of month" logic if service supported it explicitly.
    # The service uses bymonthday=N, so this test is as above.
    # If we wanted to test "last day", rule setup would be:
    # rule_last_day = create_recurrence_change_rule(
    #     change_date=date(2024,1,31),
    #     month_ordinal=MonthOrdinalType.LAST,
    #     month_ordinal_day=OrdinalDayType.DAY
    # )
    # occurrences_last_day = get_occurrences_for_month(rule_last_day, 2024, 2)
    # assert len(occurrences_last_day) == 1
    # assert occurrences_last_day[0].change_date == date(2024, 2, 29)


# Test monthly recurrence by ordinal (e.g., first Monday)
def test_get_occurrences_monthly_ordinal():
    # First Monday of the month
    rule = create_recurrence_change_rule(
        change_date=date(2024, 1, 1), 
        month_ordinal=MonthOrdinalType.FIRST, 
        month_ordinal_day=OrdinalDayType.MONDAY
    )
    occurrences_jan = get_occurrences_for_month(rule, 2024, 1) # Target Jan 2024
    assert len(occurrences_jan) == 1
    assert occurrences_jan[0].change_date == date(2024, 1, 1) # Jan 1 is a Monday

    occurrences_feb = get_occurrences_for_month(rule, 2024, 2) # Target Feb 2024
    assert len(occurrences_feb) == 1
    assert occurrences_feb[0].change_date == date(2024, 2, 5) # Feb 5 is the first Monday

# Test yearly recurrence
def test_get_occurrences_yearly():
    rule = create_recurrence_change_rule(change_date=date(2023, 3, 15), recurrence_pattern=RecurrencePatterns.YEARLY)
    occurrences = get_occurrences_for_month(rule, 2024, 3) # Target Mar 2024
    assert len(occurrences) == 1
    assert occurrences[0].change_date == date(2024, 3, 15)

def test_get_occurrences_yearly_leap_day_feb29():
    # Rule starts on Feb 29, 2024
    rule = create_recurrence_change_rule(
        change_date=date(2024, 2, 29), 
        recurrence_pattern=RecurrencePatterns.YEARLY,
        month_of_year=2, # Explicitly set month for yearly
        day_of_month=29   # Explicitly set day for yearly
    )
    # Target Feb 2024 (leap year)
    occurrences_2024 = get_occurrences_for_month(rule, 2024, 2)
    assert len(occurrences_2024) == 1
    assert occurrences_2024[0].change_date == date(2024, 2, 29)

    # Target Feb 2025 (non-leap year) - rrule will skip this date
    occurrences_2025 = get_occurrences_for_month(rule, 2025, 2)
    assert len(occurrences_2025) == 0

# Test end condition: EndsOnType.ON_DATE
def test_get_occurrences_ends_on_date():
    rule = create_recurrence_change_rule(
        change_date=date(2024, 1, 5), 
        recurrence_pattern=RecurrencePatterns.MONTHLY, day_of_month=5,
        ends_on_type=EndsOnType.ON_DATE, 
        ends_on_date=date(2024, 2, 10) # Should include Jan 5, Feb 5. Not Mar 5.
    )
    occurrences_jan = get_occurrences_for_month(rule, 2024, 1)
    assert len(occurrences_jan) == 1
    assert occurrences_jan[0].change_date == date(2024, 1, 5)

    occurrences_feb = get_occurrences_for_month(rule, 2024, 2)
    assert len(occurrences_feb) == 1
    assert occurrences_feb[0].change_date == date(2024, 2, 5)
    
    occurrences_mar = get_occurrences_for_month(rule, 2024, 3)
    assert len(occurrences_mar) == 0

# Test end condition: EndsOnType.AFTER_OCCURRENCES
def test_get_occurrences_ends_on_occurrences():
    # This tests that rrule is set up with 'count'. The projection engine
    # manages cumulative counts across months. get_occurrences_for_month
    # will generate all possible for that month if count allows.
    rule = create_recurrence_change_rule(
        change_date=date(2024, 1, 25), 
        recurrence_pattern=RecurrencePatterns.MONTHLY, day_of_month=25,
        ends_on_type=EndsOnType.AFTER_OCCURRENCES, 
        ends_on_occurrences=2 # Total 2 occurrences
    )
    # Jan: 1st occurrence
    occurrences_jan = get_occurrences_for_month(rule, 2024, 1)
    assert len(occurrences_jan) == 1
    assert occurrences_jan[0].change_date == date(2024, 1, 25)

    # Feb: 2nd occurrence
    occurrences_feb = get_occurrences_for_month(rule, 2024, 2)
    assert len(occurrences_feb) == 1
    assert occurrences_feb[0].change_date == date(2024, 2, 25)

    # Mar: Should be no more (count is 2)
    occurrences_mar = get_occurrences_for_month(rule, 2024, 3)
    assert len(occurrences_mar) == 0


def test_get_occurrences_rule_starts_after_target_month():
    rule = create_recurrence_change_rule(change_date=date(2024, 3, 15), day_of_month=15)
    occurrences = get_occurrences_for_month(rule, 2024, 1) # Target Jan, rule starts Mar
    assert len(occurrences) == 0

def test_get_occurrences_invalid_ends_on_occurrences():
    rule_zero_occ = create_recurrence_change_rule(
        change_date=date(2024, 1, 1), 
        ends_on_type=EndsOnType.AFTER_OCCURRENCES, 
        ends_on_occurrences=0
    )
    occurrences = get_occurrences_for_month(rule_zero_occ, 2024, 1)
    assert len(occurrences) == 0

    rule_none_occ = create_recurrence_change_rule(
        change_date=date(2024, 1, 1), 
        ends_on_type=EndsOnType.AFTER_OCCURRENCES, 
        ends_on_occurrences=None # Should also result in no occurrences
    )
    occurrences_none = get_occurrences_for_month(rule_none_occ, 2024, 1)
    assert len(occurrences_none) == 0


def test_generated_occurrence_is_one_time():
    rule = create_recurrence_change_rule(change_date=date(2024, 1, 1), recurrence_pattern=RecurrencePatterns.DAILY)
    occurrences = get_occurrences_for_month(rule, 2024, 1)
    assert len(occurrences) > 0
    for occ in occurrences:
        assert occ.is_recurring is False
        assert occ.frequency == FrequencyType.ONE_TIME # Check the model's frequency field
        assert occ.description == "Test Recurring Change (Recurring Instance)"
        assert occ.change_id != "test_rule_id" # Should be a new object, so ID is not set by default in PFC model
        assert occ.portfolio_id == rule.portfolio_id
        assert occ.change_type == rule.change_type
        assert occ.value == rule.value
        # Recurrence specific fields should be None for the instance
        assert occ.recurrence_pattern is None # Or set to ONE_TIME depending on _create_one_time_change_from_rule impl.
                                             # Current impl sets frequency to ONE_TIME, other fields not nulled.
                                             # Let's check based on _create_one_time_change_from_rule:
        assert occ.interval == 1 # Default in _create_one_time_change_from_rule
        assert occ.days_of_week is None
        assert occ.day_of_month is None
        # etc. for other recurrence fields.

# Example test for last day of month using ordinal way (if applicable)
def test_get_occurrences_monthly_last_weekday_of_month():
    # Last weekday (Mon-Fri) of the month
    rule = create_recurrence_change_rule(
        change_date=date(2024, 1, 1), 
        month_ordinal=MonthOrdinalType.LAST, 
        month_ordinal_day=OrdinalDayType.WEEKDAY 
    )
    # Jan 2024: Last weekday is Wed, Jan 31
    occurrences_jan = get_occurrences_for_month(rule, 2024, 1)
    assert len(occurrences_jan) == 1
    assert occurrences_jan[0].change_date == date(2024, 1, 31)

    # Feb 2024 (leap): Last weekday is Thu, Feb 29
    occurrences_feb = get_occurrences_for_month(rule, 2024, 2)
    assert len(occurrences_feb) == 1
    assert occurrences_feb[0].change_date == date(2024, 2, 29)

    # Apr 2024: Last weekday is Tue, Apr 30
    occurrences_apr = get_occurrences_for_month(rule, 2024, 4)
    assert len(occurrences_apr) == 1
    assert occurrences_apr[0].change_date == date(2024, 4, 30)


# --- Tests for ReturnStrategies ---

from app.services.return_strategies import StandardAnnualReturnStrategy, get_return_strategy, AbstractReturnCalculationStrategy
# Asset, AssetTypes already imported
from app.config.return_config import DEFAULT_ANNUAL_RETURNS as ACTUAL_DEFAULT_RETURNS # To avoid conflict
from decimal import InvalidOperation # For testing exception handling in strategy

# Helper to create a mock asset for return strategy tests
def create_mock_asset(
    asset_id=1,
    portfolio_id=1,
    asset_type: AssetTypes = AssetTypes.STOCK,
    manual_expected_return: Decimal | str | None = None
) -> MagicMock:
    mock_asset = MagicMock(spec=Asset)
    mock_asset.asset_id = asset_id
    mock_asset.portfolio_id = portfolio_id
    mock_asset.asset_type = asset_type
    mock_asset.manual_expected_return = manual_expected_return
    return mock_asset

# Expected monthly return calculation helper
def expected_monthly_from_annual(annual_percent: Decimal) -> Decimal:
    if not isinstance(annual_percent, Decimal):
        annual_percent = Decimal(str(annual_percent))
    
    r_annual = annual_percent / Decimal('100')
    if r_annual <= Decimal('-1.0'): # Covers -100% or less
        return Decimal('-1.0')
    # (1 + R_annual)^(1/12) - 1
    return (Decimal('1.0') + r_annual)**(Decimal('1.0') / Decimal('12.0')) - Decimal('1.0')


class TestStandardAnnualReturnStrategy:

    def test_calculate_monthly_return_with_manual_positive(self):
        strategy = StandardAnnualReturnStrategy()
        asset = create_mock_asset(manual_expected_return=Decimal('10.0')) # 10%
        expected = expected_monthly_from_annual(Decimal('10.0'))
        assert strategy.calculate_monthly_return(asset) == pytest.approx(expected)

    def test_calculate_monthly_return_with_manual_zero(self):
        strategy = StandardAnnualReturnStrategy()
        asset = create_mock_asset(manual_expected_return=Decimal('0.0')) # 0%
        expected = expected_monthly_from_annual(Decimal('0.0')) # Should be 0
        assert strategy.calculate_monthly_return(asset) == pytest.approx(expected)
        assert expected == Decimal('0.0')

    def test_calculate_monthly_return_with_manual_negative(self):
        strategy = StandardAnnualReturnStrategy()
        asset = create_mock_asset(manual_expected_return=Decimal('-5.0')) # -5%
        expected = expected_monthly_from_annual(Decimal('-5.0'))
        assert strategy.calculate_monthly_return(asset) == pytest.approx(expected)

    def test_calculate_monthly_return_with_manual_total_loss(self):
        strategy = StandardAnnualReturnStrategy()
        asset = create_mock_asset(manual_expected_return=Decimal('-100.0')) # -100%
        expected = Decimal('-1.0') # Monthly equivalent of -100% annual is -100%
        assert strategy.calculate_monthly_return(asset) == pytest.approx(expected)

    def test_calculate_monthly_return_with_manual_greater_than_total_loss(self):
        strategy = StandardAnnualReturnStrategy()
        asset = create_mock_asset(manual_expected_return=Decimal('-150.0')) # -150%
        expected = Decimal('-1.0') # Should cap at -100% monthly
        assert strategy.calculate_monthly_return(asset) == pytest.approx(expected)
    
    @patch('app.services.return_strategies.DEFAULT_ANNUAL_RETURNS', {AssetTypes.STOCK: Decimal('7.0')})
    def test_calculate_monthly_return_no_manual_uses_default(self, mock_defaults):
        strategy = StandardAnnualReturnStrategy()
        asset = create_mock_asset(asset_type=AssetTypes.STOCK, manual_expected_return=None)
        expected = expected_monthly_from_annual(Decimal('7.0'))
        assert strategy.calculate_monthly_return(asset) == pytest.approx(expected)

    @patch('app.services.return_strategies.DEFAULT_ANNUAL_RETURNS', {AssetTypes.BOND: Decimal('3.5')})
    def test_calculate_monthly_return_for_bond_default(self, mock_defaults):
        strategy = StandardAnnualReturnStrategy()
        asset = create_mock_asset(asset_type=AssetTypes.BOND, manual_expected_return=None)
        expected = expected_monthly_from_annual(Decimal('3.5'))
        assert strategy.calculate_monthly_return(asset) == pytest.approx(expected)

    @patch('app.services.return_strategies.DEFAULT_ANNUAL_RETURNS', {}) # Empty defaults
    def test_calculate_monthly_return_asset_type_not_in_defaults(self, mock_defaults):
        strategy = StandardAnnualReturnStrategy()
        asset = create_mock_asset(asset_type=AssetTypes.CRYPTO, manual_expected_return=None)
        # Defaults to 0% if asset type not in DEFAULT_ANNUAL_RETURNS
        expected = expected_monthly_from_annual(Decimal('0.0'))
        assert strategy.calculate_monthly_return(asset) == pytest.approx(expected)

    @patch('app.services.return_strategies.logger')
    @patch('app.services.return_strategies.DEFAULT_ANNUAL_RETURNS', {AssetTypes.STOCK: Decimal('5.0')})
    def test_calculate_monthly_return_invalid_manual_falls_back_to_default(self, mock_defaults, mock_logger):
        strategy = StandardAnnualReturnStrategy()
        asset = create_mock_asset(asset_type=AssetTypes.STOCK, manual_expected_return="not-a-decimal")
        expected = expected_monthly_from_annual(Decimal('5.0'))
        result = strategy.calculate_monthly_return(asset)
        assert result == pytest.approx(expected)
        mock_logger.warning.assert_called_once()
        assert "Invalid manual_expected_return" in mock_logger.warning.call_args[0][0]

    @patch('app.services.return_strategies.logger')
    def test_calculate_monthly_return_invalid_asset_type_string_for_default(self, mock_logger):
        strategy = StandardAnnualReturnStrategy()
        # Create an asset with an asset_type that is a string not mapping to AssetType enum
        asset = create_mock_asset(asset_type="INVALID_ASSET_TYPE_STR", manual_expected_return=None)
        
        # Expected behavior: logs error, returns 0.0
        expected_return = Decimal('0.0') 
        actual_return = strategy.calculate_monthly_return(asset)
        
        assert actual_return == pytest.approx(expected_return)
        mock_logger.error.assert_called_once()
        assert "Unrecognized asset type 'INVALID_ASSET_TYPE_STR' during default return lookup." in mock_logger.error.call_args[0][0]

    @patch('app.services.return_strategies.logger')
    @patch('app.services.return_strategies.DEFAULT_ANNUAL_RETURNS', {AssetTypes.OPTIONS: Decimal('0.0')})
    def test_calculate_monthly_return_logs_info_for_options_default_zero(self, mock_defaults, mock_logger):
        strategy = StandardAnnualReturnStrategy()
        asset = create_mock_asset(asset_type=AssetTypes.OPTIONS, manual_expected_return=None)
        strategy.calculate_monthly_return(asset)
        mock_logger.info.assert_called()
        assert "is using a default annual return of 0%" in mock_logger.info.call_args[0][0]
        assert "Consider providing a manual return" in mock_logger.info.call_args[0][0]
    
    @patch('app.services.return_strategies.logger')
    @patch('app.services.return_strategies.DEFAULT_ANNUAL_RETURNS', {AssetTypes.OTHER: Decimal('0.0')})
    def test_calculate_monthly_return_logs_info_for_other_default_zero_after_invalid_manual(self, mock_defaults, mock_logger):
        strategy = StandardAnnualReturnStrategy()
        asset = create_mock_asset(asset_type=AssetTypes.OTHER, manual_expected_return="invalid")
        strategy.calculate_monthly_return(asset) # Should fall back to default 0% for OTHER
        mock_logger.info.assert_called()
        assert "has a default return of 0% (possibly due to invalid manual input)" in mock_logger.info.call_args[0][0]


class TestGetReturnStrategy:
    def test_get_return_strategy_known_type(self):
        strategy = get_return_strategy(AssetTypes.STOCK)
        assert isinstance(strategy, StandardAnnualReturnStrategy)

    @patch('app.services.return_strategies.logger')
    def test_get_return_strategy_unrecognized_type_string(self, mock_logger):
        # Pass a string that doesn't correspond to an AssetType enum member
        strategy = get_return_strategy("ALIEN_TECHNOLOGY_STOCKS")
        assert isinstance(strategy, StandardAnnualReturnStrategy) # Falls back to standard
        mock_logger.error.assert_called_once()
        assert "Unrecognized asset type 'ALIEN_TECHNOLOGY_STOCKS' provided to get_return_strategy." in mock_logger.error.call_args[0][0]

    @patch('app.services.return_strategies.logger')
    @patch('app.services.return_strategies._strategy_registry', {}) # Empty registry
    def test_get_return_strategy_type_not_in_registry_fallback(self, mock_empty_registry, mock_logger):
        # This AssetType is valid, but we've emptied the registry
        strategy = get_return_strategy(AssetTypes.REAL_ESTATE)
        assert isinstance(strategy, StandardAnnualReturnStrategy) # Falls back to standard (which is _standard_strategy)
        mock_logger.warning.assert_called_once()
        assert "No return calculation strategy found for asset type REAL_ESTATE" in mock_logger.warning.call_args[0][0]

    def test_get_return_strategy_all_enum_members_covered(self):
        # This test ensures all AssetTypes are handled by get_return_strategy
        # (currently they all map to StandardAnnualReturnStrategy)
        for asset_type_enum_member in AssetTypes:
            strategy = get_return_strategy(asset_type_enum_member)
            assert isinstance(strategy, AbstractReturnCalculationStrategy) # Or more specifically StandardAnnualReturnStrategy
            assert isinstance(strategy, StandardAnnualReturnStrategy)


# --- Tests for HistoricalDataPreparation ---

from app.services.historical_data_preparation import (
    fetch_and_process_asset_data,
    fetch_and_process_reallocations,
    get_daily_changes
)
# Asset, PlannedFutureChange, AssetTypes, ChangeTypes, Currencies already imported
# db, current_app are part of the app, need to be mocked where used by the service.
# json is used internally. Decimal, InvalidOperation are used.

@pytest.fixture
def mock_hdp_db_session_query():
    """Mocks db.session.query for historical_data_preparation functions."""
    with patch('app.services.historical_data_preparation.db.session.query') as mock_query:
        # Configure the mock to return itself for chained calls like .filter().order_by()
        # and then a final result for .all()
        mock_query_chain = MagicMock()
        mock_query.return_value = mock_query_chain
        # Individual tests will set mock_query_chain.all.return_value
        yield mock_query_chain

@pytest.fixture
def mock_hdp_current_app_logger():
    """Mocks current_app.logger for historical_data_preparation functions."""
    with patch('app.services.historical_data_preparation.current_app') as mock_app:
        mock_app.logger = MagicMock()
        yield mock_app.logger

class TestFetchAndProcessAssetData:
    def test_fpac_valid_assets(self, mock_hdp_db_session_query, mock_hdp_current_app_logger):
        mock_asset1 = MagicMock(spec=Asset)
        mock_asset1.asset_id = 1
        mock_asset1.manual_expected_return = Decimal('7.5')
        mock_asset1.allocation_percentage = Decimal('50.0')
        mock_asset1.created_at = datetime(2023, 1, 1, 10, 0, 0)

        mock_asset2 = MagicMock(spec=Asset)
        mock_asset2.asset_id = 2
        mock_asset2.manual_expected_return = None # Uses default
        mock_asset2.allocation_percentage = Decimal('25.0')
        mock_asset2.created_at = date(2022, 6, 15)
        
        mock_hdp_db_session_query.all.return_value = [mock_asset1, mock_asset2]
        
        portfolio_id = 100
        result = fetch_and_process_asset_data(portfolio_id)

        expected = {
            1: {"manual_expected_return": Decimal('7.5'), "base_allocation_percentage": Decimal('0.50'), "created_at": date(2023,1,1)},
            2: {"manual_expected_return": None, "base_allocation_percentage": Decimal('0.25'), "created_at": date(2022,6,15)}
        }
        assert result == expected
        mock_hdp_db_session_query.filter.assert_called_once() # Basic check query was constructed
        
    def test_fpac_invalid_decimal_values(self, mock_hdp_db_session_query, mock_hdp_current_app_logger):
        mock_asset_invalid = MagicMock(spec=Asset)
        mock_asset_invalid.asset_id = 3
        mock_asset_invalid.manual_expected_return = "not-a-decimal" # Invalid
        mock_asset_invalid.allocation_percentage = "also-invalid"  # Invalid
        mock_asset_invalid.created_at = date(2023, 2, 1)
        
        mock_hdp_db_session_query.all.return_value = [mock_asset_invalid]
        result = fetch_and_process_asset_data(101)
        
        expected_invalid = {
            3: {"manual_expected_return": None, "base_allocation_percentage": Decimal('0'), "created_at": date(2023,2,1)}
        }
        assert result == expected_invalid
        # Two errors should be logged: one for manual_expected_return, one for allocation_percentage
        # The current code structure logs once if either fails due to try-except block structure.
        # Let's check for at least one call.
        assert mock_hdp_current_app_logger.error.call_count >= 1 
        assert "Invalid decimal value for asset 3" in mock_hdp_current_app_logger.error.call_args_list[0][0][0]

    def test_fpac_no_assets(self, mock_hdp_db_session_query, mock_hdp_current_app_logger):
        mock_hdp_db_session_query.all.return_value = []
        result = fetch_and_process_asset_data(102)
        assert result == {}


class TestFetchAndProcessReallocations:
    def test_fpr_valid_reallocations(self, mock_hdp_db_session_query, mock_hdp_current_app_logger):
        mock_realloc1 = MagicMock(spec=PlannedFutureChange)
        mock_realloc1.change_id = 10
        mock_realloc1.change_date = date(2023, 6, 1)
        mock_realloc1.target_allocation_json = json.dumps({"1": "60.0", "2": "40.0"})

        mock_realloc2 = MagicMock(spec=PlannedFutureChange)
        mock_realloc2.change_id = 11
        mock_realloc2.change_date = date(2023, 7, 1)
        # Test with integer and float strings, and whitespace
        mock_realloc2.target_allocation_json = json.dumps({"1": " 50 ", "3": "50.00"}) 

        mock_hdp_db_session_query.all.return_value = [mock_realloc1, mock_realloc2]
        portfolio_id = 200
        end_date = date(2023, 12, 31)
        result = fetch_and_process_reallocations(portfolio_id, end_date)

        expected = [
            {"change_date": date(2023,6,1), "allocations": {1: Decimal('0.60'), 2: Decimal('0.40')}},
            {"change_date": date(2023,7,1), "allocations": {1: Decimal('0.50'), 3: Decimal('0.50')}}
        ]
        assert result == expected
        # mock_hdp_db_session_query.filter.assert_called() # More specific checks can be added for filter args
        # mock_hdp_db_session_query.order_by.assert_called_once()

    @patch('app.services.historical_data_preparation.json.loads')
    def test_fpr_json_decode_error(self, mock_json_loads, mock_hdp_db_session_query, mock_hdp_current_app_logger):
        mock_json_loads.side_effect = json.JSONDecodeError("mock error", "doc", 0)
        
        mock_realloc_bad_json = MagicMock(spec=PlannedFutureChange)
        mock_realloc_bad_json.change_id = 12
        mock_realloc_bad_json.change_date = date(2023, 8, 1)
        mock_realloc_bad_json.target_allocation_json = "this is not json"
        
        mock_hdp_db_session_query.all.return_value = [mock_realloc_bad_json]
        result = fetch_and_process_reallocations(201, date(2023,12,31))
        
        assert result == [] # Bad reallocation is skipped
        mock_hdp_current_app_logger.error.assert_called_once()
        assert "Error processing target_allocation_json for change_id 12" in mock_hdp_current_app_logger.error.call_args[0][0]

    def test_fpr_allocations_do_not_sum_to_one(self, mock_hdp_db_session_query, mock_hdp_current_app_logger):
        mock_realloc_bad_sum = MagicMock(spec=PlannedFutureChange)
        mock_realloc_bad_sum.change_id = 13
        mock_realloc_bad_sum.change_date = date(2023, 9, 1)
        mock_realloc_bad_sum.target_allocation_json = json.dumps({"1": "50.0", "2": "40.0"}) # Sums to 0.9
        
        mock_hdp_db_session_query.all.return_value = [mock_realloc_bad_sum]
        result = fetch_and_process_reallocations(202, date(2023,12,31))
        
        assert result == [] # Bad sum reallocation is skipped
        mock_hdp_current_app_logger.warning.assert_called_once()
        assert "percentages summing to 0.9000, not 1" in mock_hdp_current_app_logger.warning.call_args[0][0]

    def test_fpr_no_reallocations(self, mock_hdp_db_session_query, mock_hdp_current_app_logger):
        mock_hdp_db_session_query.all.return_value = []
        result = fetch_and_process_reallocations(203, date(2023,12,31))
        assert result == []


class TestGetDailyChanges:
    def test_gdc_valid_changes(self, mock_hdp_db_session_query, mock_hdp_current_app_logger):
        mock_contrib1 = MagicMock(spec=PlannedFutureChange)
        mock_contrib1.change_date = date(2023, 1, 10)
        mock_contrib1.change_type = ChangeTypes.CONTRIBUTION
        mock_contrib1.amount = Decimal('1000')

        mock_withdraw1 = MagicMock(spec=PlannedFutureChange)
        mock_withdraw1.change_date = date(2023, 1, 10) # Same date
        mock_withdraw1.change_type = ChangeTypes.WITHDRAWAL
        mock_withdraw1.amount = Decimal('200')
        
        mock_contrib2_dt = MagicMock(spec=PlannedFutureChange) # Test datetime to date conversion
        mock_contrib2_dt.change_date = datetime(2023, 1, 15, 10, 30) 
        mock_contrib2_dt.change_type = ChangeTypes.CONTRIBUTION
        mock_contrib2_dt.amount = Decimal('50')

        mock_hdp_db_session_query.all.return_value = [mock_contrib1, mock_withdraw1, mock_contrib2_dt]
        portfolio_id = 300
        end_date = date(2023,12,31)
        result = get_daily_changes(portfolio_id, end_date)

        expected = {
            date(2023,1,10): [
                {"type": ChangeTypes.CONTRIBUTION, "amount": Decimal('1000')},
                {"type": ChangeTypes.WITHDRAWAL, "amount": Decimal('200')}
            ],
            date(2023,1,15): [
                {"type": ChangeTypes.CONTRIBUTION, "amount": Decimal('50')}
            ]
        }
        assert result == expected

    def test_gdc_invalid_amount(self, mock_hdp_db_session_query, mock_hdp_current_app_logger):
        mock_change_bad_amount = MagicMock(spec=PlannedFutureChange)
        mock_change_bad_amount.change_id = 20
        mock_change_bad_amount.change_date = date(2023, 2, 5)
        mock_change_bad_amount.change_type = ChangeTypes.CONTRIBUTION
        mock_change_bad_amount.amount = "not-money" # Invalid
        
        mock_hdp_db_session_query.all.return_value = [mock_change_bad_amount]
        result = get_daily_changes(301, date(2023,12,31))
        
        expected_bad_amount = {
            date(2023,2,5): [{"type": ChangeTypes.CONTRIBUTION, "amount": Decimal('0')}]
        }
        assert result == expected_bad_amount
        mock_hdp_current_app_logger.error.assert_called_once()
        assert "Invalid amount for change_id 20" in mock_hdp_current_app_logger.error.call_args[0][0]

    def test_gdc_no_changes(self, mock_hdp_db_session_query, mock_hdp_current_app_logger):
        mock_hdp_db_session_query.all.return_value = []
        result = get_daily_changes(302, date(2023,12,31))
        assert result == {}


# --- Tests for TaskService (get_task_status) ---

from app.services.task_service import get_task_status
# AsyncResult is the main thing to mock here.
# UserCeleryTask model is NOT used by the current task_service.py
# User model is NOT used.
# datetime is already imported.
# MagicMock, patch are already imported.

# Mock current_app since it's used by the service for logging
@pytest.fixture
def mock_current_app_logger():
    with patch('app.services.task_service.current_app') as mock_app:
        mock_app.logger = MagicMock()
        yield mock_app.logger

@pytest.fixture
def mock_async_result():
    # This fixture provides a way to get a mock AsyncResult instance
    # It will be patched in each test where AsyncResult is instantiated
    # e.g. @patch('app.services.task_service.AsyncResult')
    #      def test_my_thing(mock_async_result_constructor, ...):
    #          mock_instance = MagicMock()
    #          mock_async_result_constructor.return_value = mock_instance
    #          # ... setup mock_instance ...
    # This fixture itself doesn't do the patching, but serves as a reminder/pattern.
    # For simplicity, we'll patch directly in tests.
    pass


class TestGetTaskStatus:

    @patch('app.services.task_service.celery_app') # Mock celery_app passed to AsyncResult
    @patch('app.services.task_service.AsyncResult')
    def test_gts_task_successful_dict_result(self, mock_async_result_constructor, mock_celery_app_obj, mock_current_app_logger):
        task_id = "succ_dict_task_1"
        mock_ar_instance = MagicMock()
        mock_ar_instance.status = "SUCCESS"
        mock_ar_instance.successful.return_value = True
        mock_ar_instance.failed.return_value = False
        mock_ar_instance.result = {"data": {"key": "value"}, "message": "Custom success message"}
        mock_ar_instance.date_done = datetime(2024, 1, 1, 12, 0, 0)
        mock_ar_instance.info = None # Or some progress dict
        
        mock_async_result_constructor.return_value = mock_ar_instance

        response = get_task_status(task_id)

        mock_async_result_constructor.assert_called_once_with(task_id, app=mock_celery_app_obj)
        assert response["task_id"] == task_id
        assert response["status"] == "COMPLETED"
        assert response["result"] == {"key": "value"}
        assert response["message"] == "Custom success message"
        assert response["error"] is None
        assert response["updated_at"] == datetime(2024, 1, 1, 12, 0, 0).isoformat()

    @patch('app.services.task_service.celery_app')
    @patch('app.services.task_service.AsyncResult')
    def test_gts_task_successful_non_dict_result(self, mock_async_result_constructor, mock_celery_app_obj, mock_current_app_logger):
        task_id = "succ_non_dict_task_2"
        mock_ar_instance = MagicMock()
        mock_ar_instance.status = "SUCCESS"
        mock_ar_instance.successful.return_value = True
        mock_ar_instance.failed.return_value = False
        mock_ar_instance.result = "Simple string result"
        mock_ar_instance.date_done = None
        
        mock_async_result_constructor.return_value = mock_ar_instance

        response = get_task_status(task_id)
        
        assert response["status"] == "COMPLETED"
        assert response["result"] == "Simple string result"
        assert response["message"] == "Task completed successfully with non-dictionary result."
        assert response["updated_at"] is None

    @patch('app.services.task_service.celery_app')
    @patch('app.services.task_service.AsyncResult')
    def test_gts_task_failed(self, mock_async_result_constructor, mock_celery_app_obj, mock_current_app_logger):
        task_id = "failed_task_3"
        mock_ar_instance = MagicMock()
        mock_ar_instance.status = "FAILURE"
        mock_ar_instance.successful.return_value = False
        mock_ar_instance.failed.return_value = True
        mock_ar_instance.result = ValueError("Something went wrong") # Celery stores exception instance
        mock_ar_instance.traceback = "Traceback details..."
        mock_ar_instance.date_done = datetime(2024, 1, 2, 10, 0, 0)
        
        mock_async_result_constructor.return_value = mock_ar_instance

        response = get_task_status(task_id)

        assert response["status"] == "FAILED"
        assert response["result"] is None
        assert response["error"] == str(ValueError("Something went wrong"))
        assert response["message"] == "Task failed. See error field for details."
        assert response["updated_at"] == datetime(2024, 1, 2, 10, 0, 0).isoformat()

    @patch('app.services.task_service.celery_app')
    @patch('app.services.task_service.AsyncResult')
    def test_gts_task_pending(self, mock_async_result_constructor, mock_celery_app_obj, mock_current_app_logger):
        task_id = "pending_task_4"
        mock_ar_instance = MagicMock()
        mock_ar_instance.status = "PENDING"
        mock_ar_instance.successful.return_value = False
        mock_ar_instance.failed.return_value = False
        mock_ar_instance.result = None
        mock_ar_instance.info = None 
        mock_ar_instance.date_done = None
        
        mock_async_result_constructor.return_value = mock_ar_instance

        response = get_task_status(task_id)

        assert response["status"] == "PENDING"
        assert response["message"] == "Task is pending."
        assert response["result"] is None
        assert response["error"] is None

    @patch('app.services.task_service.celery_app')
    @patch('app.services.task_service.AsyncResult')
    def test_gts_task_pending_with_info_dict(self, mock_async_result_constructor, mock_celery_app_obj, mock_current_app_logger):
        task_id = "pending_info_task_5"
        mock_ar_instance = MagicMock()
        mock_ar_instance.status = "PENDING"
        mock_ar_instance.successful.return_value = False
        mock_ar_instance.failed.return_value = False
        mock_ar_instance.result = None
        mock_ar_instance.info = {"status": "Waiting for resources"}
        mock_ar_instance.date_done = None
        
        mock_async_result_constructor.return_value = mock_ar_instance

        response = get_task_status(task_id)
        assert response["status"] == "PENDING"
        assert response["message"] == "Task is pending: Waiting for resources"

    @patch('app.services.task_service.celery_app')
    @patch('app.services.task_service.AsyncResult')
    def test_gts_task_started(self, mock_async_result_constructor, mock_celery_app_obj, mock_current_app_logger):
        task_id = "started_task_6"
        mock_ar_instance = MagicMock()
        mock_ar_instance.status = "STARTED"
        mock_ar_instance.successful.return_value = False
        mock_ar_instance.failed.return_value = False
        mock_ar_instance.result = None
        mock_ar_instance.info = {"progress": "20%"}
        mock_ar_instance.date_done = None
        
        mock_async_result_constructor.return_value = mock_ar_instance

        response = get_task_status(task_id)
        assert response["status"] == "PROCESSING"
        assert response["message"] == "Task is processing: 20%"
        assert response["result"] is None
        assert response["error"] is None

    @patch('app.services.task_service.celery_app')
    @patch('app.services.task_service.AsyncResult')
    def test_gts_task_retry(self, mock_async_result_constructor, mock_celery_app_obj, mock_current_app_logger):
        task_id = "retry_task_7"
        mock_ar_instance = MagicMock()
        mock_ar_instance.status = "RETRY"
        mock_ar_instance.successful.return_value = False
        mock_ar_instance.failed.return_value = False
        mock_ar_instance.result = None # Retry usually means no final result
        mock_ar_instance.info = "Retrying in 5s due to external service timeout"
        mock_ar_instance.date_done = None
        
        mock_async_result_constructor.return_value = mock_ar_instance

        response = get_task_status(task_id)
        assert response["status"] == "PROCESSING" # RETRY maps to PROCESSING
        assert response["message"] == "Task is processing with status: Retrying in 5s due to external service timeout"
        assert response["result"] is None
        assert response["error"] is None

    @patch('app.services.task_service.celery_app')
    @patch('app.services.task_service.AsyncResult')
    def test_gts_task_unknown_celery_status(self, mock_async_result_constructor, mock_celery_app_obj, mock_current_app_logger):
        task_id = "unknown_status_task_8"
        mock_ar_instance = MagicMock()
        mock_ar_instance.status = "WEIRD_CELERY_STATE" # An unknown state
        mock_ar_instance.successful.return_value = False
        mock_ar_instance.failed.return_value = False
        mock_ar_instance.result = None
        mock_ar_instance.info = None
        mock_ar_instance.date_done = None
        
        mock_async_result_constructor.return_value = mock_ar_instance

        response = get_task_status(task_id)
        # The service maps unknown Celery statuses to themselves for application_status
        assert response["status"] == "WEIRD_CELERY_STATE" 
        assert response["message"] == "Task status: WEIRD_CELERY_STATE." 
        assert response["result"] is None
        assert response["error"] is None
    
    @patch('app.services.task_service.celery_app')
    @patch('app.services.task_service.AsyncResult', side_effect=Exception("Celery comms error"))
    def test_gts_async_result_exception(self, mock_async_result_constructor, mock_celery_app_obj, mock_current_app_logger):
        task_id = "exception_task_9"
        
        response = get_task_status(task_id)
        
        assert response["task_id"] == task_id
        assert response["status"] == "UNKNOWN_ERROR"
        assert response["message"] == "An internal error occurred while fetching task status."
        assert "Celery comms error" in response["error"]
        mock_current_app_logger.error.assert_called_once()
        assert "CRITICAL error in get_task_status" in mock_current_app_logger.error.call_args[0][0]


# --- Tests for ProjectionInitializer (initialize_projection and helpers) ---

from app.services.projection_initializer import (
    initialize_projection,
    _initialize_asset_values,
    _calculate_all_monthly_asset_returns
)
# Asset, AssetTypes already imported
# MagicMock, patch, Decimal, pytest already imported

# Helper to create mock Asset objects for initializer tests
def create_pi_mock_asset(
    asset_id: int,
    name_or_ticker: str = "Test Asset",
    asset_type: AssetTypes = AssetTypes.STOCK,
    allocation_value: Decimal | None = None,
    allocation_percentage: Decimal | None = None,
    manual_expected_return: Decimal | None = None # For _calculate_all_monthly_asset_returns part
) -> MagicMock:
    asset = MagicMock(spec=Asset)
    asset.asset_id = asset_id
    asset.name_or_ticker = name_or_ticker
    asset.asset_type = asset_type
    asset.allocation_value = allocation_value
    asset.allocation_percentage = allocation_percentage
    asset.manual_expected_return = manual_expected_return
    return asset

class TestInitializeAssetValues:
    def test_iav_fixed_values_only(self):
        assets = [
            create_pi_mock_asset(asset_id=1, allocation_value=Decimal('1000')),
            create_pi_mock_asset(asset_id=2, allocation_value=Decimal('2000')),
        ]
        expected_asset_values = {1: Decimal('1000'), 2: Decimal('2000')}
        expected_total = Decimal('3000')
        
        asset_values, total_value = _initialize_asset_values(assets, None)
        assert asset_values == expected_asset_values
        assert total_value == expected_total

    def test_iav_percentage_values_only_with_override(self):
        assets = [
            create_pi_mock_asset(asset_id=1, allocation_percentage=Decimal('60')), # 60%
            create_pi_mock_asset(asset_id=2, allocation_percentage=Decimal('40')), # 40%
        ]
        override_total = Decimal('10000')
        expected_asset_values = {1: Decimal('6000'), 2: Decimal('4000')}
        expected_total = Decimal('10000')

        asset_values, total_value = _initialize_asset_values(assets, override_total)
        assert asset_values == expected_asset_values
        assert total_value == expected_total

    def test_iav_percentage_values_only_no_override_no_fixed(self):
        # If no override and no fixed values, total for percentage calc is 0
        assets = [create_pi_mock_asset(asset_id=1, allocation_percentage=Decimal('100'))]
        expected_asset_values = {1: Decimal('0')} # 100% of 0 is 0
        expected_total = Decimal('0')

        with patch('app.services.projection_initializer.logger') as mock_logger:
            asset_values, total_value = _initialize_asset_values(assets, None)
            assert asset_values == expected_asset_values
            assert total_value == expected_total
            mock_logger.warning.assert_any_call(
                "Cannot calculate percentage-based allocations because the definitive total portfolio value is zero or negative. "
                "Percentage-based assets will remain at 0."
            )
            
    def test_iav_mixed_fixed_and_percentage_with_override(self):
        assets = [
            create_pi_mock_asset(asset_id=1, allocation_value=Decimal('2000')),
            create_pi_mock_asset(asset_id=2, allocation_percentage=Decimal('50')), # 50% of override
        ]
        override_total = Decimal('10000') # Override is used for percentage assets
        # Asset 1 is fixed at 2000. Asset 2 is 50% of 10000 = 5000.
        expected_asset_values = {1: Decimal('2000'), 2: Decimal('5000')}
        # Total sum of final values
        expected_total = Decimal('7000') 

        asset_values, total_value = _initialize_asset_values(assets, override_total)
        assert asset_values == expected_asset_values
        assert total_value == expected_total

    def test_iav_mixed_fixed_and_percentage_no_override(self):
        assets = [
            create_pi_mock_asset(asset_id=1, allocation_value=Decimal('4000')),
            create_pi_mock_asset(asset_id=2, allocation_percentage=Decimal('50')), # 50% of fixed total (4000)
        ]
        # Asset 1 is 4000. Asset 2 is 50% of 4000 = 2000.
        expected_asset_values = {1: Decimal('4000'), 2: Decimal('2000')}
        expected_total = Decimal('6000')

        asset_values, total_value = _initialize_asset_values(assets, None)
        assert asset_values == expected_asset_values
        assert total_value == expected_total

    @patch('app.services.projection_initializer.logger')
    def test_iav_invalid_allocation_value(self, mock_logger):
        assets = [create_pi_mock_asset(asset_id=1, allocation_value="invalid")]
        asset_values, total_value = _initialize_asset_values(assets, None)
        assert asset_values[1] == Decimal('0')
        assert total_value == Decimal('0')
        mock_logger.error.assert_called_once_with("Invalid allocation_value 'invalid' for asset 1. Setting to 0.")

    @patch('app.services.projection_initializer.logger')
    def test_iav_no_allocation_info(self, mock_logger):
        assets = [create_pi_mock_asset(asset_id=1)] # No value or percentage
        asset_values, total_value = _initialize_asset_values(assets, None)
        assert asset_values[1] == Decimal('0')
        mock_logger.warning.assert_called_once_with("Asset 1 has neither allocation_value nor allocation_percentage. Initialized to 0.")


class TestCalculateAllMonthlyAssetReturns:
    @patch('app.services.projection_initializer._get_return_strategy')
    def test_caar_basic_returns(self, mock_get_strategy):
        mock_strategy_instance = MagicMock()
        mock_strategy_instance.calculate_monthly_return.side_effect = [Decimal('0.01'), Decimal('0.005')]
        mock_get_strategy.return_value = mock_strategy_instance

        assets = [
            create_pi_mock_asset(asset_id=1, asset_type=AssetTypes.STOCK),
            create_pi_mock_asset(asset_id=2, asset_type=AssetTypes.BOND),
        ]
        expected_returns = {1: Decimal('0.01'), 2: Decimal('0.005')}
        
        monthly_returns = _calculate_all_monthly_asset_returns(assets)
        assert monthly_returns == expected_returns
        assert mock_get_strategy.call_count == 2
        mock_strategy_instance.calculate_monthly_return.assert_any_call(assets[0])
        mock_strategy_instance.calculate_monthly_return.assert_any_call(assets[1])

    @patch('app.services.projection_initializer.logger')
    @patch('app.services.projection_initializer._get_return_strategy')
    def test_caar_unrecognized_asset_type_string(self, mock_get_strategy, mock_logger):
        assets = [create_pi_mock_asset(asset_id=1, asset_type="INVALID_TYPE_STR")]
        # _get_return_strategy (the real one) would log and return standard.
        # Here, we test the asset_type conversion within _calculate_all_monthly_asset_returns.
        
        monthly_returns = _calculate_all_monthly_asset_returns(assets)
        assert monthly_returns[1] == Decimal('0.0')
        mock_logger.error.assert_called_once_with("Asset 1 has an unrecognized asset type 'INVALID_TYPE_STR'. Cannot determine return strategy.")
        mock_get_strategy.assert_not_called() # Because type conversion fails before strategy lookup

    @patch('app.services.projection_initializer.logger')
    @patch('app.services.projection_initializer._get_return_strategy')
    def test_caar_strategy_exception(self, mock_get_strategy, mock_logger):
        mock_strategy_instance = MagicMock()
        mock_strategy_instance.calculate_monthly_return.side_effect = Exception("Strategy failed!")
        mock_get_strategy.return_value = mock_strategy_instance
        
        assets = [create_pi_mock_asset(asset_id=1, asset_type=AssetTypes.STOCK)]
        monthly_returns = _calculate_all_monthly_asset_returns(assets)
        assert monthly_returns[1] == Decimal('0.0')
        mock_logger.exception.assert_called_once()
        assert "Error calculating monthly return for asset 1 (Test Asset) via strategy." in mock_logger.exception.call_args[0][0]


class TestInitializeProjection:
    @patch('app.services.projection_initializer._calculate_all_monthly_asset_returns')
    @patch('app.services.projection_initializer._initialize_asset_values')
    def test_ip_override_provided(self, mock_init_values, mock_calc_returns):
        assets_list = [create_pi_mock_asset(asset_id=1)]
        override_value = Decimal('5000')

        # Setup mocks
        mock_init_values.return_value = ({1: Decimal('4800')}, Decimal('4800')) # calculated_total less than override
        mock_calc_returns.return_value = {1: Decimal('0.01')}
        
        with patch('app.services.projection_initializer.logger') as mock_logger:
            current_asset_vals, monthly_returns, proj_start_total = initialize_projection(assets_list, override_value)
            
            assert current_asset_vals == {1: Decimal('4800')}
            assert monthly_returns == {1: Decimal('0.01')}
            assert proj_start_total == override_value # Override is used

            mock_init_values.assert_called_once_with(assets_list, override_value)
            mock_calc_returns.assert_called_once_with(assets_list)
            # Check for warning about discrepancy
            mock_logger.warning.assert_called_once()
            assert "differs significantly from the provided initial_total_value_override" in mock_logger.warning.call_args[0][0]

    @patch('app.services.projection_initializer._calculate_all_monthly_asset_returns')
    @patch('app.services.projection_initializer._initialize_asset_values')
    def test_ip_no_override(self, mock_init_values, mock_calc_returns):
        assets_list = [create_pi_mock_asset(asset_id=1)]
        
        mock_init_values.return_value = ({1: Decimal('4500')}, Decimal('4500')) # calculated_total
        mock_calc_returns.return_value = {1: Decimal('0.01')}
        
        with patch('app.services.projection_initializer.logger') as mock_logger:
            current_asset_vals, monthly_returns, proj_start_total = initialize_projection(assets_list, None) # No override
            
            assert current_asset_vals == {1: Decimal('4500')}
            assert monthly_returns == {1: Decimal('0.01')}
            assert proj_start_total == Decimal('4500') # Sum from assets is used
            mock_logger.warning.assert_not_called() # No discrepancy warning expected

    @patch('app.services.projection_initializer._calculate_all_monthly_asset_returns')
    @patch('app.services.projection_initializer._initialize_asset_values')
    def test_ip_override_matches_calculated_sum_no_warning(self, mock_init_values, mock_calc_returns):
        assets_list = [create_pi_mock_asset(asset_id=1)]
        override_value = Decimal('5000')

        # Setup mocks where calculated sum is very close to override
        mock_init_values.return_value = ({1: Decimal('5000.005')}, Decimal('5000.005')) 
        mock_calc_returns.return_value = {1: Decimal('0.01')}
        
        with patch('app.services.projection_initializer.logger') as mock_logger:
            current_asset_vals, monthly_returns, proj_start_total = initialize_projection(assets_list, override_value)
            
            assert proj_start_total == override_value
            mock_logger.warning.assert_not_called() # Discrepancy should be within tolerance


# --- Tests for MonthlyCalculator (calculate_single_month and helpers) ---

from app.services.monthly_calculator import (
    calculate_single_month,
    _apply_monthly_growth,
    _calculate_net_monthly_change,
    _distribute_cash_flow,
    CHANGE_TYPE_CASH_FLOW_EFFECTS # For direct testing of change type effects
)
# PlannedFutureChange, ChangeTypes, Currencies already imported
# Asset model not directly used by these functions, but asset_id (int) is key in dicts

# --- Tests for _apply_monthly_growth ---
def test_apply_monthly_growth_positive():
    current_values = {1: Decimal('1000'), 2: Decimal('2000')}
    monthly_returns = {1: Decimal('0.01'), 2: Decimal('0.02')} # 1% and 2%
    expected_values = {
        1: Decimal('1000') * (Decimal('1') + Decimal('0.01')), # 1010
        2: Decimal('2000') * (Decimal('1') + Decimal('0.02'))  # 2040
    }
    expected_total = sum(expected_values.values()) # 3050

    result_values, result_total = _apply_monthly_growth(current_values, monthly_returns)
    assert result_values == expected_values
    assert result_total == pytest.approx(expected_total)

def test_apply_monthly_growth_negative():
    current_values = {1: Decimal('1000')}
    monthly_returns = {1: Decimal('-0.05')} # -5%
    expected_values = {1: Decimal('1000') * (Decimal('1') - Decimal('0.05'))} # 950
    expected_total = expected_values[1]

    result_values, result_total = _apply_monthly_growth(current_values, monthly_returns)
    assert result_values == expected_values
    assert result_total == pytest.approx(expected_total)

def test_apply_monthly_growth_total_loss():
    current_values = {1: Decimal('1000')}
    monthly_returns = {1: Decimal('-1.0')} # -100%
    expected_values = {1: Decimal('0.0')}
    expected_total = Decimal('0.0')

    result_values, result_total = _apply_monthly_growth(current_values, monthly_returns)
    assert result_values[1] == pytest.approx(expected_values[1])
    assert result_total == pytest.approx(expected_total)

# --- Tests for _calculate_net_monthly_change ---
def test_calculate_net_monthly_change_various_types():
    changes = [
        PlannedFutureChange(change_type=ChangeTypes.CONTRIBUTION, amount=Decimal('100')),
        PlannedFutureChange(change_type=ChangeTypes.WITHDRAWAL, amount=Decimal('30')),
        PlannedFutureChange(change_type=ChangeTypes.DIVIDEND, amount=Decimal('10')),
        PlannedFutureChange(change_type=ChangeTypes.INTEREST, amount=Decimal('5')),
        PlannedFutureChange(change_type=ChangeTypes.REALLOCATION, amount=Decimal('500')) # Should be ignored
    ]
    expected_net_change = Decimal('100') - Decimal('30') + Decimal('10') + Decimal('5') # 85
    net_change = _calculate_net_monthly_change(changes)
    assert net_change == pytest.approx(expected_net_change)

@patch('app.services.monthly_calculator.logger')
def test_calculate_net_monthly_change_invalid_amount(mock_logger):
    changes = [
        PlannedFutureChange(change_type=ChangeTypes.CONTRIBUTION, amount="not-a-decimal", change_date=date(2024,1,1)),
        PlannedFutureChange(change_type=ChangeTypes.WITHDRAWAL, amount=Decimal('50'))
    ]
    expected_net_change = Decimal('-50') # Only withdrawal is processed
    net_change = _calculate_net_monthly_change(changes)
    assert net_change == pytest.approx(expected_net_change)
    mock_logger.warning.assert_called_once()
    assert "Invalid amount 'not-a-decimal'" in mock_logger.warning.call_args[0][0]

# --- Tests for _distribute_cash_flow ---
def test_distribute_cash_flow_positive_total_positive_cashflow():
    value_pre_cashflow = {1: Decimal('1000'), 2: Decimal('3000')} # Total 4000
    total_pre_cashflow = Decimal('4000')
    net_change = Decimal('400') # 10% of total
    
    # Asset 1 gets 1000/4000 * 400 = 100. New value = 1000 + 100 = 1100
    # Asset 2 gets 3000/4000 * 400 = 300. New value = 3000 + 300 = 3300
    expected_final_values = {1: Decimal('1100'), 2: Decimal('3300')}
    expected_final_total = Decimal('4400')

    result_values, result_total = _distribute_cash_flow(date(2024,1,1), value_pre_cashflow, total_pre_cashflow, net_change)
    assert result_values[1] == pytest.approx(expected_final_values[1])
    assert result_values[2] == pytest.approx(expected_final_values[2])
    assert result_total == pytest.approx(expected_final_total)

def test_distribute_cash_flow_positive_total_negative_cashflow():
    value_pre_cashflow = {1: Decimal('1000'), 2: Decimal('1000')} # Total 2000
    total_pre_cashflow = Decimal('2000')
    net_change = Decimal('-200') # Withdrawal, -10% of total
    
    # Asset 1 loses 1000/2000 * 200 = 100. New value = 1000 - 100 = 900
    # Asset 2 loses 1000/2000 * 200 = 100. New value = 1000 - 100 = 900
    expected_final_values = {1: Decimal('900'), 2: Decimal('900')}
    expected_final_total = Decimal('1800')

    result_values, result_total = _distribute_cash_flow(date(2024,1,1), value_pre_cashflow, total_pre_cashflow, net_change)
    assert result_values[1] == pytest.approx(expected_final_values[1])
    assert result_values[2] == pytest.approx(expected_final_values[2])
    assert result_total == pytest.approx(expected_final_total)

def test_distribute_cash_flow_zero_total_positive_cashflow():
    value_pre_cashflow = {1: Decimal('0'), 2: Decimal('0')} # Total 0
    total_pre_cashflow = Decimal('0')
    net_change = Decimal('500')
    
    # Should add to the first asset if total is zero
    expected_final_values = {1: Decimal('500'), 2: Decimal('0')} 
    expected_final_total = Decimal('500')

    result_values, result_total = _distribute_cash_flow(date(2024,1,1), value_pre_cashflow, total_pre_cashflow, net_change)
    assert result_values == expected_final_values
    assert result_total == pytest.approx(expected_final_total)

@patch('app.services.monthly_calculator.logger')
def test_distribute_cash_flow_zero_total_negative_cashflow(mock_logger):
    value_pre_cashflow = {1: Decimal('0')}
    total_pre_cashflow = Decimal('0')
    net_change = Decimal('-100') # Withdrawal from zero
    
    expected_final_values = {1: Decimal('0')} # Assets remain 0
    expected_final_total = Decimal('-100') # Total becomes negative

    result_values, result_total = _distribute_cash_flow(date(2024,1,1), value_pre_cashflow, total_pre_cashflow, net_change)
    assert result_values == expected_final_values
    assert result_total == pytest.approx(expected_final_total)
    mock_logger.warning.assert_called_once()

# --- Tests for calculate_single_month (integration of the helpers) ---
def test_calculate_single_month_positive_growth_and_investment():
    current_assets = {1: Decimal('10000')}
    monthly_returns = {1: Decimal('0.01')} # 1% monthly return
    changes = [PlannedFutureChange(change_type=ChangeTypes.CONTRIBUTION, amount=Decimal('500'))]
    
    # Step 1: Growth: 10000 * 1.01 = 10100
    # Step 2: Net Cash Flow: +500
    # Step 3: Distribution: (value_pre_cashflow = 10100, total_pre_cashflow = 10100)
    #         Asset 1 gets 500 * (10100/10100) = 500.
    #         Final value Asset 1 = 10100 + 500 = 10600
    #         Final total = 10600
    expected_final_assets = {1: Decimal('10600')}
    expected_final_total = Decimal('10600')

    final_assets, final_total = calculate_single_month(date(2024,1,1), current_assets, monthly_returns, changes)
    assert final_assets[1] == pytest.approx(expected_final_assets[1])
    assert final_total == pytest.approx(expected_final_total)

def test_calculate_single_month_negative_growth_and_withdrawal():
    current_assets = {1: Decimal('20000'), 2: Decimal('5000')} # Total 25000
    monthly_returns = {1: Decimal('-0.005'), 2: Decimal('-0.01')} # -0.5% and -1%
    changes = [PlannedFutureChange(change_type=ChangeTypes.WITHDRAWAL, amount=Decimal('1000'))]

    # Step 1: Growth
    # Asset 1: 20000 * (1 - 0.005) = 20000 * 0.995 = 19900
    # Asset 2: 5000 * (1 - 0.01) = 5000 * 0.99 = 4950
    # value_i_pre_cashflow = {1: 19900, 2: 4950}
    # total_value_pre_cashflow = 19900 + 4950 = 24850

    # Step 2: Net Cash Flow: -1000

    # Step 3: Distribution: (net_change = -1000)
    # Asset 1 proportion: 19900 / 24850
    # Asset 1 cash flow: -1000 * (19900 / 24850) = -1000 * 0.8 = -800
    # Final Asset 1: 19900 - 800 = 19100
    # Asset 2 proportion: 4950 / 24850
    # Asset 2 cash flow: -1000 * (4950 / 24850) = -1000 * 0.2 = -200
    # Final Asset 2: 4950 - 200 = 4750
    # Final total = 19100 + 4750 = 23850

    expected_final_assets = {1: Decimal('19100'), 2: Decimal('4750')}
    expected_final_total = Decimal('23850')
    
    final_assets, final_total = calculate_single_month(date(2024,1,1), current_assets, monthly_returns, changes)
    assert final_assets[1] == pytest.approx(expected_final_assets[1])
    assert final_assets[2] == pytest.approx(expected_final_assets[2])
    assert final_total == pytest.approx(expected_final_total)

def test_calculate_single_month_zero_returns_no_cashflow():
    current_assets = {1: Decimal('5000')}
    monthly_returns = {1: Decimal('0.0')}
    changes = []
    
    expected_final_assets = {1: Decimal('5000')}
    expected_final_total = Decimal('5000')

    final_assets, final_total = calculate_single_month(date(2024,1,1), current_assets, monthly_returns, changes)
    assert final_assets[1] == pytest.approx(expected_final_assets[1])
    assert final_total == pytest.approx(expected_final_total)
