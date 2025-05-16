import React from 'react';
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';
import Spinner from '../../../components/Spinner/Spinner';
import AlertMessage from '../../../components/AlertMessage/AlertMessage';
import useAppSettingsForm from '../hooks/useAppSettingsForm';
import useTheme from '../../../hooks/useTheme'; // Import useTheme hook
import {
  HEADING_APPLICATION_SETTINGS,
  LABEL_DEFAULT_INFLATION_RATE,
  HELPER_TEXT_INFLATION_RATE,
  BUTTON_SAVE_SETTINGS,
  TEXT_SAVING_SETTINGS,
} from '../../../constants/textConstants';

const ApplicationSettingsSection = () => {
  const {
    inflationInput,
    isSubmittingSettings,
    settingsNotification,
    isLoadingInitialSettings,
    isSettingsLoadingStore, // True during the save operation via store
    settingsErrorStore, // Error from the store
    handleInflationInputChange,
    handleSaveAppSettings,
  } = useAppSettingsForm();

  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`p-4 md:p-6 ${theme === 'high-contrast' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm rounded-lg border`}>
      <h2 className={`text-xl font-semibold ${theme === 'high-contrast' ? 'text-gray-100 border-gray-600' : 'text-gray-800 border-gray-300'} mb-4 border-b pb-2`}>
        {HEADING_APPLICATION_SETTINGS || 'Application Settings'}
      </h2>
      
      {isLoadingInitialSettings && (
        <div className="flex justify-center items-center h-20"><Spinner /></div>
      )}

      {!isLoadingInitialSettings && (
        <>
          {settingsNotification.message && (
            <div className="mb-4">
              <AlertMessage type={settingsNotification.type} message={settingsNotification.message} />
            </div>
          )}
          {/* Display error from store if no local notification is more specific and form isn't submitting */}
          {settingsErrorStore && !settingsNotification.message && !isSubmittingSettings && (
            <div className="mb-4">
              <AlertMessage type="error" message={settingsErrorStore} />
            </div>
          )}

          <div className="space-y-6">
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
                min="0"
                step="0.01"
                className="max-w-xs"
                disabled={isSubmittingSettings || isSettingsLoadingStore}
              />
            </div>
            <div>
              <Button 
                onClick={handleSaveAppSettings} 
                disabled={isSubmittingSettings || isSettingsLoadingStore || isLoadingInitialSettings}
                variant="primary"
              >
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
                <button
                  onClick={toggleTheme}
                  type="button"
                  className={`${ 
                    theme === 'high-contrast' ? 'bg-primary-600' : 'bg-gray-200'
                  } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                  role="switch"
                  aria-checked={theme === 'high-contrast'}
                  // Consider disabling while settings are saving if it shares any state, though unlikely here.
                  // disabled={isSubmittingSettings || isSettingsLoadingStore}
                >
                  <span className="sr-only">Use setting</span>
                  <span
                    aria-hidden="true"
                    className={`${ 
                      theme === 'high-contrast' ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                  />
                </button>
              </div>
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

export default ApplicationSettingsSection; 