import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // For slide-over animation.
import { FaTimes } from 'react-icons/fa'; // Close icon.
import { usePortfolio } from '../state/PortfolioContext'; // Context to access portfolio details (e.g., assets for reallocation).
import PropTypes from 'prop-types';
import RecurrenceSettingsForm from './RecurrenceSettingsForm.jsx'; // Sub-form for recurrence rules.
import TargetAllocationInput from './TargetAllocationInput.jsx'; // Sub-component for reallocation targets.
import { usePlannedChangeForm } from '../hooks/usePlannedChangeForm'; // Custom hook for managing form data and logic.
import Spinner from '../../../components/Spinner/Spinner.jsx'; // Loading spinner.
import AlertMessage from '../../../components/AlertMessage/AlertMessage.jsx'; // For displaying errors.
import { useChangePanelActions } from '../hooks/useChangePanelActions'; // Custom hook for submit/preview actions.
import Button from '../../../components/Button/Button.jsx';
import Input from '../../../components/Input/Input.jsx';
import Select from '../../../components/Select/Select.jsx';

/**
 * @constant CHANGE_TYPE_OPTIONS_FOR_SELECT
 * @description Options for the "Change Type" select dropdown in the form.
 * Each object has `value` (internal representation) and `label` (display text).
 */
const CHANGE_TYPE_OPTIONS_FOR_SELECT = [
  { value: 'Contribution', label: 'Contribution' },
  { value: 'Withdrawal', label: 'Withdrawal' },
  { value: 'Reallocation', label: 'Reallocation' },
];

/**
 * @component AddEditChangePanel
 * @description A slide-over panel component used for adding a new planned financial change
 * or editing an existing one for a portfolio. It includes fields for change type, date, amount
 * (for contributions/withdrawals), target allocations (for reallocations), description, and
 * detailed recurrence settings.
 * It utilizes custom hooks (`usePlannedChangeForm`, `useChangePanelActions`) to manage complex
 * form state, validation, and submission/preview logic.
 *
 * @example
 * <AddEditChangePanel
 *   isOpen={isPanelOpen}
 *   onClose={handleClosePanel}
 *   initialData={editingChangeData} // null for adding new, object for editing
 *   onSave={handleSaveChanges}
 *   onPreviewRequest={handlePreviewChange}
 * />
 *
 * @param {object} props - The component's props.
 * @param {boolean} props.isOpen - Controls the visibility of the slide-over panel. Required.
 * @param {Function} props.onClose - Callback function to close the panel. Required.
 * @param {object} [props.initialData=null] - Data for an existing planned change if editing.
 *                                            If null or undefined, the panel operates in "add new" mode.
 * @param {Function} props.onSave - Callback function invoked when the form is successfully submitted and saved.
 *                                  Receives the saved change data. Required.
 * @param {Function} props.onPreviewRequest - Callback function to request a preview of the change's impact.
 *                                            Receives the current form data. Required.
 *
 * @returns {JSX.Element|null} The rendered slide-over panel or null if `isOpen` is false.
 */
const AddEditChangePanel = ({ isOpen, onClose, initialData, onSave, onPreviewRequest }) => {
  // Access portfolio data (e.g., assets for reallocation) from context.
  const { portfolio } = usePortfolio();
  // Determine if the panel is in "edit" mode based on the presence of initialData.
  const isEditing = initialData != null;
  // Set the panel title dynamically based on whether adding or editing.
  const title = isEditing ? 'Edit Planned Change' : 'Add New Planned Change';

  // Ref for the first focusable field in the form for autofocus on panel open.
  const firstFieldRef = useRef(null);

  // Custom hook `usePlannedChangeForm`: manages the form's data structure,
  // including complex states like target allocations and recurrence rules.
  // It initializes with `initialData` if editing, or defaults for a new change.
  const {
    formData, // Object containing all form field values.
    targetAllocationsDisplay, // Data structure for displaying target allocations.
    allocationSum, // Sum of current target allocations (for validation).
    handleFormChange, // Generic handler for most form input changes.
    handleAllocationChange, // Specific handler for target allocation changes.
    handleRecurrenceDataChange, // Handler for changes within RecurrenceSettingsForm.
  } = usePlannedChangeForm(initialData, portfolio, isOpen);

  // Custom hook `useChangePanelActions`: manages submission and preview logic,
  // including loading states and error handling for these actions.
  const {
    handleSubmit, // Form submission handler (calls onSave).
    handlePreview, // Preview request handler (calls onPreviewRequest).
    isSubmitting, // True if the save operation is in progress.
    submitError, // Error message from the save operation.
    setSubmitError, // Function to set or clear the save error.
    isPreviewing, // True if the preview operation is in progress.
    previewError, // Error message from the preview operation.
    setPreviewError, // Function to set or clear the preview error.
  } = useChangePanelActions({
    formData,
    allocationSum,
    targetAllocationsDisplay,
    onSave, // Prop: callback for successful save.
    onPreviewRequest, // Prop: callback to request a preview.
    onClose, // Prop: callback to close the panel (e.g., after save).
  });

  // `useEffect` to clear errors and focus the first field when the panel opens or initialData changes.
  useEffect(() => {
    if (isOpen) {
      setSubmitError(null); // Clear any previous submission errors.
      setPreviewError(null); // Clear any previous preview errors.
      // Autofocus the first field (Change Type select) shortly after panel opens.
      // setTimeout ensures element is rendered and focusable.
      setTimeout(() => firstFieldRef.current?.focus(), 0);
    }
  }, [isOpen, initialData, setSubmitError, setPreviewError]); // Dependencies.

  // If formData is not yet initialized by the hook (e.g., on initial mount before effects run),
  // render nothing to prevent errors.
  if (!formData) {
    return null;
  }

  return (
    // AnimatePresence enables enter/exit animations when `isOpen` changes.
    <AnimatePresence>
      {isOpen && (
        // `motion.div` for the slide-over panel animation.
        <motion.div
          initial={{ x: '100%' }} // Starts off-screen to the right.
          animate={{ x: 0 }} // Slides in to x=0.
          exit={{ x: '100%' }} // Slides out to the right.
          transition={{ type: 'spring', stiffness: 300, damping: 30 }} // Animation physics.
          className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-50 flex flex-col"
          aria-labelledby="slide-over-title" // ARIA: Links panel to its title.
          role="dialog" // ARIA: Identifies as a dialog.
          aria-modal="true" // ARIA: Indicates it's a modal dialog.
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 id="slide-over-title" className="text-lg font-medium text-gray-900">
              {title} {/* Dynamic title: Add or Edit */}
            </h2>
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close panel" // Accessibility label.
            >
              <FaTimes className="h-6 w-6" /> {/* Close icon */}
            </button>
          </div>

          {/* Main Form: uses flex-col to allow scrolling content and fixed footer. */}
          <form id="addEditChangeForm" onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            {/* Scrollable content area for form fields. */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
              {/* Change Type Select Field */}
              <Select
                label="Change Type"
                id="changeType"
                name="changeType"
                value={formData.changeType}
                onChange={handleFormChange}
                options={CHANGE_TYPE_OPTIONS_FOR_SELECT}
                required
                ref={firstFieldRef} // Ref for autofocus.
              />

              {/* Date Input Field */}
              <Input
                label="Date"
                type="date"
                id="changeDate"
                name="changeDate"
                value={formData.changeDate}
                onChange={handleFormChange}
                required
              />

              {/* Amount Input Field: Conditional based on Change Type */}
              {(formData.changeType === 'Contribution' || formData.changeType === 'Withdrawal') && (
                <Input
                  label="Amount"
                  type="number"
                  id="changeAmount"
                  name="changeAmount"
                  value={formData.changeAmount}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g., 1000.00"
                  step="0.01" // Allows decimal input for currency.
                />
              )}

              {/* Target Allocation Input: Conditional for Reallocation Change Type */}
              {formData.changeType === 'Reallocation' && (
                <TargetAllocationInput
                  portfolioAssets={portfolio?.assets} // Pass current portfolio assets.
                  targetAllocationsDisplay={targetAllocationsDisplay} // Current allocations from form state.
                  allocationSum={allocationSum} // Sum of current allocations for validation display.
                  handleAllocationChange={handleAllocationChange} // Callback for allocation changes.
                />
              )}

              {/* Description Textarea Field */}
              <Input
                label="Description"
                type="textarea"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                rows={3}
                placeholder="Optional: e.g., Monthly savings contribution"
              />

              {/* Recurrence Settings Section */}
              <div className="pt-6 border-t border-gray-200 mt-6">
                <h3 className="text-md font-semibold text-gray-700 mb-2">Recurrence</h3>
                {/* Checkbox to enable/disable recurrence */}
                <div className="relative flex items-start mb-4">
                  <div className="flex items-center h-5">
                    <input
                      id="is_recurring"
                      name="is_recurring" // Matches formData key.
                      type="checkbox"
                      checked={formData.is_recurring}
                      onChange={handleFormChange} // Uses generic form change handler.
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="is_recurring" className="font-medium text-gray-700">
                      This is a recurring change
                    </label>
                  </div>
                </div>

                {/* Conditionally render RecurrenceSettingsForm if 'is_recurring' is true. */}
                {formData.is_recurring && (
                  <RecurrenceSettingsForm
                    // Pass relevant recurrence data from formData.
                    recurrenceData={{
                      frequency: formData.frequency,
                      interval: formData.interval,
                      days_of_week: formData.days_of_week,
                      day_of_month: formData.day_of_month,
                      monthly_type: formData.monthly_type,
                      month_ordinal: formData.month_ordinal,
                      month_ordinal_day: formData.month_ordinal_day,
                      month_of_year: formData.month_of_year,
                      ends_on_type: formData.ends_on_type,
                      ends_on_occurrences: formData.ends_on_occurrences,
                      ends_on_date: formData.ends_on_date,
                    }}
                    // Callback for changes within the recurrence form.
                    onRecurrenceDataChange={handleRecurrenceDataChange}
                  />
                )}
              </div>

              {/* Display Change ID if in editing mode and ID exists. */}
              {isEditing && formData.id && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-xs text-gray-500">Editing Change ID: {formData.id}</p>
                </div>
              )}
            </div>

            {/* Panel Footer: Contains action buttons and error messages. */}
            <div className="p-4 border-t border-gray-200 flex flex-col items-stretch bg-gray-50">
              {/* Display submission or preview errors if any. */}
              {(submitError || previewError) && (
                <AlertMessage 
                  type="error" 
                  title="Error:" 
                  message={submitError || previewError} // Show submit error first, then preview error.
                  className="mb-3"
                />
              )}
              {/* Action Buttons Container */}
              <div className="flex justify-end space-x-3">
                {/* Preview Impact Button */}
                <Button
                  type="button"
                  variant="tertiary"
                  size="default"
                  onClick={handlePreview}
                  // Disabled if submitting, previewing, or no portfolio ID (should not happen if panel is open for a portfolio).
                  disabled={isSubmitting || isPreviewing || !portfolio?.portfolio_id}
                >
                  {isPreviewing ? ( // Conditional content for loading state.
                    <>
                      <Spinner size="h-4 w-4" color="text-primary-700" className="mr-2" />
                      Loading Preview...
                    </>
                  ) : (
                    'Preview Impact'
                  )}
                </Button>
                {/* Cancel Button */}
                <Button
                  type="button"
                  variant="outline-select" // Using 'outline-select' for a less prominent cancel.
                  size="default"
                  onClick={onClose}
                  disabled={isSubmitting || isPreviewing} // Disabled during operations.
                >
                  Cancel
                </Button>
                {/* Submit (Add/Save) Button */}
                <Button
                  type="submit" // Triggers form's onSubmit.
                  variant="primary"
                  size="default"
                  form="addEditChangeForm" // Explicitly links to the form (though often not needed if inside form).
                  disabled={isSubmitting || isPreviewing || !portfolio?.portfolio_id}
                >
                  {isSubmitting ? ( // Conditional content for loading state.
                    <>
                      <Spinner size="h-4 w-4" color="text-white" className="mr-2" />
                      {isEditing ? 'Saving...' : 'Adding...'}
                    </>
                  ) : isEditing ? ( // Conditional text based on edit/add mode.
                    'Save Changes'
                  ) : (
                    'Add Change'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// PropTypes for type-checking and component documentation.
AddEditChangePanel.propTypes = {
  /** Controls whether the slide-over panel is visible. */
  isOpen: PropTypes.bool.isRequired,
  /** Callback function invoked when the user requests to close the panel (e.g., via close button or Escape key). */
  onClose: PropTypes.func.isRequired,
  /** 
   * Data for an existing planned change if the panel is in "edit" mode. 
   * If `null` or `undefined`, the panel operates in "add new" mode.
   */
  initialData: PropTypes.object,
  /** 
   * Callback function invoked when the form is successfully submitted and the change is saved.
   * Receives the saved change data as an argument.
   */
  onSave: PropTypes.func.isRequired,
  /** 
   * Callback function invoked when the user clicks the "Preview Impact" button.
   * Receives the current state of the form data for the planned change.
   */
  onPreviewRequest: PropTypes.func.isRequired,
};

export default AddEditChangePanel;
