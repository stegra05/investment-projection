/**
 * @file textConstants.js
 * @description Centralizes all static UI text strings used throughout the application.
 * This approach promotes consistency, simplifies maintenance, and aids potential
 * internationalization (i18n) efforts by providing a single source of truth for UI text.
 * Constants are grouped by their typical usage context (e.g., success messages, specific components).
 */

// --- General UI Text Constants ---
// These are common texts that might appear in various parts of the application.

// --- Success Messages ---
// Standard positive feedback messages displayed to the user upon successful completion of actions.
export const SUCCESS_ASSET_DELETED = 'Asset deleted successfully!';
export const SUCCESS_ASSET_UPDATED = 'Asset updated successfully!';
export const SUCCESS_PLANNED_CHANGE_SAVED = 'Planned change saved successfully!';
export const SUCCESS_PLANNED_CHANGE_DELETED = 'Planned change deleted successfully!';

// --- Confirmation Modal Texts ---
// Standard texts used within confirmation dialogs (modals) that prompt users before critical actions.
export const CONFIRM_DELETE_ASSET_TITLE = 'Confirm Deletion';
export const CONFIRM_DELETE_ASSET_BUTTON = 'Delete Asset'; // Text for the button that confirms deletion.
export const CONFIRM_DELETE_ASSET_MESSAGE = 'Are you sure you want to delete this asset? This action cannot be undone.';

// --- Loading / Fallback Messages ---
// Messages displayed during data loading states or as fallback error messages when specific error details are unavailable.
export const ERROR_ASSET_DELETE_FALLBACK = 'Failed to delete asset. Please try again.';
export const ERROR_PLANNED_CHANGE_SAVE_FALLBACK = 'Failed to save planned change. Please try again.';
export const ERROR_PLANNED_CHANGE_DELETE_FALLBACK = 'Failed to delete planned change. Please try again.';
/** Message shown when portfolio data is being fetched or no portfolio is currently selected to display. */
export const LOADING_PORTFOLIO_DATA = 'Loading portfolio data or portfolio not selected...';

// --- Common Labels & Headings ---
// Widely used labels and headings for UI elements.
export const HEADING_EXISTING_ASSETS = 'Existing Assets';

// --- MainContentPanel Specific Texts ---
// Texts primarily used within the MainContentPanel component and its sub-views.
export const HEADING_PORTFOLIO_OVERVIEW = 'Portfolio Overview';
export const PLACEHOLDER_PORTFOLIO_SUMMARY = 'Portfolio summary and key metrics will go here';
export const HEADING_RISK_ANALYSIS = 'Risk Analysis';
export const HEADING_PORTFOLIO_SETTINGS = 'Portfolio Settings'; // Also used in Overview & Settings view
export const PLACEHOLDER_PORTFOLIO_SETTINGS = 'Portfolio settings and configuration will go here';

/** Button text for navigating to the Assets view within a portfolio. */
export const BUTTON_ASSETS = 'Assets';
/** Button text for navigating to the Planned Changes view within a portfolio. */
export const BUTTON_PLANNED_CHANGES = 'Planned Changes';
/** Button text for navigating to the Overview & Settings view within a portfolio. */
export const BUTTON_OVERVIEW_SETTINGS = 'Overview & Settings';

/** Generic loading message for portfolio content sections. */
export const LOADING_PORTFOLIO_CONTENT = 'Loading portfolio content...';

// --- NavigationPanel Specific Texts ---
// Texts used in the NavigationPanel, primarily for listing portfolios.
export const HEADING_PORTFOLIOS = 'Portfolios';
export const LOADING_PORTFOLIOS_LIST = 'Loading portfolios...';
/** Prefix for error messages when loading the portfolio list. The specific error follows. */
export const ERROR_LOADING_PORTFOLIOS_LIST_PREFIX = 'Error loading portfolios:';
export const EMPTY_PORTFOLIOS_LIST = 'No portfolios found. Create one to get started!';
export const BUTTON_CREATE_NEW_PORTFOLIO = 'Create New Portfolio';

// --- AssetList & Asset Related Texts ---
// Texts used in components that display lists of assets or manage individual assets.
export const EMPTY_ASSETS_LIST = 'No assets added yet. Add one below.';
export const TABLE_HEADER_NAME_TICKER = 'Name / Ticker';
export const TABLE_HEADER_TYPE = 'Type';
export const TABLE_HEADER_ALLOCATION = 'Allocation';
export const TABLE_HEADER_ACTIONS = 'Actions';
/** Text for "Not Applicable" or "Not Available", often used in table cells. */
export const TEXT_NA = 'N/A';
/** ARIA label for the button/icon used to edit an asset. */
export const ARIA_LABEL_EDIT_ASSET = 'Edit asset';
/** ARIA label for the button/icon used to delete an asset. */
export const ARIA_LABEL_DELETE_ASSET = 'Delete asset';

// --- ProjectionPanel Specific Texts ---
// Texts used within the ProjectionPanel for setting up and displaying portfolio projections.
export const HEADING_PROJECTION_SETUP = 'Projection Setup';
export const STATUS_PROJECTION_PENDING = 'Preparing to start projection...';
export const STATUS_PROJECTION_SUBMITTED = 'Projection task submitted, waiting for processing...';
export const STATUS_PROJECTION_PROCESSING = 'Calculating projection...';
export const STATUS_PROJECTION_COMPLETED = 'Projection completed successfully!';
export const ERROR_PROJECTION_FALLBACK = 'An error occurred during projection.';
/** Message displayed on the chart area if projection data retrieval fails. */
export const CHART_EMPTY_FAILED = 'Failed to retrieve projection.';
/** Message displayed on the chart area if no projection has been run yet. */
export const CHART_EMPTY_PENDING_RUN = 'Run projection to see results';
export const BUTTON_RUN_PROJECTION = 'Run Projection';
export const BUTTON_PROCESSING_PROJECTION = 'Processing...'; // Button text while projection is running.

// --- PortfolioWorkspacePage Specific Texts ---
// Texts used within the main page/layout for a specific portfolio workspace.
export const BREADCRUMB_DASHBOARD = 'Dashboard'; // Breadcrumb link to the main dashboard.
/** Default prefix for portfolio breadcrumb, used while the portfolio name is loading. Full breadcrumb might be "Portfolio: My Portfolio Name". */
export const BREADCRUMB_PORTFOLIO_PREFIX = 'Portfolio';
export const INFO_PORTFOLIO_DATA_UNAVAILABLE = 'Portfolio data not available.';
export const INFO_LOADING_PORTFOLIO_DATA = 'Loading portfolio data...';

// --- Overview & Settings View - Application Settings Specific ---
// Texts related to the Application Settings section within the Overview & Settings view.
export const HEADING_APPLICATION_SETTINGS = 'Application Settings';
export const LABEL_DEFAULT_INFLATION_RATE = 'Default Annual Inflation Rate (%)';
/** Helper text explaining the purpose and usage of the default inflation rate setting. */
export const HELPER_TEXT_INFLATION_RATE = 'This rate will be used to adjust future values in projections for inflation, providing a \'real terms\' outlook. Enter as a percentage (e.g., 2.5). Leave blank or set to 0 to see nominal projections.';
export const TEXT_SAVING_SETTINGS = 'Saving...'; // Displayed when settings are being saved.
export const BUTTON_SAVE_SETTINGS = 'Save Settings';

// --- Overview & Settings View - Data Management Specific ---
// Texts related to the Data Management section (e.g., export data, delete account).
export const HEADING_DATA_MANAGEMENT = 'Data Management';
export const BUTTON_EXPORT_ALL_DATA = 'Export All Data';
export const BUTTON_DELETE_ACCOUNT = 'Delete Account';
export const MODAL_TITLE_DELETE_ACCOUNT = 'Confirm Account Deletion'; // Title for account deletion confirmation modal.
export const MODAL_MESSAGE_DELETE_ACCOUNT = 'Are you sure you want to permanently delete your account? All your data, including portfolios and settings, will be erased. This action cannot be undone.';
export const MODAL_CONFIRM_DELETE_ACCOUNT = 'Yes, Delete My Account'; // Confirm button text for account deletion.
export const MODAL_CANCEL_DELETE_ACCOUNT = 'Cancel'; // Cancel button text for account deletion.

// --- Overview & Settings View - Portfolio Summary Labels ---
// Labels for displaying portfolio details in a summary format.
export const LABEL_PORTFOLIO_ID = 'Portfolio ID';
export const LABEL_PORTFOLIO_NAME = 'Portfolio Name';
export const LABEL_PORTFOLIO_DESCRIPTION = 'Description';
export const LABEL_TOTAL_VALUE = 'Total Value';
export const LABEL_OVERALL_RISK_PROFILE = 'Overall Risk Profile';
export const LABEL_CREATED_ON = 'Created On';
export const LABEL_LAST_UPDATED = 'Last Updated';

// --- Overview & Settings View - Aria Labels for Edit Buttons ---
// Accessibility labels for inline edit buttons.
export const ARIA_LABEL_EDIT_PORTFOLIO_NAME = 'Edit portfolio name';
export const ARIA_LABEL_EDIT_PORTFOLIO_DESCRIPTION = 'Edit portfolio description';

// --- Overview & Settings View - Placeholders ---
// Placeholder texts for input fields in the portfolio settings section.
export const PLACEHOLDER_PORTFOLIO_DESCRIPTION = 'Add a description to help you remember this portfolio\'s purpose.';
export const PLACEHOLDER_PORTFOLIO_NAME = 'e.g., My Retirement Fund';

// --- Notification/Alert Messages (General) ---
// General templates or parts of messages for notifications.
/** Prefix for success message when a portfolio field is updated. The field name (e.g., "Name") is inserted by code. */
export const SUCCESS_PORTFOLIO_FIELD_UPDATED_PREFIX = '';
/** Suffix for success message when a portfolio field is updated. Example: "Name updated successfully." */
export const SUCCESS_PORTFOLIO_FIELD_UPDATED_SUFFIX = ' updated successfully.';
export const SUCCESS_APP_SETTINGS_SAVED = 'Application settings saved successfully.';

// --- Fallback Error Messages (General) ---
// Generic error messages for operations where specific details might not be available.
export const ERROR_PORTFOLIO_UPDATE_FAILED_FALLBACK = 'Failed to update portfolio. Please check your input and try again.';
export const ERROR_APP_SETTINGS_SAVE_FAILED_FALLBACK = 'Failed to save application settings. Please try again.';

// Add more constants as identified during development or refactoring.

// --- Recently Added or Context-Specific Constants ---
// These might be newer or very specific to a particular minor component or feature.
/** Title for the Portfolio Settings section, potentially within the Overview & Settings view. */
export const LABEL_PORTFOLIO_SETTINGS_TITLE = 'Portfolio Settings';
/** Button text for updating a portfolio's name. */
export const BUTTON_UPDATE_PORTFOLIO_NAME = 'Update Name';

// --- Assets View Specific Texts ---
// Texts used primarily within the dedicated Assets view of a portfolio.
/** Heading prefix for the assets list, e.g., "Assets for My Portfolio". Portfolio name is appended by code. */
export const HEADING_ASSETS_FOR_PORTFOLIO = 'Assets for';