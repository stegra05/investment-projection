import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import { usePortfolio } from '../state/PortfolioContext';
import PropTypes from 'prop-types';
import RecurrenceSettingsForm from './RecurrenceSettingsForm';
import TargetAllocationInput from './TargetAllocationInput';
import { usePlannedChangeForm } from '../hooks/usePlannedChangeForm';
import { prepareFinalPlannedChangeData } from '../utils/plannedChangeUtils';

const CHANGE_TYPE_OPTIONS = [
  { value: 'Contribution', label: 'Contribution' },
  { value: 'Withdrawal', label: 'Withdrawal' },
  { value: 'Reallocation', label: 'Reallocation' },
];

const AddEditChangePanel = ({ isOpen, onClose, initialData, onSave, onPreviewRequest }) => {
  const { portfolio } = usePortfolio();
  console.log('AddEditChangePanel (render): portfolio context:', portfolio);
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSubmitError(null);
      setPreviewError(null);
      setTimeout(() => firstFieldRef.current?.focus(), 0);
    }
  }, [isOpen, initialData]);

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitError(null);
    const { error, data: dataToSave } = prepareFinalPlannedChangeData(formData, allocationSum, targetAllocationsDisplay);

    if (error) {
      setSubmitError(error);
      return;
    }
    if (!dataToSave) return;

    setIsSubmitting(true);
    try {
      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error('Submission failed:', error);
      setSubmitError(error.message || 'Failed to save planned change. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = async () => {
    setPreviewError(null);
    const { error, data: dataForPreview } = prepareFinalPlannedChangeData(formData, allocationSum, targetAllocationsDisplay);

    if (error) {
      setPreviewError(error);
      return;
    }
    if (!dataForPreview) return;
    
    setIsPreviewing(true);
    try {
      await onPreviewRequest(dataForPreview);
    } catch (error) {
      console.error('Preview request failed:', error);
      setPreviewError(error.message || 'Failed to request preview. Please try again.');
    } finally {
      setIsPreviewing(false);
    }
  };

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
              <div>
                <label
                  htmlFor="changeType"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Change Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="changeType"
                  name="changeType"
                  value={formData.changeType}
                  onChange={handleFormChange}
                  required
                  ref={firstFieldRef}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
                >
                  {CHANGE_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="changeDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="changeDate"
                  name="changeDate"
                  value={formData.changeDate}
                  onChange={handleFormChange}
                  required
                  className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
                />
              </div>

              {(formData.changeType === 'Contribution' || formData.changeType === 'Withdrawal') && (
                <div>
                  <label
                    htmlFor="changeAmount"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="changeAmount"
                    name="changeAmount"
                    value={formData.changeAmount}
                    onChange={handleFormChange}
                    required
                    placeholder="e.g., 1000.00"
                    step="0.01"
                    className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
                  />
                </div>
              )}

              {formData.changeType === 'Reallocation' && (
                <TargetAllocationInput
                  portfolioAssets={portfolio?.assets}
                  targetAllocationsDisplay={targetAllocationsDisplay}
                  allocationSum={allocationSum}
                  handleAllocationChange={handleAllocationChange}
                />
              )}

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Optional: e.g., Monthly savings contribution"
                  className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
                />
              </div>

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
                <div className="mb-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
                  <p className="font-semibold">Error:</p>
                  <p>{submitError || previewError}</p>
                </div>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={isSubmitting || isPreviewing || !portfolio?.portfolio_id}
                  className="px-4 py-2 text-sm font-medium text-primary-700 bg-primary-100 border border-primary-300 rounded-md shadow-sm hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {isPreviewing ? 'Loading Preview...' : 'Preview Impact'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting || isPreviewing}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="addEditChangeForm"
                  disabled={isSubmitting || isPreviewing || !portfolio?.portfolio_id}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:bg-primary-400"
                >
                  {isSubmitting
                    ? isEditing
                      ? 'Saving...'
                      : 'Adding...'
                    : isEditing
                      ? 'Save Changes'
                      : 'Add Change'}
                </button>
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
