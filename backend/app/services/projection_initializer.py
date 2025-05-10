from decimal import Decimal, InvalidOperation # InvalidOperation might not be used here after all.
import logging
from typing import List, Dict # Tuple is not used here. Dict for current_asset_values, monthly_asset_returns

from app.models import Asset
from app.enums import AssetType
# Assuming return_strategies is in the same directory or accessible
from .return_strategies import get_return_strategy as _get_return_strategy

def initialize_projection(assets: list[Asset], initial_total_value: Decimal | None) -> tuple[Dict[int, Decimal], Dict[int, Decimal], Decimal]:
    """Initializes asset values, monthly returns, and total value."""
    current_asset_values: Dict[int, Decimal] = {}
    monthly_asset_returns: Dict[int, Decimal] = {}
    calculated_initial_total = Decimal('0.0')

    # First pass: Calculate initial values and total
    temp_asset_values: Dict[int, Decimal] = {} # Temporary dict to store initial values before potentially adjusting based on percentage
    for asset in assets:
        initial_value = Decimal('0.0')
        if asset.allocation_value is not None:
            initial_value = Decimal(asset.allocation_value)
            temp_asset_values[asset.asset_id] = initial_value
            calculated_initial_total += initial_value
        # Percentage calculation needs the total, handle in second pass

    # Handle percentage-based allocations if initial_total_value is provided OR if only percentages were given
    final_initial_total = initial_total_value if initial_total_value is not None else calculated_initial_total

    if final_initial_total == Decimal('0.0') and any(a.allocation_percentage is not None for a in assets):
         print("Warning: Cannot calculate percentage allocations because initial total value is zero and no fixed value allocations exist.")
         # Proceed, but percentage assets will remain at 0 initial value

    # Second pass: Finalize initial values and calculate monthly returns
    actual_calculated_total = Decimal('0.0') # Recalculate based on final assignments
    for asset in assets:
        initial_value = temp_asset_values.get(asset.asset_id, Decimal('0.0')) # Get value if set previously

        if asset.allocation_percentage is not None and asset.allocation_value is None and final_initial_total > Decimal('0.0'):
            # Calculate value from percentage only if value wasn't explicitly set
            initial_value = (Decimal(asset.allocation_percentage) / Decimal('100')) * final_initial_total
        elif asset.allocation_percentage is not None and asset.allocation_value is not None:
             # If both are set, value takes precedence (already handled), maybe log a warning?
             print(f"Warning: Asset {asset.asset_id} has both allocation_value and allocation_percentage. Using allocation_value.")


        current_asset_values[asset.asset_id] = initial_value
        actual_calculated_total += initial_value

        # --- Calculate Monthly Asset Returns using Strategy ---
        try:
            # Ensure asset.asset_type is the Enum member if not already
            asset_enum_type = asset.asset_type
            if not isinstance(asset_enum_type, AssetType):
                 # Attempt to convert string representation back to Enum member if needed
                 # This might occur if data isn't loaded correctly as Enum from DB
                 try:
                     asset_enum_type = AssetType[asset_enum_type] # Assumes the string matches enum member name
                 except KeyError:
                      print(f"Error: Asset {asset.asset_id} has an unrecognized asset type '{asset_enum_type}'. Cannot determine return strategy.")
                      monthly_asset_returns[asset.asset_id] = Decimal('0.0') # Assign default zero return
                      continue # Skip to next asset


            strategy = _get_return_strategy(asset_enum_type) # type: ignore
            monthly_return = strategy.calculate_monthly_return(asset)
            monthly_asset_returns[asset.asset_id] = monthly_return
        except Exception as e:
             # Log the full traceback for unexpected errors during strategy execution
             logging.exception(f"Error calculating monthly return for asset {asset.asset_id} via strategy. Setting return to 0.")
             monthly_asset_returns[asset.asset_id] = Decimal('0.0')


    # Optional Validation: Compare final actual calculated total with provided initial_total_value
    tolerance = Decimal('0.01') * max(Decimal('1.0'), final_initial_total) # Relative tolerance or absolute 0.01 if total is small/zero
    if initial_total_value is not None and abs(actual_calculated_total - initial_total_value) > tolerance:
        print(f"Warning: Final calculated initial asset values sum ({actual_calculated_total:.2f}) "
              f"differs significantly from provided initial_total_value ({initial_total_value:.2f}). Check allocations. Using calculated total for projection start.")
        start_total_value = actual_calculated_total 
    elif initial_total_value is not None:
         start_total_value = initial_total_value 
    else:
        start_total_value = actual_calculated_total

    return current_asset_values, monthly_asset_returns, start_total_value 