import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import { XMarkIcon } from '@heroicons/react/24/outline'; // Keep this commented for now
// import { ArrowLeftIcon } from '@heroicons/react/24/outline'; // Keep this commented for now
import { FaTimes } from 'react-icons/fa'; // Import an icon from react-icons
import { usePortfolio } from '../state/PortfolioContext'; // For accessing portfolio assets AND ID
import PropTypes from 'prop-types';

// Define change type options locally for now, ideally this would come from a shared source
const CHANGE_TYPE_OPTIONS = [
  { value: 'Contribution', label: 'Contribution' },
  { value: 'Withdrawal', label: 'Withdrawal' },
  { value: 'Reallocation', label: 'Reallocation' },
  // Add other types as defined in backend enums (e.g., FEE, INTEREST) if applicable
];

// Constants for Recurrence
const FREQUENCY_OPTIONS = [
  { value: 'ONE_TIME', label: 'One-Time (No Recurrence)' }, // Technically not a frequency, but fits here
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
];

const DAYS_OF_WEEK_OPTIONS = [
  { value: 0, label: 'Mon' },
  { value: 1, label: 'Tue' },
  { value: 2, label: 'Wed' },
  { value: 3, label: 'Thu' },
  { value: 4, label: 'Fri' },
  { value: 5, label: 'Sat' },
  { value: 6, label: 'Sun' },
];

const MONTH_ORDINAL_OPTIONS = [
  { value: 'FIRST', label: 'First' },
  { value: 'SECOND', label: 'Second' },
  { value: 'THIRD', label: 'Third' },
  { value: 'FOURTH', label: 'Fourth' },
  { value: 'LAST', label: 'Last' },
];

const ORDINAL_DAY_TYPE_OPTIONS = [
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
  { value: 'SATURDAY', label: 'Saturday' },
  { value: 'SUNDAY', label: 'Sunday' },
  { value: 'DAY', label: 'Day' },
  { value: 'WEEKDAY', label: 'Weekday' },
  { value: 'WEEKEND_DAY', label: 'Weekend Day' },
];

const MONTH_OF_YEAR_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const ENDS_ON_TYPE_OPTIONS = [
  { value: 'NEVER', label: 'Never' },
  { value: 'AFTER_OCCURRENCES', label: 'After a number of occurrences' },
  { value: 'ON_DATE', label: 'On a specific date' },
];

const getInitialFormState = (initialData = null) => {
  const changeType = initialData?.changeType || 'Contribution';
  const isRecurring = initialData?.isRecurring || false;
  const changeDate = initialData?.changeDate
    ? new Date(initialData.changeDate).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  return {
    id: initialData?.id || null,
    changeType: changeType,
    changeDate: changeDate,
    changeAmount:
      initialData?.amount === null ||
      initialData?.amount === undefined ||
      changeType === 'Reallocation' 
        ? ''
        : String(initialData.amount),
    description: initialData?.description || '',
    targetAllocations: initialData?.targetAllocationJson
      ? JSON.parse(initialData.targetAllocationJson)
      : [],
    is_recurring: isRecurring,
    frequency: isRecurring ? initialData?.frequency || 'DAILY' : 'ONE_TIME',
    interval: initialData?.interval || 1,
    days_of_week: initialData?.daysOfWeek
      ? typeof initialData.daysOfWeek === 'string'
        ? JSON.parse(initialData.daysOfWeek)
        : initialData.daysOfWeek
      : [],
    day_of_month: initialData?.dayOfMonth || '',
    monthly_type: initialData?.monthOrdinal ? 'ordinal_day' : 'specific_day',
    month_ordinal: initialData?.monthOrdinal || '',
    month_ordinal_day: initialData?.monthOrdinalDay || '',
    month_of_year: initialData?.monthOfYear || '',
    ends_on_type: initialData?.endsOnType || 'NEVER',
    ends_on_occurrences: initialData?.endsOnOccurrences || '',
    ends_on_date: initialData?.endsOnDate
      ? new Date(initialData.endsOnDate).toISOString().split('T')[0]
      : '',
  };
};

const AddEditChangePanel = ({ isOpen, onClose, initialData, onSave, onPreviewRequest }) => {
  const { portfolio } = usePortfolio(); // Get portfolio for assets AND ID
  console.log('AddEditChangePanel (render): portfolio context:', portfolio); // Diagnostic log
  const isEditing = initialData != null;
  const title = isEditing ? 'Edit Planned Change' : 'Add New Planned Change';

  const [formData, setFormData] = useState(getInitialFormState(initialData));
  const [targetAllocationsDisplay, setTargetAllocationsDisplay] = useState([]);
  const [allocationSum, setAllocationSum] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // New state for preview action
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  useEffect(() => {
    // console.log('[EFFECT RUNS] AddEditChangePanel effect triggered. isOpen:', isOpen, 'initialData:', initialData, 'portfolio ID:', portfolio?.portfolio_id);

    if (isOpen) {
      console.log('[EDIT PANEL OPENING] AddEditChangePanel effect - isOpen=true. initialData (raw):', initialData);
      console.log('[EDIT PANEL OPENING] AddEditChangePanel effect - isOpen=true. initialData (JSON):', JSON.stringify(initialData, null, 2));

      const freshFormState = getInitialFormState(initialData);
      setFormData(freshFormState);
      setSubmitError(null); // Clear previous errors when panel opens/data changes
      setPreviewError(null); // Clear preview error when panel opens/data changes
      if (freshFormState.changeType === 'Reallocation' && portfolio?.assets) {
        const initialAllocations = portfolio.assets.map(asset => {
          const existingAllocation = freshFormState.targetAllocations.find(
            a => a.assetId === asset.id
          );
          return {
            assetId: asset.id,
            assetName: asset.name,
            newPercentage: existingAllocation ? String(existingAllocation.percentage) : '',
          };
        });
        setTargetAllocationsDisplay(initialAllocations);
        const sum = initialAllocations.reduce(
          (acc, curr) => acc + (parseFloat(curr.newPercentage) || 0),
          0
        );
        setAllocationSum(sum);
      } else {
        setTargetAllocationsDisplay([]);
        setAllocationSum(0);
      }
    } else {
      setTargetAllocationsDisplay([]);
      setAllocationSum(0);
    }
  }, [isOpen, initialData, portfolio]);

  const handleFormChange = e => {
    const { name, value, type, checked } = e.target;
    let newFormData = { ...formData };

    if (name === 'is_recurring') {
      newFormData.is_recurring = checked;
      if (!checked) {
        newFormData.frequency = 'ONE_TIME';
      } else {
        if (newFormData.frequency === 'ONE_TIME') {
          newFormData.frequency = 'DAILY';
        }
      }
    } else if (name === 'frequency') {
      newFormData.frequency = value;
      if (value === 'ONE_TIME') {
        newFormData.is_recurring = false;
      } else {
        newFormData.is_recurring = true;
      }
      newFormData.days_of_week = [];
      newFormData.day_of_month = '';
      newFormData.monthly_type = 'specific_day';
      newFormData.month_ordinal = '';
      newFormData.month_ordinal_day = '';
    } else if (name.startsWith('dow-')) {
      const dayValue = parseInt(value, 10);
      const currentDays = newFormData.days_of_week || [];
      if (checked) {
        if (!currentDays.includes(dayValue)) {
          newFormData.days_of_week = [...currentDays, dayValue].sort((a, b) => a - b);
        }
      } else {
        newFormData.days_of_week = currentDays.filter(day => day !== dayValue);
      }
    } else if (name === 'monthly_type') {
      newFormData.monthly_type = value;
      if (value === 'specific_day') {
        newFormData.month_ordinal = '';
        newFormData.month_ordinal_day = '';
      } else if (value === 'ordinal_day') {
        newFormData.day_of_month = '';
      }
    } else {
      newFormData[name] = type === 'checkbox' ? checked : value;
    }

    if (name === 'changeType') {
      if (value === 'Reallocation') {
        newFormData.changeAmount = '';
        if (portfolio?.assets) {
          const initialAllocs = portfolio.assets.map(asset => ({
            assetId: asset.id,
            assetName: asset.name,
            newPercentage: '',
          }));
          setTargetAllocationsDisplay(initialAllocs);
          setAllocationSum(0);
        }
      } else {
        setTargetAllocationsDisplay([]);
        setAllocationSum(0);
      }
    }
    setFormData(newFormData);
  };

  const handleAllocationChange = (assetId, newPercentageStr) => {
    const newAllocations = targetAllocationsDisplay.map(alloc =>
      alloc.assetId === assetId ? { ...alloc, newPercentage: newPercentageStr } : alloc
    );
    setTargetAllocationsDisplay(newAllocations);
    const sum = newAllocations.reduce(
      (acc, curr) => acc + (parseFloat(curr.newPercentage) || 0),
      0
    );
    setAllocationSum(sum);
  };

  const prepareFinalData = (forPreview = false) => {
    let finalData = { ...formData };
    let currentError = null;

    // Clear previous errors specific to the action type
    if (forPreview) setPreviewError(null);
    else setSubmitError(null);

    // Reallocation validation
    if (finalData.changeType === 'Reallocation') {
      if (allocationSum !== 100) {
        currentError = 'Total allocation must be 100%.';
      } else {
        const target_allocation_json = JSON.stringify(
          targetAllocationsDisplay.map(a => ({
            assetId: a.assetId,
            percentage: parseFloat(a.newPercentage) || 0,
          }))
        );
        finalData = { ...finalData, target_allocation_json, amount: null };
      }
    } else {
      finalData.target_allocation_json = null;
      const amountValue = parseFloat(finalData.changeAmount);
      if (finalData.changeType === 'Contribution' || finalData.changeType === 'Withdrawal') {
        if (isNaN(amountValue) || finalData.changeAmount === '') {
          // Amount is required for these types
          currentError = 'Amount must be a valid number for contributions or withdrawals.';
        }
        finalData.amount = finalData.changeAmount === '' ? null : amountValue;
      } else {
        // For other types (if any) that don't strictly need an amount, but might have one
        finalData.amount =
          finalData.changeAmount === '' ? null : isNaN(amountValue) ? null : amountValue;
      }
    }
    delete finalData.targetAllocations;

    if (currentError) {
      if (forPreview) setPreviewError(currentError);
      else setSubmitError(currentError);
      return null;
    }

    // Recurrence data preparation & validation
    if (!finalData.is_recurring || finalData.frequency === 'ONE_TIME') {
      // ... (set to non-recurring defaults as in previous handleSubmit)
      finalData.is_recurring = false;
      finalData.frequency = 'ONE_TIME';
      finalData.interval = 1;
      finalData.days_of_week = [];
      finalData.day_of_month = null;
      finalData.month_ordinal = null;
      finalData.month_ordinal_day = null;
      finalData.month_of_year = null;
      finalData.ends_on_type = 'NEVER';
      finalData.ends_on_occurrences = null;
      finalData.ends_on_date = null;
    } else {
      finalData.interval = parseInt(finalData.interval, 10) || 1;
      if (finalData.interval < 1) {
        currentError = 'Interval must be at least 1.';
      }

      if (
        finalData.frequency === 'WEEKLY' &&
        (!finalData.days_of_week || finalData.days_of_week.length === 0)
      ) {
        currentError = 'Please select at least one day for weekly recurrence.';
      }
      // ... (other recurrence validations as in previous handleSubmit, setting currentError)
      finalData.day_of_month =
        finalData.frequency === 'MONTHLY' &&
        finalData.monthly_type === 'specific_day' &&
        finalData.day_of_month
          ? parseInt(finalData.day_of_month, 10)
          : null;
      finalData.month_of_year =
        finalData.frequency === 'YEARLY' && finalData.month_of_year
          ? parseInt(finalData.month_of_year, 10)
          : null;
      finalData.ends_on_occurrences =
        finalData.ends_on_type === 'AFTER_OCCURRENCES' && finalData.ends_on_occurrences
          ? parseInt(finalData.ends_on_occurrences, 10)
          : null;

      if (finalData.frequency !== 'WEEKLY') finalData.days_of_week = [];
      // ... (rest of nulling out irrelevant fields based on frequency and monthly_type) ...
      if (finalData.frequency === 'MONTHLY') {
        if (finalData.monthly_type === 'specific_day' && !finalData.day_of_month) {
          currentError = 'Please specify the day of the month for monthly recurrence.';
        } else if (
          finalData.monthly_type === 'specific_day' &&
          (parseInt(finalData.day_of_month, 10) < 1 || parseInt(finalData.day_of_month, 10) > 31)
        ) {
          currentError = 'Day of month must be between 1 and 31.';
        } else if (
          finalData.monthly_type === 'ordinal_day' &&
          (!finalData.month_ordinal || !finalData.month_ordinal_day)
        ) {
          currentError = 'Please specify ordinal and day type for monthly recurrence.';
        }
        if (finalData.monthly_type === 'specific_day') {
          finalData.month_ordinal = null;
          finalData.month_ordinal_day = null;
        } else {
          finalData.day_of_month = null;
        }
      }
      if (finalData.frequency === 'YEARLY') {
        if (!finalData.month_of_year) {
          currentError = 'Please specify the month for yearly recurrence.';
        } else if (finalData.monthly_type === 'specific_day' && !finalData.day_of_month) {
          currentError = 'Please specify the day of the month for yearly recurrence.';
        } else if (
          finalData.monthly_type === 'specific_day' &&
          (parseInt(finalData.day_of_month, 10) < 1 || parseInt(finalData.day_of_month, 10) > 31)
        ) {
          currentError = 'Day of month must be between 1 and 31 for yearly recurrence.';
        } else if (
          finalData.monthly_type === 'ordinal_day' &&
          (!finalData.month_ordinal || !finalData.month_ordinal_day)
        ) {
          currentError = 'Please specify ordinal and day type for yearly recurrence.';
        }
      }
      if (finalData.frequency !== 'YEARLY') finalData.month_of_year = null;

      if (finalData.ends_on_type === 'AFTER_OCCURRENCES') {
        if (!finalData.ends_on_occurrences || parseInt(finalData.ends_on_occurrences, 10) < 1) {
          currentError = 'Please specify a valid number of occurrences (at least 1).';
        } else {
          finalData.ends_on_date = null;
        }
      } else if (finalData.ends_on_type === 'ON_DATE') {
        if (!finalData.ends_on_date) {
          currentError = 'Please specify an end date.';
        } else {
          finalData.ends_on_occurrences = null;
        }
      } else {
        // NEVER
        finalData.ends_on_occurrences = null;
        finalData.ends_on_date = null;
      }
    }
    delete finalData.monthly_type;

    if (currentError) {
      if (forPreview) setPreviewError(currentError);
      else setSubmitError(currentError);
      return null;
    }
    return finalData;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const dataToSave = prepareFinalData(false);
    if (!dataToSave) return; // Validation error occurred

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
    const dataForPreview = prepareFinalData(true);
    if (!dataForPreview) return; // Validation error occurred

    setIsPreviewing(true);
    setPreviewError(null);
    try {
      await onPreviewRequest(dataForPreview); // Call the prop passed from ChangesView
      // Optionally, show a success message for preview request if needed, e.g., using a temporary state
      // For now, successful request means data is in context for ProjectionPanel to pick up.
    } catch (error) {
      console.error('Preview request failed:', error);
      setPreviewError(error.message || 'Failed to request preview. Please try again.');
    } finally {
      setIsPreviewing(false);
    }
  };

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
              {/* <XMarkIcon className="h-6 w-6" /> */}
              {/* <ArrowLeftIcon className="h-6 w-6" /> */}
              <FaTimes className="h-6 w-6" /> {/* Use the react-icons icon */}
              {/* Close */}
            </button>
          </div>

          <form id="addEditChangeForm" onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
              {/* Change Type */}
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
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
                >
                  {CHANGE_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Change Date */}
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

              {/* Change Amount - Conditional display handled here */}
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

              {/* Reallocation Section - Conditional display */}
              {formData.changeType === 'Reallocation' && (
                <div className="space-y-4 p-4 border border-gray-200 rounded-md bg-gray-50">
                  <h3 className="text-md font-semibold text-gray-700">Target Allocations</h3>
                  {!portfolio?.assets || portfolio.assets.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No assets available in the portfolio to reallocate.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                      {targetAllocationsDisplay.map(allocItem => (
                        <div
                          key={allocItem.assetId}
                          className="grid grid-cols-3 gap-x-3 items-center"
                        >
                          <label
                            htmlFor={`asset-${allocItem.assetId}-perc`}
                            className="col-span-2 text-sm text-gray-600 truncate"
                            title={allocItem.assetName}
                          >
                            {allocItem.assetName}
                          </label>
                          <div className="relative col-span-1">
                            <input
                              type="number"
                              id={`asset-${allocItem.assetId}-perc`}
                              name={`alloc-${allocItem.assetId}`}
                              value={allocItem.newPercentage}
                              onChange={e =>
                                handleAllocationChange(allocItem.assetId, e.target.value)
                              }
                              placeholder="%"
                              min="0"
                              max="100"
                              step="0.01"
                              className="mt-1 block w-full pl-3 pr-7 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm text-right"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                    <p className="text-sm font-medium text-gray-800">Total:</p>
                    <p
                      className={`text-sm font-semibold ${allocationSum === 100 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {allocationSum.toFixed(2)}%
                    </p>
                  </div>
                  {allocationSum !== 100 && (
                    <p className="text-xs text-red-500">Total allocation must sum to 100%.</p>
                  )}
                </div>
              )}

              {/* Description */}
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

              {/* Recurrence Toggle and Options Section */}
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
                  <div className="p-4 border border-gray-200 rounded-md bg-gray-50 space-y-4">
                    {/* Frequency Dropdown */}
                    <div>
                      <label
                        htmlFor="frequency"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Frequency
                      </label>
                      <select
                        id="frequency"
                        name="frequency"
                        value={formData.frequency}
                        onChange={handleFormChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
                      >
                        {FREQUENCY_OPTIONS.filter(opt => opt.value !== 'ONE_TIME').map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Interval Input (shown if frequency is not ONE_TIME) */}
                    {formData.frequency !== 'ONE_TIME' && (
                      <div>
                        <label
                          htmlFor="interval"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Repeat every{' '}
                          <input
                            type="number"
                            id="interval"
                            name="interval"
                            value={formData.interval}
                            onChange={handleFormChange}
                            min="1"
                            className="mx-1 w-16 text-center border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
                          />{' '}
                          {formData.frequency.toLowerCase().replace(/ly$/, '').replace(/li$/, 's')}
                          (s)
                        </label>
                      </div>
                    )}

                    {/* Weekly Specific: Days of Week Checkboxes */}
                    {formData.frequency === 'WEEKLY' && (
                      <div className="space-y-2">
                        <p className="block text-sm font-medium text-gray-700">Repeat on</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                          {DAYS_OF_WEEK_OPTIONS.map(day => (
                            <div key={day.value} className="relative flex items-start">
                              <div className="flex items-center h-5">
                                <input
                                  id={`dow-${day.value}`}
                                  name={`dow-${day.value}`}
                                  type="checkbox"
                                  value={day.value}
                                  checked={formData.days_of_week.includes(day.value)}
                                  onChange={handleFormChange}
                                  className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                                />
                              </div>
                              <div className="ml-2 text-sm">
                                <label
                                  htmlFor={`dow-${day.value}`}
                                  className="font-medium text-gray-700"
                                >
                                  {day.label}
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                        {formData.days_of_week.length === 0 && (
                          <p className="text-xs text-red-500">Please select at least one day.</p>
                        )}
                      </div>
                    )}

                    {/* Yearly Specific: Month of Year (before Monthly options if also used by Yearly) */}
                    {formData.frequency === 'YEARLY' && (
                      <div>
                        <label
                          htmlFor="month_of_year"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          In
                        </label>
                        <select
                          id="month_of_year"
                          name="month_of_year"
                          value={formData.month_of_year}
                          onChange={handleFormChange}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
                        >
                          <option value="">Select Month</option>
                          {MONTH_OF_YEAR_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Monthly (or Yearly day selection) Specific */}
                    {(formData.frequency === 'MONTHLY' || formData.frequency === 'YEARLY') && (
                      <div className="space-y-3 pt-2 border-t border-gray-100 mt-3">
                        <p className="block text-sm font-medium text-gray-700 mb-1">On</p>
                        <div className="space-y-2">
                          {/* Radio to choose specific day or ordinal day */}
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="monthly_specific_day"
                              name="monthly_type"
                              value="specific_day"
                              checked={formData.monthly_type === 'specific_day'}
                              onChange={handleFormChange}
                              className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                            />
                            <label
                              htmlFor="monthly_specific_day"
                              className="ml-2 text-sm font-medium text-gray-700"
                            >
                              Day of the month
                            </label>
                          </div>
                          {formData.monthly_type === 'specific_day' && (
                            <input
                              type="number"
                              id="day_of_month"
                              name="day_of_month"
                              value={formData.day_of_month}
                              onChange={handleFormChange}
                              placeholder="e.g., 15"
                              min="1"
                              max="31"
                              className="ml-6 mt-1 block w-1/2 pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
                            />
                          )}

                          <div className="flex items-center mt-2">
                            <input
                              type="radio"
                              id="monthly_ordinal_day"
                              name="monthly_type"
                              value="ordinal_day"
                              checked={formData.monthly_type === 'ordinal_day'}
                              onChange={handleFormChange}
                              className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                            />
                            <label
                              htmlFor="monthly_ordinal_day"
                              className="ml-2 text-sm font-medium text-gray-700"
                            >
                              The
                            </label>
                          </div>
                          {formData.monthly_type === 'ordinal_day' && (
                            <div className="ml-6 mt-1 grid grid-cols-2 gap-x-2">
                              <select
                                id="month_ordinal"
                                name="month_ordinal"
                                value={formData.month_ordinal}
                                onChange={handleFormChange}
                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
                              >
                                <option value="">Select Ordinal</option>
                                {MONTH_ORDINAL_OPTIONS.map(opt => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                              <select
                                id="month_ordinal_day"
                                name="month_ordinal_day"
                                value={formData.month_ordinal_day}
                                onChange={handleFormChange}
                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
                              >
                                <option value="">Select Day Type</option>
                                {ORDINAL_DAY_TYPE_OPTIONS.map(opt => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Ends On Section */}
                    <div className="pt-3 border-t border-gray-100 mt-3">
                      <label
                        htmlFor="ends_on_type"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Ends
                      </label>
                      <select
                        id="ends_on_type"
                        name="ends_on_type"
                        value={formData.ends_on_type}
                        onChange={handleFormChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
                      >
                        {ENDS_ON_TYPE_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      {formData.ends_on_type === 'AFTER_OCCURRENCES' && (
                        <div className="mt-2">
                          <label
                            htmlFor="ends_on_occurrences"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            After
                          </label>
                          <input
                            type="number"
                            id="ends_on_occurrences"
                            name="ends_on_occurrences"
                            value={formData.ends_on_occurrences}
                            onChange={handleFormChange}
                            min="1"
                            placeholder="e.g., 12"
                            className="mt-1 block w-1/2 pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
                          />
                          <span className="ml-1 text-sm text-gray-600">occurrences</span>
                        </div>
                      )}
                      {formData.ends_on_type === 'ON_DATE' && (
                        <div className="mt-2">
                          <label
                            htmlFor="ends_on_date"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            On Date
                          </label>
                          <input
                            type="date"
                            id="ends_on_date"
                            name="ends_on_date"
                            value={formData.ends_on_date}
                            onChange={handleFormChange}
                            className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
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
                  disabled={isSubmitting || isPreviewing} // Cancel button can remain active
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
  initialData: PropTypes.object, // Can be null if adding new
  onSave: PropTypes.func.isRequired,
  onPreviewRequest: PropTypes.func.isRequired,
};

export default AddEditChangePanel;
