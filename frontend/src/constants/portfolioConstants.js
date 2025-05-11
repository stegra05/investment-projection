export const CHANGE_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'CONTRIBUTION', label: 'Contribution' },
  { value: 'WITHDRAWAL', label: 'Withdrawal' },
  { value: 'REALLOCATION', label: 'Reallocation' },
  // Add other types as defined in backend enums
];

export const ASSET_TYPE_OPTIONS = [
  { value: 'Stock', label: 'Stock' },
  { value: 'Bond', label: 'Bond' },
  { value: 'Mutual Fund', label: 'Mutual Fund' },
  { value: 'ETF', label: 'ETF' },
  { value: 'Real Estate', label: 'Real Estate' },
  { value: 'Cash', label: 'Cash' },
  { value: 'Cryptocurrency', label: 'Cryptocurrency' },
  { value: 'Options', label: 'Options' },
  { value: 'Other', label: 'Other' },
];

// ProjectionPanel default values
export const DEFAULT_PROJECTION_HORIZON_YEARS = 2;
export const DEFAULT_INITIAL_VALUE = 1000; 