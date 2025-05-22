import React, { useState } from 'react';
import PropTypes from 'prop-types';
// import { FiEye, FiEyeOff } from 'react-icons/fi'; // Comment out icon import

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
  rows,
  className,
  ...props
}, ref) => {
  const inputId = id || name;
  const isPassword = type === 'password';
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(prevState => !prevState);
  };

  const errorBorderClass = error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500';
  const baseClasses = `mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 sm:text-sm ${errorBorderClass}`;

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
          rows={rows || 3}
          {...props}
          ref={ref}
          className={`${baseClasses}`.trim()}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : (helperText ? `${inputId}-helper` : undefined)}
        />
        {error && <p id={`${inputId}-error`} className="mt-1 text-xs text-red-600" role="alert">{error}</p>}
        {!error && helperText && <p id={`${inputId}-helper`} className="mt-1 text-xs text-gray-500">{helperText}</p>}
      </div>
    );
  }

  const actualInputType = isPassword ? (isPasswordVisible ? 'text' : 'password') : type;
  const passwordPaddingClass = isPassword ? 'pr-10' : '';

  return (
    <div className={`relative ${className || ''}`.trim()} style={{ marginBottom: error || helperText ? '0' : '1rem' }}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
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
          ref={ref}
          className={`${baseClasses} ${passwordPaddingClass}`.trim()}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : (helperText ? `${inputId}-helper` : undefined)}
        />
        {isPassword && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
            style={{ background: 'transparent', border: 'none' }}
          >
            {isPasswordVisible ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {error && <p id={`${inputId}-error`} className="mt-1 text-xs text-red-600" role="alert">{error}</p>}
      {!error && helperText && <p id={`${inputId}-helper`} className="mt-1 text-xs text-gray-500">{helperText}</p>}
    </div>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  label: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string.isRequired,
  type: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func,
  required: PropTypes.bool,
  autoComplete: PropTypes.string,
  placeholder: PropTypes.string,
  helperText: PropTypes.string,
  error: PropTypes.string,
  rows: PropTypes.number,
  className: PropTypes.string,
};

export default Input;
