import { useState, useEffect, useCallback } from 'react';
import useSettingsStore from '../../../store/settingsStore';
import useNotificationStore from '../../../store/notificationStore';
import {
  SUCCESS_APP_SETTINGS_SAVED,
  ERROR_APP_SETTINGS_SAVE_FAILED_FALLBACK,
} from '../../../constants/textConstants';

const useAppSettingsForm = () => {
  const {
    // defaultInflationRate, // Fetched initially but managed via inflationInput
    isLoading: isSettingsLoadingStore, // Renamed to avoid conflict with local loading
    error: settingsErrorStore, // Renamed
    fetchSettings,
    updateDefaultInflationRate,
    clearError: clearSettingsErrorStore, // Renamed
  } = useSettingsStore();

  const addAppNotification = useNotificationStore.getState().addNotification;

  const [inflationInput, setInflationInput] = useState('');
  const [isSubmittingSettings, setIsSubmittingSettings] = useState(false);
  const [settingsNotification, setSettingsNotification] = useState({ type: '', message: '' });
  // Local loading state for initial fetch, distinct from submission loading
  const [isLoadingInitialSettings, setIsLoadingInitialSettings] = useState(true);

  useEffect(() => {
    setIsLoadingInitialSettings(true);
    fetchSettings().then((fetchedRate) => {
      if (fetchedRate !== null && fetchedRate !== undefined) {
        setInflationInput(String(fetchedRate));
      }
    }).finally(() => {
      setIsLoadingInitialSettings(false);
    });
  }, [fetchSettings]);

  const handleInflationInputChange = useCallback((e) => {
    setInflationInput(e.target.value);
    // Clear notifications/errors immediately on input change
    if (settingsNotification.message) setSettingsNotification({ type: '', message: '' });
    if (settingsErrorStore) clearSettingsErrorStore();
  }, [settingsNotification.message, settingsErrorStore, clearSettingsErrorStore]);

  const handleSaveAppSettings = useCallback(async () => {
    setIsSubmittingSettings(true);
    setSettingsNotification({ type: '', message: '' });
    if (settingsErrorStore) clearSettingsErrorStore(); // Clear store error before new attempt

    try {
      const rateToSave = inflationInput.trim() === '' ? null : parseFloat(inflationInput);
      // Basic validation, can be expanded
      if (inflationInput.trim() !== '' && (isNaN(rateToSave) || rateToSave < 0)) {
        throw new Error('Inflation rate must be a non-negative number.');
      }
      await updateDefaultInflationRate(rateToSave);
      addAppNotification({ type: 'success', message: SUCCESS_APP_SETTINGS_SAVED });
    } catch (err) {
      console.error('Failed to save app settings:', err);
      // Error might be set in store by updateDefaultInflationRate if it throws an API error
      // Or it could be a local validation error like the one above.
      setSettingsNotification({ 
        type: 'error', 
        message: err.message || settingsErrorStore || ERROR_APP_SETTINGS_SAVE_FAILED_FALLBACK, 
      });
    } finally {
      setIsSubmittingSettings(false);
    }
  }, [inflationInput, addAppNotification, updateDefaultInflationRate, settingsErrorStore, clearSettingsErrorStore]);

  return {
    inflationInput,
    isSubmittingSettings,
    settingsNotification,
    isLoadingInitialSettings, // For showing spinner on initial load of settings
    isSettingsLoadingStore, // Loading state from the store (during save operation)
    settingsErrorStore, // Error state from the store
    handleInflationInputChange,
    handleSaveAppSettings,
    // Expose setInflationInput and setSettingsNotification if direct manipulation is needed from component
    // setInflationInput, 
    // setSettingsNotification,
  };
};

export default useAppSettingsForm; 