import React, { useState } from 'react';
import PropTypes from 'prop-types';
// import { FiEye, FiEyeOff } from 'react-icons/fi'; // Example for future icon integration

/**
 * @component Input
 * @description A versatile input component that supports standard text inputs, password fields
 * with visibility toggle, and textareas. It includes labels, required field indicators,
 * helper text, error display, and forwards refs to the underlying input element.
 * Accessibility is enhanced with ARIA attributes.
 *
 * @example
 * // Basic text input with a label
 * <Input type="text" name="username" label="Username" value={value} onChange={handleChange} />
 *
 * // Password input with error message
 * <Input type="password" name="password" label="Password" error="Password is too short." value={value} onChange={handleChange} />
 *
 * // Textarea with helper text
 * <Input type="textarea" name="description" label="Description" helperText="Max 200 characters." value={value} onChange={handleChange} />
 *
 * @param {object} props - The component's props.
 * @param {string} [props.label] - Text label displayed above the input.
 * @param {string} [props.id] - HTML id for the input element. If not provided, `name` prop is used.
 * @param {string} props.name - HTML name for the input element. Required. Used for form submission and as a fallback for `id`.
 * @param {'text'|'password'|'email'|'number'|'textarea'|string} [props.type='text'] - Type of the input. 'textarea' renders a textarea element.
 * @param {string|number} props.value - The current value of the input. Required.
 * @param {Function} [props.onChange] - Callback function triggered when the input value changes.
 * @param {boolean} [props.required=false] - If true, marks the input as required with a visual indicator.
 * @param {string} [props.autoComplete] - HTML autoComplete attribute.
 * @param {string} [props.placeholder] - Placeholder text for the input.
 * @param {string} [props.helperText] - Optional text displayed below the input for guidance.
 * @param {string} [props.error] - Error message to display below the input. If present, styles the input to indicate an error.
 * @param {number} [props.rows] - Number of rows for the textarea when `type` is 'textarea'. Defaults to 3.
 * @param {string} [props.className] - Additional CSS classes for the wrapper div of the input component.
 * @param {object} [props...rest] - Any other standard HTML input or textarea attributes.
 * @param {React.Ref} ref - Forwarded ref to the underlying HTMLInputElement or HTMLTextAreaElement.
 *
 * @returns {JSX.Element} The rendered input or textarea component.
 */
const Input = React.forwardRef(({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  required = false,
  autoComplete,
  placeholder,
  helperText,
  error,
  rows, // Specific to textarea
  className, // Custom class for the wrapper div
  ...props // Rest of the props for the input/textarea element
}, ref) => {
  // Determine the inputId: use `id` if provided, otherwise fallback to `name`.
  const inputId = id || name;
  const isPassword = type === 'password';

  // State for managing password visibility (only applicable if type is 'password').
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  /**
   * Toggles the visibility of the password text.
   */
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(prevState => !prevState);
  };

  // Dynamically sets border color based on error state.
  const errorBorderClass = error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500';
  // Base styling classes for both input and textarea. Includes error-specific border.
  const baseClasses = `mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 sm:text-sm ${errorBorderClass}`;

  // Conditional rendering for textarea.
  if (type === 'textarea') {
    return (
      <div className={`relative ${className || ''}`.trim()} style={{ marginBottom: error || helperText ? '0' : '1rem' }}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          rows={rows || 3} // Default to 3 rows if not specified.
          {...props}
          ref={ref} // Forwarded ref.
          className={`${baseClasses}`.trim()}
          aria-invalid={!!error} // Accessibility: indicates if the input value is invalid.
          // Accessibility: links the input to its error or helper text.
          aria-describedby={error ? `${inputId}-error` : (helperText ? `${inputId}-helper` : undefined)}
        />
        {/* Error message display */}
        {error && <p id={`${inputId}-error`} className="mt-1 text-xs text-red-600" role="alert">{error}</p>}
        {/* Helper text display (only if no error) */}
        {!error && helperText && <p id={`${inputId}-helper`} className="mt-1 text-xs text-gray-500">{helperText}</p>}
      </div>
    );
  }

  // Determine the actual input type (text or password) if it's a password field.
  const actualInputType = isPassword ? (isPasswordVisible ? 'text' : 'password') : type;
  // Adds padding to the right of password input to make space for the toggle button.
  const passwordPaddingClass = isPassword ? 'pr-10' : '';

  // Rendering for standard input types (text, password, email, etc.).
  return (
    <div className={`relative ${className || ''}`.trim()} style={{ marginBottom: error || helperText ? '0' : '1rem' }}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative"> {/* Wrapper for input and password toggle button */}
        <input
          type={actualInputType}
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          {...props}
          ref={ref} // Forwarded ref.
          className={`${baseClasses} ${passwordPaddingClass}`.trim()}
          aria-invalid={!!error} // Accessibility: indicates if the input value is invalid.
          // Accessibility: links the input to its error or helper text.
          aria-describedby={error ? `${inputId}-error` : (helperText ? `${inputId}-helper` : undefined)}
        />
        {isPassword && (
          <button
            type="button" // Important: type="button" to prevent form submission.
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'} // Accessibility label for the toggle.
            style={{ background: 'transparent', border: 'none' }} // Basic styling for the button.
          >
            {/* Text can be replaced with icons in the future e.g. FiEye, FiEyeOff */}
            {isPasswordVisible ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {/* Error message display */}
      {error && <p id={`${inputId}-error`} className="mt-1 text-xs text-red-600" role="alert">{error}</p>}
      {/* Helper text display (only if no error) */}
      {!error && helperText && <p id={`${inputId}-helper`} className="mt-1 text-xs text-gray-500">{helperText}</p>}
    </div>
  );
});

// Set a display name for the component, useful in React DevTools.
Input.displayName = 'Input';

// PropTypes for type-checking and component documentation.
Input.propTypes = {
  /** Text label displayed above the input. */
  label: PropTypes.string,
  /** HTML id for the input element. If not provided, `name` prop is used. */
  id: PropTypes.string,
  /** HTML name for the input element. Required. Used for form submission and as a fallback for `id`. */
  name: PropTypes.string.isRequired,
  /** Type of the input (e.g., 'text', 'password', 'email', 'textarea'). Determines rendering and behavior. */
  type: PropTypes.string,
  /** The current value of the input. Controlled component: requires `onChange` prop. */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  /** Callback function triggered when the input value changes. */
  onChange: PropTypes.func,
  /** If true, marks the input as required with a visual indicator (`*`). */
  required: PropTypes.bool,
  /** HTML `autoComplete` attribute for the input field. */
  autoComplete: PropTypes.string,
  /** Placeholder text for the input field. */
  placeholder: PropTypes.string,
  /** Optional text displayed below the input for guidance or additional information. */
  helperText: PropTypes.string,
  /** Error message to display below the input. If present, styles the input to indicate an error. */
  error: PropTypes.string,
  /** Number of rows for the textarea when `type` is 'textarea'. Defaults to 3. */
  rows: PropTypes.number,
  /** Additional CSS classes for the wrapper div of the input component, allowing for layout customization. */
  className: PropTypes.string,
};

export default Input;
