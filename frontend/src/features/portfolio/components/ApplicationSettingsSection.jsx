import React from 'react';
import Input from '../../../components/Input/Input.jsx';
import Button from '../../../components/Button/Button.jsx';
import Spinner from '../../../components/Spinner/Spinner.jsx'; // For loading states.
import AlertMessage from '../../../components/AlertMessage/AlertMessage.jsx'; // For notifications/errors.
import useAppSettingsForm from '../hooks/useAppSettingsForm'; // Custom hook for app settings form logic.
import useTheme from '../../../hooks/useTheme';  // Custom hook for theme management.
import {
  HEADING_APPLICATION_SETTINGS,
  LABEL_DEFAULT_INFLATION_RATE,
  HELPER_TEXT_INFLATION_RATE,
  BUTTON_SAVE_SETTINGS,
  TEXT_SAVING_SETTINGS,
} from '../../../constants/textConstants'; // UI text constants.

/**
 * @component ApplicationSettingsSection
 * @description A UI section component for managing global application settings.
 * Currently, it allows users to set a default annual inflation rate for projections
 * and toggle application appearance themes (e.g., high contrast mode).
 * It utilizes `useAppSettingsForm` hook to handle the inflation rate form's state,
 * validation, submission, and feedback (loading, success, error notifications).
 * It uses the `useTheme` hook to manage and toggle the application's visual theme.
 *
 * @example
 * // Typically used within a larger settings page or dashboard overview.
 * <ApplicationSettingsSection />
 *
 * @returns {JSX.Element} The rendered application settings section.
 */
const ApplicationSettingsSection = () => {
  // Destructure values and handlers from the useAppSettingsForm custom hook.
  const {
    inflationInput,            // Current value of the inflation rate input.
    isSubmittingSettings,      // True if inflation rate settings are being submitted.
    settingsNotification,      // Object { type, message } for success/error notifications from the hook.
    isLoadingInitialSettings,  // True if initial settings are being loaded.
    isSettingsLoadingStore,    // True if settings are being saved via the store (used for disabling inputs).
    settingsErrorStore,        // Error message from the settings store, if any.
    handleInflationInputChange, // Handler for changes to the inflation rate input.
    handleSaveAppSettings,     // Handler to save the application settings (inflation rate).
  } = useAppSettingsForm();

  // Destructure theme state and toggle function from the useTheme custom hook.
  const { theme, toggleTheme } = useTheme();

  return (
    // Main container for the section, with theme-dependent background and border.
    <div className={`p-4 md:p-6 ${theme === 'high-contrast' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm rounded-lg border`}>
      {/* Section Title */}
      <h2 className={`text-xl font-semibold ${theme === 'high-contrast' ? 'text-gray-100 border-gray-600' : 'text-gray-800 border-gray-300'} mb-4 border-b pb-2`}>
        {HEADING_APPLICATION_SETTINGS || 'Application Settings'}
      </h2>
      
      {/* Display a spinner if initial settings are being loaded. */}
      {isLoadingInitialSettings && (
        <div className="flex justify-center items-center h-20"><Spinner /></div>
      )}

      {/* Render form and settings content only if initial settings are not loading. */}
      {!isLoadingInitialSettings && (
        <>
          {/* Display notifications (success/error) from the app settings form hook. */}
          {settingsNotification.message && (
            <div className="mb-4">
              <AlertMessage type={settingsNotification.type} message={settingsNotification.message} />
            </div>
          )}
          {/* Display errors from the settings store if no local notification is active and not currently submitting. 
              This handles broader store-level errors that might not be caught by the form's local submission logic. */}
          {settingsErrorStore && !settingsNotification.message && !isSubmittingSettings && (
            <div className="mb-4">
              <AlertMessage type="error" message={settingsErrorStore} />
            </div>
          )}

          {/* Form content area */}
          <div className="space-y-6">
            {/* Default Inflation Rate Setting */}
            <div>
              <Input
                label={LABEL_DEFAULT_INFLATION_RATE || 'Default Annual Inflation Rate (%)'}
                id="defaultInflationRate"
                name="defaultInflationRate"
                type="number"
                value={inflationInput}
                onChange={handleInflationInputChange}
                placeholder="e.g., 2.5 for 2.5%"
                helperText={HELPER_TEXT_INFLATION_RATE || 'This rate will be used for real terms projections. Enter as a percentage (e.g., 2.5).'}
                min="0"    // Prevent negative inflation rates.
                step="0.01" // Allow for decimal percentages.
                className="max-w-xs" // Limit width for better layout.
                // Disable input if settings are being submitted or loaded from store.
                disabled={isSubmittingSettings || isSettingsLoadingStore}
              />
            </div>
            {/* Save Settings Button */}
            <div>
              <Button 
                onClick={handleSaveAppSettings} 
                // Disable button if submitting, loading from store, or initial settings are still loading.
                disabled={isSubmittingSettings || isSettingsLoadingStore || isLoadingInitialSettings}
                variant="primary"
              >
                {/* Conditional button text based on submission state. */}
                {isSubmittingSettings ? (TEXT_SAVING_SETTINGS || 'Saving...') : (BUTTON_SAVE_SETTINGS || 'Save Settings')}
              </Button>
            </div>

            {/* Theme Toggle Section */}
            <div className={`pt-4 ${theme === 'high-contrast' ? 'border-gray-700' : 'border-gray-200'} border-t`}>
              <h3 className={`text-lg font-semibold ${theme === 'high-contrast' ? 'text-gray-100' : 'text-gray-800'} mb-3`}>Appearance</h3>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${theme === 'high-contrast' ? 'text-gray-300' : 'text-gray-700'}`}>
                  High Contrast Mode
                </span>
                {/* Theme toggle switch button */}
                <button
                  onClick={toggleTheme} // Calls the theme toggle function from useTheme hook.
                  type="button"
                  // Dynamic classes for styling the switch based on current theme.
                  className={`${ 
                    theme === 'high-contrast' ? 'bg-primary-600' : 'bg-gray-200'
                  } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                  role="switch" // ARIA role for accessibility.
                  aria-checked={theme === 'high-contrast'} // ARIA state indicating if switch is "on".
                  // Could be disabled during settings save if theme state was part of the save, but it's separate here.
                  // disabled={isSubmittingSettings || isSettingsLoadingStore} 
                >
                  <span className="sr-only">Use setting</span> {/* Accessibility text for screen readers. */}
                  {/* The visual "knob" of the toggle switch. */}
                  <span
                    aria-hidden="true" // Decorative element.
                    // Dynamic class for positioning the knob based on theme state.
                    className={`${ 
                      theme === 'high-contrast' ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                  />
                </button>
              </div>
              {/* Conditional text indicating current theme state (if high contrast is on). */}
              {theme === 'high-contrast' && (
                <p className={`mt-2 text-xs ${theme === 'high-contrast' ? 'text-gray-400' : 'text-gray-500'}`}>
                  High contrast mode is enabled.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// This component primarily uses hooks for its data and actions, and does not receive direct props
// for its core functionality, so PropTypes are not defined here.

export default ApplicationSettingsSection;