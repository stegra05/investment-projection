import { useState, useEffect, useCallback } from 'react';
import useSettingsStore from '../../../store/settingsStore'; // Zustand store for global settings.
import useNotificationStore from '../../../store/notificationStore'; // Zustand store for global notifications.
import {
  SUCCESS_APP_SETTINGS_SAVED,
  ERROR_APP_SETTINGS_SAVE_FAILED_FALLBACK,
} from '../../../constants/textConstants'; // UI text constants.

/**
 * @hook useAppSettingsForm
 * @description A custom React hook to manage the state and logic for the application settings form,
 * primarily focusing on the default inflation rate setting. It handles fetching initial settings,
 * input changes, validation, submission, loading states, and notifications/error messages.
 * It interacts with `useSettingsStore` for persisting settings and `useNotificationStore`
 * for displaying global success messages.
 *
 * @returns {object} An object containing:
 *  - `inflationInput` (string): The current value of the inflation rate input field.
 *  - `isSubmittingSettings` (boolean): True if settings are currently being submitted/saved.
 *  - `settingsNotification` (object): An object `{ type: string, message: string }` for displaying local success/error messages related to settings submission.
 *  - `isLoadingInitialSettings` (boolean): True if the initial settings are being fetched.
 *  - `isSettingsLoadingStore` (boolean): Loading state specifically from `useSettingsStore` (e.g., during save operation).
 *  - `settingsErrorStore` (string|object|null): Error state from `useSettingsStore`.
 *  - `handleInflationInputChange` (Function): Callback to handle changes in the inflation rate input.
 *  - `handleSaveAppSettings` (Function): Async callback to handle the saving of application settings.
 */
const useAppSettingsForm = () => {
  // Destructure state and actions from the global settings store (Zustand).
  const {
    // `defaultInflationRate` is fetched initially but its editable state is managed by `inflationInput`.
    isLoading: isSettingsLoadingStore, // Renamed to avoid conflict with local loading state for initial fetch. True during store's save operation.
    error: settingsErrorStore,         // Error state from the settings store. Renamed for clarity.
    fetchSettings,                     // Action to fetch initial settings from the store/backend.
    updateDefaultInflationRate,        // Action to update the default inflation rate in the store/backend.
    clearError: clearSettingsErrorStore, // Action to clear errors in the settings store. Renamed for clarity.
  } = useSettingsStore();

  // Get the `addNotification` action directly from the notification store's state (as per Zustand's non-reactive API for actions).
  const addAppNotification = useNotificationStore.getState().addNotification;

  // Local state for the inflation rate input field.
  const [inflationInput, setInflationInput] = useState('');
  // Local state to manage loading status during the settings submission process initiated by this hook.
  const [isSubmittingSettings, setIsSubmittingSettings] = useState(false);
  // Local state for displaying success or error notifications specific to this form's actions.
  const [settingsNotification, setSettingsNotification] = useState({ type: '', message: '' });
  // Local state for managing loading status during the initial fetch of settings.
  const [isLoadingInitialSettings, setIsLoadingInitialSettings] = useState(true);

  // `useEffect` to fetch initial settings when the hook mounts or `fetchSettings` changes.
  useEffect(() => {
    setIsLoadingInitialSettings(true); // Indicate start of initial loading.
    fetchSettings()
      .then((fetchedRate) => {
        // If a rate is fetched, populate the input field.
        // `fetchedRate` might be the direct value from the store's async thunk.
        if (fetchedRate !== null && fetchedRate !== undefined) {
          setInflationInput(String(fetchedRate)); // Ensure it's a string for the input field.
        }
      })
      .finally(() => {
        setIsLoadingInitialSettings(false); // Indicate end of initial loading.
      });
  }, [fetchSettings]); // Dependency: re-run if `fetchSettings` function identity changes (should be stable).

  /**
   * Handles changes to the inflation rate input field.
   * Updates the local `inflationInput` state and clears any existing local notifications
   * or global errors from the settings store to provide immediate feedback.
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event.
   */
  const handleInflationInputChange = useCallback((e) => {
    setInflationInput(e.target.value);
    // Clear local form notifications and global store errors when user starts typing.
    if (settingsNotification.message) setSettingsNotification({ type: '', message: '' });
    if (settingsErrorStore) clearSettingsErrorStore();
  }, [settingsNotification.message, settingsErrorStore, clearSettingsErrorStore]); // Dependencies for useCallback.

  /**
   * Handles the submission/saving of application settings (currently default inflation rate).
   * It performs basic validation, calls the `updateDefaultInflationRate` store action,
   * and manages loading states and notifications.
   */
  const handleSaveAppSettings = useCallback(async () => {
    setIsSubmittingSettings(true); // Indicate start of submission.
    setSettingsNotification({ type: '', message: '' }); // Clear previous local notifications.
    if (settingsErrorStore) clearSettingsErrorStore(); // Clear any existing global store errors.

    try {
      // Convert input: empty string means null (no rate set), otherwise parse as float.
      const rateToSave = inflationInput.trim() === '' ? null : parseFloat(inflationInput);
      
      // Basic client-side validation for the inflation rate.
      if (inflationInput.trim() !== '' && (isNaN(rateToSave) || rateToSave < 0)) {
        throw new Error('Inflation rate must be a non-negative number.'); // This will be caught locally.
      }
      
      // Call the store action to update the setting.
      await updateDefaultInflationRate(rateToSave);
      // On successful update (if no error thrown by store action), show a global success notification.
      addAppNotification({ type: 'success', message: SUCCESS_APP_SETTINGS_SAVED });
      // Optionally, can also set a local success notification if needed for specific UI placement:
      // setSettingsNotification({ type: 'success', message: SUCCESS_APP_SETTINGS_SAVED });

    } catch (err) {
      // Handle errors from validation or the store action.
      console.error('Failed to save app settings:', err);
      // The error might be a local validation error (e.g., from `throw new Error` above)
      // or an error propagated from the `updateDefaultInflationRate` store action (which might set `settingsErrorStore`).
      setSettingsNotification({ 
        type: 'error', 
        // Prioritize local error message, then store error, then a generic fallback.
        message: err.message || settingsErrorStore || ERROR_APP_SETTINGS_SAVE_FAILED_FALLBACK, 
      });
    } finally {
      setIsSubmittingSettings(false); // Indicate end of submission process.
    }
  }, [inflationInput, addAppNotification, updateDefaultInflationRate, settingsErrorStore, clearSettingsErrorStore]); // Dependencies.

  // Return state values and handlers to be used by the consuming component.
  return {
    inflationInput,             // Value for the inflation rate input.
    isSubmittingSettings,       // True if save operation is in progress.
    settingsNotification,       // Local notification for success/error messages.
    isLoadingInitialSettings,   // True if initial settings are being fetched.
    isSettingsLoadingStore,     // Loading state from the settings store (e.g., during save).
    settingsErrorStore,         // Error state from the settings store.
    handleInflationInputChange, // Handler for input change.
    handleSaveAppSettings,      // Handler for saving settings.
    // Exposing setters can be useful if the component needs more direct control,
    // but generally, interactions should go through defined handlers.
    // setInflationInput, 
    // setSettingsNotification,
  };
};

export default useAppSettingsForm;