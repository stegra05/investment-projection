import { useState, useCallback } from 'react'; // Added useCallback
import { prepareFinalPlannedChangeData } from '../utils/plannedChangeUtils'; // Utility to process form data.

/**
 * @hook useChangePanelActions
 * @description A custom React hook that encapsulates the logic for handling primary actions
 * (submission/saving and requesting a preview) within a form or panel used for creating
 * or editing planned financial changes. It manages loading and error states for these actions
 * and uses a utility function (`prepareFinalPlannedChangeData`) to validate and structure
 * the form data before invoking parent-supplied callback functions.
 *
 * @param {object} params - Parameters for initializing the hook.
 * @param {object} params.formData - The current state of the form data, typically from `usePlannedChangeForm`.
 * @param {number} params.allocationSum - The sum of target allocations, used for validation by `prepareFinalPlannedChangeData`.
 * @param {Array<object>} params.targetAllocationsDisplay - The display-formatted target allocations, also for `prepareFinalPlannedChangeData`.
 * @param {Function} params.onSave - Async callback function to be invoked when the form is submitted with valid data.
 *                                   Receives the processed data to be saved.
 * @param {Function} params.onPreviewRequest - Async callback function to be invoked when a preview is requested.
 *                                             Receives the processed data for preview.
 * @param {Function} [params.onClose] - Optional callback function to close the panel/modal, typically called after a successful save.
 *
 * @returns {object} An object containing:
 *  - `handleSubmit` (Function): Async function to handle form submission.
 *  - `handlePreview` (Function): Async function to handle preview requests.
 *  - `isSubmitting` (boolean): True if the save operation is currently in progress.
 *  - `submitError` (string|null): Error message from the save operation, or null if no error.
 *  - `setSubmitError` (Function): Setter for `submitError`, allowing external clearing if needed.
 *  - `isPreviewing` (boolean): True if the preview operation is currently in progress.
 *  - `previewError` (string|null): Error message from the preview operation, or null if no error.
 *  - `setPreviewError` (Function): Setter for `previewError`, allowing external clearing.
 */
export const useChangePanelActions = ({
  formData,                 // Current form data from usePlannedChangeForm.
  allocationSum,            // Sum of allocations for validation.
  targetAllocationsDisplay, // Display data for allocations.
  onSave,                   // Callback to save the data.
  onPreviewRequest,         // Callback to request a preview.
  onClose,                  // Optional callback to close the panel/modal on success.
}) => {
  // State to manage loading status for the submission (save) action.
  const [isSubmitting, setIsSubmitting] = useState(false);
  // State to store any error message that occurs during submission.
  const [submitError, setSubmitError] = useState(null);
  // State to manage loading status for the preview action.
  const [isPreviewing, setIsPreviewing] = useState(false);
  // State to store any error message that occurs during preview generation.
  const [previewError, setPreviewError] = useState(null);

  /**
   * Handles the form submission process.
   * It prepares the data using `prepareFinalPlannedChangeData`, performs validation,
   * calls the `onSave` callback, and manages loading/error states.
   * @param {React.FormEvent<HTMLFormElement>} [event] - Optional form event (e.g., if called directly from form onSubmit).
   */
  const handleSubmit = useCallback(async (event) => {
    if (event) event.preventDefault(); // Prevent default form submission if event is provided.
    
    setSubmitError(null); // Clear any previous submission errors.

    // Prepare and validate the form data using a utility function.
    // This function might perform complex validation (e.g., ensuring allocation sum is 100%).
    const { error, data: dataToSave } = prepareFinalPlannedChangeData(
      formData, 
      allocationSum, 
      targetAllocationsDisplay
    );

    // If data preparation/validation fails, set the error and abort.
    if (error) {
      setSubmitError(error);
      return;
    }
    // Defensive check: ensure data is available after preparation (should be handled by prepareFinal... but good practice).
    if (!dataToSave) { 
      setSubmitError('No data available to save. Please check form inputs.');
      return;
    }

    setIsSubmitting(true); // Indicate start of submission process.
    try {
      await onSave(dataToSave); // Call the parent's onSave callback with the prepared data.
      if (onClose) onClose();   // If an onClose callback is provided, call it on successful save.
    } catch (err) { 
      // Handle errors from the onSave callback (e.g., API call failures).
      console.error('Submission failed in useChangePanelActions hook:', err);
      setSubmitError(err.message || 'Failed to save planned change. Please try again.'); // Display user-friendly error.
    } finally {
      setIsSubmitting(false); // Indicate end of submission process.
    }
  }, [formData, allocationSum, targetAllocationsDisplay, onSave, onClose]); // Dependencies for useCallback.

  /**
   * Handles the preview request process.
   * It prepares data similarly to handleSubmit and calls the `onPreviewRequest` callback.
   * Manages loading/error states specific to the preview action.
   */
  const handlePreview = useCallback(async () => {
    setPreviewError(null); // Clear previous preview errors.

    // Prepare and validate form data for preview.
    const { error, data: dataForPreview } = prepareFinalPlannedChangeData(
      formData, 
      allocationSum, 
      targetAllocationsDisplay
    );

    // If data preparation/validation fails, set error and abort.
    if (error) {
      setPreviewError(error);
      return;
    }
    // Defensive check for preview data.
    if (!dataForPreview) { 
      setPreviewError('No data available for preview. Please check form inputs.');
      return;
    }
    
    setIsPreviewing(true); // Indicate start of preview process.
    try {
      await onPreviewRequest(dataForPreview); // Call parent's onPreviewRequest callback.
    } catch (err) { 
      // Handle errors from the onPreviewRequest callback.
      console.error('Preview request failed in useChangePanelActions hook:', err);
      setPreviewError(err.message || 'Failed to request preview. Please try again.'); // Display user-friendly error.
    } finally {
      setIsPreviewing(false); // Indicate end of preview process.
    }
  }, [formData, allocationSum, targetAllocationsDisplay, onPreviewRequest]); // Dependencies.

  // Expose state values and handlers to the consuming component.
  // Setters for errors are exposed to allow the parent component to clear them if needed (e.g., on panel close).
  return {
    handleSubmit,       // Function to trigger submission.
    handlePreview,      // Function to trigger preview.
    isSubmitting,       // Boolean, true if submission is in progress.
    submitError,        // String or null, error message for submission.
    setSubmitError,     // Function to update submitError state.
    isPreviewing,       // Boolean, true if preview is in progress.
    previewError,       // String or null, error message for preview.
    setPreviewError,    // Function to update previewError state.
  };
};