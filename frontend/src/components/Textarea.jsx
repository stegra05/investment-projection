import React from 'react';
import styles from './Textarea.module.css';

/**
 * Textarea Component
 * A styled wrapper around the native HTML textarea element.
 *
 * @param {object} props - Component props
 * @param {string} props.id - The id for the textarea element and label association.
 * @param {string} props.name - The name attribute for the textarea element.
 * @param {string | number} props.value - The current value of the textarea.
 * @param {(e: React.ChangeEvent<HTMLTextAreaElement>) => void} props.onChange - Change handler.
 * @param {string} [props.placeholder] - Placeholder text.
 * @param {string} [props.className] - Additional class name for the textarea element.
 * @param {boolean} [props.disabled=false] - If true, disables the textarea.
 * @param {boolean} [props.error=false] - If true, applies error styling.
 * @param {number} [props.rows=4] - Specifies the visible number of lines in a text area.
 * @param {string} [props.required] - Whether the field is required.
 * @param {React.Ref<HTMLTextAreaElement>} [ref] - Forwarded ref to the textarea element.
 */
const Textarea = React.forwardRef((
  {
    id,
    name,
    value,
    onChange,
    placeholder,
    className = '',
    disabled = false,
    error = false,
    rows = 4,
    required,
    ...rest
  },
  ref
) => {
  const combinedClassName = [
    styles.textarea,
    error ? styles.error : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <textarea
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      rows={rows}
      className={combinedClassName}
      ref={ref}
      {...rest}
    />
  );
});

Textarea.displayName = 'Textarea'; // Add display name for React DevTools

export default Textarea; 