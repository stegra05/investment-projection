import React, { useState } from 'react';
import PropTypes from 'prop-types';
// import { FiEye, FiEyeOff } from 'react-icons/fi'; // Comment out icon import

const Input = ({
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

  const baseClasses = 'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 sm:text-sm';

  if (type === 'textarea') {
    return (
      <div className="mb-4 relative">
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
          className={`${baseClasses} ${className || ''}`.trim()}
        />
        {helperText && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
      </div>
    );
  }

  const actualInputType = isPassword ? (isPasswordVisible ? 'text' : 'password') : type;
  const inputSpecificClasses = `h-10 ${isPassword ? 'pr-10' : ''}`;

  return (
    <div className="mb-4 relative">
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
          className={`${baseClasses} ${inputSpecificClasses} ${className || ''}`.trim()}
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
      {helperText && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
    </div>
  );
};

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
  rows: PropTypes.number,
  className: PropTypes.string,
};

const ForwardedInput = React.forwardRef(Input);

export default ForwardedInput;
