import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import { usePortfolio } from '../state/PortfolioContext';
import PropTypes from 'prop-types';
import RecurrenceSettingsForm from './RecurrenceSettingsForm';
import TargetAllocationInput from './TargetAllocationInput';
import { usePlannedChangeForm } from '../hooks/usePlannedChangeForm';
import Spinner from '../../../components/Spinner/Spinner';
import AlertMessage from '../../../components/AlertMessage/AlertMessage';
import { useChangePanelActions } from '../hooks/useChangePanelActions';
import Button from '../../../components/Button/Button';
import Input from '../../../components/Input/Input';
import Select from '../../../components/Select/Select';

const CHANGE_TYPE_OPTIONS_FOR_SELECT = [
  { value: 'Contribution', label: 'Contribution' },
  { value: 'Withdrawal', label: 'Withdrawal' },
  { value: 'Reallocation', label: 'Reallocation' },
];

const AddEditChangePanel = ({ isOpen, onClose, initialData, onSave, onPreviewRequest }) => {
  const { portfolio } = usePortfolio();
  const isEditing = initialData != null;
  const title = isEditing ? 'Edit Planned Change' : 'Add New Planned Change';

  const firstFieldRef = useRef(null);

  const {
    formData,
    targetAllocationsDisplay,
    allocationSum,
    handleFormChange,
    handleAllocationChange,
    handleRecurrenceDataChange,
  } = usePlannedChangeForm(initialData, portfolio, isOpen);

  const {
    handleSubmit,
    handlePreview,
    isSubmitting,
    submitError,
    setSubmitError,
    isPreviewing,
    previewError,
    setPreviewError,
  } = useChangePanelActions({
    formData,
    allocationSum,
    targetAllocationsDisplay,
    onSave,
    onPreviewRequest,
    onClose,
  });

  useEffect(() => {
    if (isOpen) {
      setSubmitError(null);
      setPreviewError(null);
      setTimeout(() => firstFieldRef.current?.focus(), 0);
    }
  }, [isOpen, initialData, setSubmitError, setPreviewError]);

  if (!formData) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-50 flex flex-col"
          aria-labelledby="slide-over-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 id="slide-over-title" className="text-lg font-medium text-gray-900">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close panel"
            >
              <FaTimes className="h-6 w-6" />
            </button>
          </div>

          <form id="addEditChangeForm" onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
              <Select
                label="Change Type"
                id="changeType"
                name="changeType"
                value={formData.changeType}
                onChange={handleFormChange}
                options={CHANGE_TYPE_OPTIONS_FOR_SELECT}
                required
                ref={firstFieldRef}
              />

              <Input
                label="Date"
                type="date"
                id="changeDate"
                name="changeDate"
                value={formData.changeDate}
                onChange={handleFormChange}
                required
              />

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
                  step="0.01"
                />
              )}

              {formData.changeType === 'Reallocation' && (
                <TargetAllocationInput
                  portfolioAssets={portfolio?.assets}
                  targetAllocationsDisplay={targetAllocationsDisplay}
                  allocationSum={allocationSum}
                  handleAllocationChange={handleAllocationChange}
                />
              )}

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

              <div className="pt-6 border-t border-gray-200 mt-6">
                <h3 className="text-md font-semibold text-gray-700 mb-2">Recurrence</h3>
                <div className="relative flex items-start mb-4">
                  <div className="flex items-center h-5">
                    <input
                      id="is_recurring"
                      name="is_recurring"
                      type="checkbox"
                      checked={formData.is_recurring}
                      onChange={handleFormChange}
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="is_recurring" className="font-medium text-gray-700">
                      This is a recurring change
                    </label>
                  </div>
                </div>

                {formData.is_recurring && (
                  <RecurrenceSettingsForm
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
                    onRecurrenceDataChange={handleRecurrenceDataChange}
                  />
                )}
              </div>

              {isEditing && formData.id && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-xs text-gray-500">Editing Change ID: {formData.id}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 flex flex-col items-stretch bg-gray-50">
              {(submitError || previewError) && (
                <AlertMessage 
                  type="error" 
                  title="Error:" 
                  message={submitError || previewError} 
                  className="mb-3"
                />
              )}
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="tertiary"
                  size="default"
                  onClick={handlePreview}
                  disabled={isSubmitting || isPreviewing || !portfolio?.portfolio_id}
                >
                  {isPreviewing ? (
                    <>
                      <Spinner size="h-4 w-4" color="text-primary-700" className="mr-2" />
                      Loading Preview...
                    </>
                  ) : (
                    'Preview Impact'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline-select"
                  size="default"
                  onClick={onClose}
                  disabled={isSubmitting || isPreviewing}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="default"
                  form="addEditChangeForm"
                  disabled={isSubmitting || isPreviewing || !portfolio?.portfolio_id}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner size="h-4 w-4" color="text-white" className="mr-2" />
                      {isEditing ? 'Saving...' : 'Adding...'}
                    </>
                  ) : isEditing ? (
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

AddEditChangePanel.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  onPreviewRequest: PropTypes.func.isRequired,
};

export default AddEditChangePanel;
