import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';

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
 * - error (string): Optional error message to display below the select input.
 */

// Chevron icon component
const ChevronDownIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

// Checkmark icon component
const CheckIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const ForwardedSelect = React.forwardRef(({
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
  error = '',
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const containerRef = useRef(null);
  const optionsListRef = useRef(null);
  const buttonRef = useRef(null); // For focusing button after selection/escape

  // Combine forwarded ref and internal ref for the button
  const setRefs = useCallback((node) => {
    buttonRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }, [ref]);

  const memoizedOnChange = onChange;
  const memoizedName = name;

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(prevIsOpen => !prevIsOpen);
    }
  };

  const handleSelectOption = useCallback((optionValue) => {
    if (memoizedOnChange) {
      memoizedOnChange({ target: { name: memoizedName, value: optionValue } });
    }
    setIsOpen(false);
    if (buttonRef.current) {
      buttonRef.current.focus();
    }
  }, [memoizedOnChange, memoizedName]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Effect for setting initial highlighted index and scrolling when dropdown opens
  useEffect(() => {
    if (isOpen) {
      let initialHighlight = options.findIndex(opt => opt.value === value);
      if (initialHighlight === -1 && options.length > 0) {
        initialHighlight = 0; 
      }
      setHighlightedIndex(initialHighlight);

      if (initialHighlight >= 0 && optionsListRef.current) {
        const optionElement = optionsListRef.current.children[initialHighlight];
        if (optionElement) {
          setTimeout(() => optionElement.scrollIntoView({ block: 'nearest' }), 0);
        }
      }
    } else {
      setHighlightedIndex(-1);
    }
  }, [isOpen, options, value]);

  // Effect for scrolling when highlightedIndex changes while dropdown is open
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && optionsListRef.current && options.length > 0) {
      const optionElement = optionsListRef.current.children[highlightedIndex];
      if (optionElement) {
        optionElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen, options.length]);

  const handleKeyDown = useCallback((event) => {
    if (disabled) return;

    switch (event.key) {
    case 'Escape':
      event.preventDefault();
      setIsOpen(false);
      if (buttonRef.current) buttonRef.current.focus();
      break;
    case 'Enter':
    case ' ': // Space key to open/select
      event.preventDefault();
      if (isOpen) {
        if (highlightedIndex >= 0 && options[highlightedIndex]) {
          handleSelectOption(options[highlightedIndex].value);
        }
      } else {
        setIsOpen(true);
      }
      break;
    case 'ArrowDown':
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else if (options.length > 0) {
        setHighlightedIndex(prevIndex => Math.min(prevIndex + 1, options.length - 1));
      }
      break;
    case 'ArrowUp':
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else if (options.length > 0) {
        setHighlightedIndex(prevIndex => Math.max(prevIndex - 1, 0));
      }
      break;
    case 'Tab':
      if (isOpen) setIsOpen(false); // Close on tab out
      break;
    case 'Home':
      event.preventDefault();
      if (isOpen && options.length > 0) setHighlightedIndex(0);
      break;
    case 'End':
      event.preventDefault();
      if (isOpen && options.length > 0) setHighlightedIndex(options.length - 1);
      break;
    default:
      // Type-ahead functionality can be added here
      break;
    }
  }, [disabled, isOpen, highlightedIndex, options, handleSelectOption]);

  const selectedOptionObject = options.find(option => option.value === value);
  const displayLabel = selectedOptionObject ? selectedOptionObject.label : placeholder;
  
  const labelId = label ? `${id}-label` : undefined;
  const buttonId = id; // Use the main ID for the button

  return (
    <div className={`mb-4 ${className}`} ref={containerRef}>
      {label && (
        <label
          id={labelId}
          htmlFor={buttonId} // Points to the button
          className="block text-sm font-medium text-gray-700 mb-1 cursor-pointer"
        >
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          ref={setRefs}
          id={buttonId}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`relative w-full px-3 py-2 text-left border rounded-md shadow-sm 
                      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 
                      sm:text-sm
                      ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white text-gray-700 cursor-pointer'}
                      ${error ? 'border-red-500' : 'border-gray-300'}`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={labelId ? `${labelId} ${buttonId}` : buttonId}
        >
          <span className="block truncate">{displayLabel}</span>
          <span className={`absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none transform transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}>
            <ChevronDownIcon />
          </span>
        </button>

        <AnimatePresence>
          {isOpen && !disabled && (
            <motion.ul
              ref={optionsListRef}
              className="absolute z-10 mt-1 w-full bg-white shadow-lg border border-gray-200 rounded-md max-h-60 overflow-auto focus:outline-none sm:text-sm"
              role="listbox"
              tabIndex={-1}
              aria-labelledby={labelId || buttonId}
              aria-activedescendant={highlightedIndex >= 0 && options[highlightedIndex] ? `${buttonId}-option-${options[highlightedIndex].value}` : undefined}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
            >
              {options.length === 0 ? (
                <li className="px-3 py-2 text-gray-500 cursor-default">No options available</li>
              ) : (
                options.map((option, index) => (
                  <li
                    key={option.value}
                    id={`${buttonId}-option-${option.value}`}
                    role="option"
                    aria-selected={option.value === value}
                    tabIndex={-1}
                    className={`relative px-3 py-2 cursor-pointer 
                                ${index === highlightedIndex ? 'bg-primary-600 text-white' : 'text-gray-900 hover:bg-gray-100'}
                                ${option.value === value && index !== highlightedIndex ? 'bg-primary-100 text-primary-700 font-semibold' : ''}
                                ${option.value === value && index === highlightedIndex ? 'font-semibold' : ''}
                              `}
                    onClick={() => handleSelectOption(option.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectOption(option.value);
                      }
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <span className="block truncate">{option.label}</span>
                    {option.value === value && (
                      <span className={`absolute inset-y-0 right-0 flex items-center pr-4 ${index === highlightedIndex ? 'text-white' : 'text-primary-600'}`}>
                        <CheckIcon />
                      </span>
                    )}
                  </li>
                ))
              )}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {name && <input type="hidden" name={name} value={value || ''} />}
    </div>
  );
});

ForwardedSelect.displayName = 'ForwardedSelect';

ForwardedSelect.propTypes = {
  label: PropTypes.string,
  id: PropTypes.string.isRequired,
  name: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Value can be empty initially if placeholder is used
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  placeholder: PropTypes.string,
  error: PropTypes.string,
};

ForwardedSelect.defaultProps = {
  label: undefined,
  name: undefined,
  value: '', // Default value to empty string for controlled component with placeholder
  // options is required, so no default here
  required: false,
  disabled: false,
  className: '',
  placeholder: ' -- Select an option -- ',
  error: '',
};

export default ForwardedSelect;
