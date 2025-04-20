import React from 'react';
import styles from './Input.module.css';

/**
 * Input Component
 * A styled wrapper around the native HTML input element.
 *
 * @param {object} props - Component props
 * @param {string} props.id - The id for the input element and label association.
 * @param {string} props.name - The name attribute for the input element.
 * @param {string} [props.type='text'] - The type of the input (e.g., 'text', 'email', 'password', 'number').
 * @param {string | number} props.value - The current value of the input.
 * @param {(e: React.ChangeEvent<HTMLInputElement>) => void} props.onChange - Change handler.
 * @param {string} [props.placeholder] - Placeholder text.
 * @param {string} [props.className] - Additional class name for the input element.
 * @param {boolean} [props.disabled=false] - If true, disables the input.
 * @param {boolean} [props.error=false] - If true, applies error styling.
 * @param {string} [props.required] - Whether the field is required.
 * @param {React.Ref<HTMLInputElement>} [ref] - Forwarded ref to the input element.
 */
const Input = React.forwardRef((
  {
    id,
    name,
    type = 'text',
    value,
    onChange,
    placeholder,
    className = '',
    disabled = false,
    error = false,
    required,
    ...rest
  },
  ref
) => {
  const combinedClassName = [
    styles.input,
    error ? styles.error : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className={combinedClassName}
      ref={ref}
      {...rest}
    />
  );
});

Input.displayName = 'Input'; // Add display name for React DevTools

export default Input; 