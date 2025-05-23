/**
 * @file portfolioConstants.js
 * @description This file centralizes constants related to portfolio management,
 * including types of portfolio changes, asset type options for selection,
 * and default values for portfolio projections. These constants are used across
 * various components and services to ensure consistency and ease of maintenance.
 */

/**
 * Array of objects representing different types of portfolio changes.
 * Each object contains a `value` (internal identifier, possibly matching backend enums)
 * and a `label` (user-friendly display name).
 * Primarily used for populating UI elements like select dropdowns for filtering
 * or categorizing planned portfolio changes.
 * The first option `{ value: '', label: 'All Types' }` is typically used as a default/filter-reset option.
 * @type {Array<{value: string, label: string}>}
 */
export const CHANGE_TYPES = [
  { value: '', label: 'All Types' }, // Option to select/show all types.
  { value: 'CONTRIBUTION', label: 'Contribution' }, // e.g., Adding funds.
  { value: 'WITHDRAWAL', label: 'Withdrawal' },   // e.g., Taking funds out.
  { value: 'REALLOCATION', label: 'Reallocation' }, // e.g., Adjusting asset distribution.
  // Add other types as defined in backend enums to maintain consistency.
];

/**
 * Array of objects representing various asset types available for selection in a portfolio.
 * Each object has a `value` (internal identifier, could be the same as label or a specific code)
 * and a `label` (user-friendly display name).
 * Used in UI elements like select dropdowns when users are adding or editing portfolio assets.
 * @type {Array<{value: string, label: string}>}
 */
export const ASSET_TYPE_OPTIONS = [
  { value: 'Stock', label: 'Stock' },
  { value: 'Bond', label: 'Bond' },
  { value: 'Mutual Fund', label: 'Mutual Fund' },
  { value: 'ETF', label: 'Exchange-Traded Fund (ETF)' }, // Expanded for clarity
  { value: 'Real Estate', label: 'Real Estate' },
  { value: 'Cash', label: 'Cash / Cash Equivalents' }, // Expanded for clarity
  { value: 'Cryptocurrency', label: 'Cryptocurrency' },
  { value: 'Options', label: 'Options' }, // Financial options
  { value: 'Other', label: 'Other' }, // For asset types not explicitly listed.
];

// --- ProjectionPanel Default Values ---
// These constants define default parameters primarily used within the ProjectionPanel component
// or related portfolio projection functionalities.

/**
 * Default time horizon in years for portfolio projections.
 * Used as an initial or fallback value when a specific horizon is not set by the user.
 * @type {number}
 */
export const DEFAULT_PROJECTION_HORIZON_YEARS = 2;

/**
 * Default initial investment value for portfolio projections.
 * Used as a starting point if no other initial value is provided for a projection calculation.
 * @type {number}
 */
export const DEFAULT_INITIAL_VALUE = 1000;