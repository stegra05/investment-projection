import { useState, useMemo } from 'react';

/**
 * Custom hook to manage common form state like editing status and errors.
 *
 * @param {object | null | undefined} existingEntity - The entity object if editing, otherwise null/undefined.
 * @returns {{ isEditing: boolean, error: string, setError: Function }}
 */
export function useFormState(existingEntity) {
  const isEditing = useMemo(() => Boolean(existingEntity), [existingEntity]);
  const [error, setError] = useState('');

  // You could potentially add more logic here if needed,
  // like resetting the error when the entity changes.
  // useEffect(() => {
  //   setError('');
  // }, [existingEntity]);

  return { isEditing, error, setError };
} 