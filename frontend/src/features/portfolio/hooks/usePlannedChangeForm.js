import { useState, useEffect, useCallback } from 'react';

// This function is now internal to the hook
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
    targetAllocations: initialData?.targetAllocationJson // Raw JSON string from initialData
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

export const usePlannedChangeForm = (initialData, portfolio, isOpen) => {
  const [formData, setFormData] = useState(getInitialFormState(initialData));
  const [targetAllocationsDisplay, setTargetAllocationsDisplay] = useState([]);
  const [allocationSum, setAllocationSum] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const freshFormState = getInitialFormState(initialData);
      setFormData(freshFormState);

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

  const handleFormChange = useCallback(
    e => {
      const { name, value, type, checked } = e.target;
      setFormData(prevFormData => {
        let newFormData = { ...prevFormData };

        if (name === 'is_recurring') {
          newFormData.is_recurring = checked;
          if (!checked) {
            newFormData.frequency = 'ONE_TIME';
            newFormData.interval = 1;
            newFormData.days_of_week = [];
            newFormData.day_of_month = '';
            newFormData.monthly_type = 'specific_day';
            newFormData.month_ordinal = '';
            newFormData.month_ordinal_day = '';
            newFormData.month_of_year = '';
            newFormData.ends_on_type = 'NEVER';
            newFormData.ends_on_occurrences = '';
            newFormData.ends_on_date = '';
          } else {
            if (newFormData.frequency === 'ONE_TIME' || !newFormData.frequency) {
              newFormData.frequency = 'DAILY';
            }
          }
        } else if (name === 'changeType') {
          newFormData.changeType = value;
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
        } else {
          newFormData[name] = type === 'checkbox' ? checked : value;
        }
        return newFormData;
      });
    },
    [portfolio]
  );

  const handleAllocationChange = useCallback((assetId, newPercentageStr) => {
    setTargetAllocationsDisplay(prevAllocations => {
      const newAllocations = prevAllocations.map(alloc =>
        alloc.assetId === assetId ? { ...alloc, newPercentage: newPercentageStr } : alloc
      );
      const sum = newAllocations.reduce(
        (acc, curr) => acc + (parseFloat(curr.newPercentage) || 0),
        0
      );
      setAllocationSum(sum);
      return newAllocations;
    });
  }, []);

  const handleRecurrenceDataChange = useCallback(recurrenceUpdates => {
    setFormData(prevFormData => ({
      ...prevFormData,
      ...recurrenceUpdates,
    }));
  }, []);

  return {
    formData,
    setFormData,
    targetAllocationsDisplay,
    allocationSum,
    handleFormChange,
    handleAllocationChange,
    handleRecurrenceDataChange,
  };
}; 