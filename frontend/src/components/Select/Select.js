import React from 'react';

/**
 * Reusable Select component.
 * 
 * Props:
 * - label (string): The text for the label.
 * - id (string): The id for the select element, used for linking label.
 * - name (string): The name attribute for the select element.
 * - value (string): The currently selected value.
 * - onChange (function): Handler function for when the value changes.
 * - options (array): Array of objects with { value: string, label: string } for the select options.
 * - required (boolean): Whether the select is required.
 * - disabled (boolean): Whether the select is disabled.
 * - className (string): Optional additional CSS classes for the wrapper div.
 * - placeholder (string): Optional placeholder text for the default option.
 */
function Select({ 
  label, 
  id, 
  name, 
  value, 
  onChange, 
  options = [], 
  required = false, 
  disabled = false,
  className = '',
  placeholder = ' -- Select an option -- ',
}) {
  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                    focus:outline-none focus:ring-primary-500 focus:border-primary-500 
                    sm:text-sm 
                    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {/* TODO: Add space for potential error messages if needed */}
    </div>
  );
}

export default Select; 