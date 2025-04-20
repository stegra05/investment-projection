import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid'; // Using 20/solid for a slightly smaller, solid arrow
import styles from './Select.module.css';

/**
 * Select Component
 * A styled wrapper around the native HTML select element.
 *
 * @param {object} props - Component props
 * @param {string} props.id - The id for the select element and label association.
 * @param {string} props.name - The name attribute for the select element.
 * @param {string} props.value - The currently selected value.
 * @param {(e: React.ChangeEvent<HTMLSelectElement>) => void} props.onChange - Change handler.
 * @param {React.ReactNode} props.children - Should be <option> elements.
 * @param {string} [props.className] - Additional class name for the wrapper div.
 * @param {boolean} [props.disabled=false] - If true, disables the select input.
 * @param {string} [props.placeholder] - Optional placeholder text (requires a disabled option).
 * @param {string} [props.required] - Whether the field is required.
 * @param {React.Ref<HTMLSelectElement>} [ref] - Forwarded ref to the select element.
 */
const Select = React.forwardRef((
  {
    id,
    name,
    value,
    onChange,
    children,
    className = '',
    disabled = false,
    placeholder,
    required,
    ...rest
  },
  ref
) => {
  const wrapperClassName = [
    styles.selectWrapper,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClassName}>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={styles.select}
        ref={ref}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled hidden={!value}> {/* Hide placeholder if value selected */}
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <ChevronDownIcon className={styles.arrow} aria-hidden="true" />
    </div>
  );
});

Select.displayName = 'Select'; // Add display name for React DevTools

export default Select; 