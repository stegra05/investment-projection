import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion'; // For dropdown animation.

/**
 * @component ChevronDownIcon
 * @description Renders a chevron down SVG icon, typically used to indicate a dropdown.
 * @returns {JSX.Element} SVG element for the chevron down icon.
 */
const ChevronDownIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

/**
 * @component CheckIcon
 * @description Renders a checkmark SVG icon, typically used to indicate a selected item.
 * @returns {JSX.Element} SVG element for the checkmark icon.
 */
const CheckIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

/**
 * @component ForwardedSelect (Select)
 * @description A custom-styled, accessible, and interactive select/dropdown component.
 * It replaces the native HTML select element to provide enhanced styling, keyboard navigation,
 * mouse interactions, and animations. Supports labels, placeholders, error messages,
 * disabled state, and required field indication. Uses `React.forwardRef` to allow parent
 * components to get a ref to the underlying button element.
 *
 * @example
 * const options = [
 *   { value: 'opt1', label: 'Option 1' },
 *   { value: 'opt2', label: 'Option 2' },
 * ];
 * <ForwardedSelect
 *   id="mySelect"
 *   name="mySelectName"
 *   label="Choose an option"
 *   options={options}
 *   value={selectedValue}
 *   onChange={handleChange}
 *   placeholder="Select one..."
 *   error={errorMessage}
 * />
 *
 * @param {object} props - The component's props.
 * @param {string} [props.label] - Text for the label associated with the select.
 * @param {string} props.id - Unique ID for the select component, used for linking label and ARIA attributes. Required.
 * @param {string} [props.name] - Name attribute for the hidden input field, useful for form submission.
 * @param {string|number} [props.value=''] - The currently selected value of the select.
 * @param {Function} props.onChange - Callback function invoked when an option is selected.
 *                                    Receives an event-like object: `{ target: { name, value } }`. Required.
 * @param {Array<object>} props.options - Array of option objects, each with `value` and `label` properties. Required.
 * @param {boolean} [props.required=false] - If true, marks the select as required with a visual indicator.
 * @param {boolean} [props.disabled=false] - If true, disables the select, making it non-interactive.
 * @param {string} [props.className=''] - Optional additional CSS classes for the main wrapper div.
 * @param {string} [props.placeholder=' -- Select an option -- '] - Text displayed when no option is selected.
 * @param {string} [props.error=''] - Error message to display below the select. If present, styles the select to indicate an error.
 * @param {React.Ref} ref - Forwarded ref to the underlying button element that triggers the dropdown.
 *
 * @returns {JSX.Element} The rendered custom select component.
 */
const ForwardedSelect = React.forwardRef(({
  label,
  id, // Used as the base for button ID and linking label.
  name, // Name for the hidden input for form submission.
  value,
  onChange,
  options = [], // Ensure options defaults to an empty array if not provided.
  required = false,
  disabled = false,
  className = '', // Custom class for the main wrapper.
  placeholder = ' -- Select an option -- ',
  error = '',
}, ref) => {
  // State for managing whether the dropdown list is open or closed.
  const [isOpen, setIsOpen] = useState(false);
  // State for tracking the index of the currently highlighted option (for keyboard navigation).
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  // Refs for DOM elements to manage focus and click-outside detection.
  const containerRef = useRef(null); // Ref for the main component wrapper.
  const optionsListRef = useRef(null); // Ref for the `ul` element containing the options.
  const buttonRef = useRef(null); // Internal ref for the button that triggers the dropdown.

  // `setRefs` combines the forwarded `ref` (from parent) with the internal `buttonRef`.
  // This allows the parent to get a ref to the button while the component also uses it internally.
  const setRefs = useCallback((node) => {
    buttonRef.current = node; // Internal ref.
    if (typeof ref === 'function') {
      ref(node); // Forwarded ref as a function.
    } else if (ref) {
      ref.current = node; // Forwarded ref as an object.
    }
  }, [ref]);

  // Memoize props that are used in `useCallback` dependencies to prevent unnecessary re-creations
  // of callbacks if these props are passed inline.
  const memoizedOnChange = onChange;
  const memoizedName = name;

  /**
   * Toggles the open/closed state of the dropdown, unless disabled.
   */
  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(prevIsOpen => !prevIsOpen);
    }
  };

  /**
   * Handles the selection of an option.
   * Calls the `onChange` prop with the selected value, closes the dropdown,
   * and focuses the button.
   * @param {string|number} optionValue - The value of the selected option.
   */
  const handleSelectOption = useCallback((optionValue) => {
    if (memoizedOnChange) {
      // Simulate a standard input event object.
      memoizedOnChange({ target: { name: memoizedName, value: optionValue } });
    }
    setIsOpen(false); // Close the dropdown.
    if (buttonRef.current) {
      buttonRef.current.focus(); // Return focus to the button.
    }
  }, [memoizedOnChange, memoizedName]); // Dependencies for useCallback.

  // `useEffect` hook to handle clicks outside the component to close the dropdown.
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If the click is outside the containerRef element, close the dropdown.
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    // Add event listener when the dropdown is open.
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    // Cleanup function: remove event listener when dropdown is closed or component unmounts.
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]); // Dependency: only re-run if `isOpen` changes.

  // `useEffect` to manage the highlighted index and scroll to it when the dropdown opens.
  useEffect(() => {
    if (isOpen) {
      // Find the index of the currently selected value, or default to 0 if no value is selected.
      let initialHighlight = options.findIndex(opt => opt.value === value);
      if (initialHighlight === -1 && options.length > 0) {
        initialHighlight = 0; // Highlight the first option if no value or invalid value selected.
      }
      setHighlightedIndex(initialHighlight);

      // Scroll the initially highlighted option into view.
      if (initialHighlight >= 0 && optionsListRef.current) {
        const optionElement = optionsListRef.current.children[initialHighlight];
        if (optionElement) {
          // setTimeout ensures scrolling happens after the element is fully rendered and positioned.
          setTimeout(() => optionElement.scrollIntoView({ block: 'nearest' }), 0);
        }
      }
    } else {
      // Reset highlighted index when dropdown closes.
      setHighlightedIndex(-1);
    }
  }, [isOpen, options, value]); // Dependencies: run if state/props affecting highlight change.

  // `useEffect` to scroll the highlighted option into view when `highlightedIndex` changes.
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && optionsListRef.current && options.length > 0) {
      const optionElement = optionsListRef.current.children[highlightedIndex];
      if (optionElement) {
        optionElement.scrollIntoView({ block: 'nearest' }); // Keep highlighted item visible.
      }
    }
  }, [highlightedIndex, isOpen, options.length]); // Dependencies.

  /**
   * Handles keyboard interactions for accessibility and usability.
   * Supports Escape, Enter, Space, ArrowDown, ArrowUp, Tab, Home, and End keys.
   * @param {React.KeyboardEvent} event - The keyboard event.
   */
  const handleKeyDown = useCallback((event) => {
    if (disabled) return; // Do nothing if disabled.

    switch (event.key) {
    case 'Escape': // Close dropdown and focus button.
      event.preventDefault();
      setIsOpen(false);
      if (buttonRef.current) buttonRef.current.focus();
      break;
    case 'Enter': // Select highlighted option or open dropdown.
    case ' ': // (Space key) Select highlighted option or open dropdown.
      event.preventDefault();
      if (isOpen) {
        if (highlightedIndex >= 0 && options[highlightedIndex]) {
          handleSelectOption(options[highlightedIndex].value);
        }
      } else {
        setIsOpen(true); // Open dropdown if closed.
      }
      break;
    case 'ArrowDown': // Move highlight down or open dropdown.
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else if (options.length > 0) {
        setHighlightedIndex(prevIndex => Math.min(prevIndex + 1, options.length - 1));
      }
      break;
    case 'ArrowUp': // Move highlight up or open dropdown.
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else if (options.length > 0) {
        setHighlightedIndex(prevIndex => Math.max(prevIndex - 1, 0));
      }
      break;
    case 'Tab': // Close dropdown when tabbing out.
      if (isOpen) setIsOpen(false);
      break;
    case 'Home': // Highlight first option.
      event.preventDefault();
      if (isOpen && options.length > 0) setHighlightedIndex(0);
      break;
    case 'End': // Highlight last option.
      event.preventDefault();
      if (isOpen && options.length > 0) setHighlightedIndex(options.length - 1);
      break;
    default:
      // Future: Type-ahead functionality could be implemented here by listening to other key presses.
      break;
    }
  }, [disabled, isOpen, highlightedIndex, options, handleSelectOption]); // Dependencies.

  // Find the full option object for the currently selected value to display its label.
  const selectedOptionObject = options.find(option => option.value === value);
  // Determine the text to display on the button: selected option's label or placeholder.
  const displayLabel = selectedOptionObject ? selectedOptionObject.label : placeholder;
  
  // Construct IDs for ARIA attributes.
  const labelId = label ? `${id}-label` : undefined; // ID for the label element, if label exists.
  const buttonId = id; // Main ID for the button, taken from props.id.

  return (
    <div className={`mb-4 ${className}`} ref={containerRef}> {/* Main container with click-outside ref. */}
      {label && (
        <label
          id={labelId} // ARIA: ID for the label.
          htmlFor={buttonId} // Associates label with the button.
          className="block text-sm font-medium text-gray-700 mb-1 cursor-pointer"
        >
          {label}
          {required && <span className="text-red-500"> *</span>} {/* Required field indicator. */}
        </label>
      )}
      <div className="relative"> {/* Relative container for positioning the dropdown. */}
        <button
          type="button" // Standard button type.
          ref={setRefs} // Combined internal and forwarded ref.
          id={buttonId} // ID for the button.
          onClick={handleToggle} // Toggles dropdown on click.
          onKeyDown={handleKeyDown} // Handles keyboard interactions.
          disabled={disabled} // Disables button if prop is true.
          className={`relative w-full px-3 py-2 text-left border rounded-md shadow-sm 
                      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 
                      sm:text-sm
                      ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white text-gray-700 cursor-pointer'}
                      ${error ? 'border-red-500' : 'border-gray-300'}`} // Dynamic styling for disabled/error states.
          aria-haspopup="listbox" // ARIA: Indicates the button opens a listbox.
          aria-expanded={isOpen} // ARIA: Indicates if the listbox is currently open.
          // ARIA: Associates button with its label (if exists) and its own content for context.
          aria-labelledby={labelId ? `${labelId} ${buttonId}` : buttonId} 
        >
          <span className="block truncate">{displayLabel}</span> {/* Displays selected option label or placeholder. */}
          {/* Chevron icon, rotates when dropdown is open. */}
          <span className={`absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none transform transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}>
            <ChevronDownIcon />
          </span>
        </button>

        {/* AnimatePresence enables exit animations for the dropdown list. */}
        <AnimatePresence>
          {isOpen && !disabled && ( // Render dropdown only if open and not disabled.
            <motion.ul
              ref={optionsListRef} // Ref for scrolling options.
              className="absolute z-10 mt-1 w-full bg-white shadow-lg border border-gray-200 rounded-md max-h-60 overflow-auto focus:outline-none sm:text-sm"
              role="listbox" // ARIA: Identifies this as a listbox.
              tabIndex={-1} // Makes the list focusable programmatically but not via Tab key.
              aria-labelledby={labelId || buttonId} // ARIA: Associates listbox with its label/button.
              // ARIA: Indicates which option is currently active/focused via keyboard navigation.
              aria-activedescendant={highlightedIndex >= 0 && options[highlightedIndex] ? `${buttonId}-option-${options[highlightedIndex].value}` : undefined}
              // Framer Motion animation properties:
              initial={{ opacity: 0, y: -10, scale: 0.95 }} // Initial state (before animation).
              animate={{ opacity: 1, y: 0, scale: 1 }}      // Target state (after animation).
              exit={{ opacity: 0, y: -10, scale: 0.95 }}    // State when exiting.
              transition={{ duration: 0.15, ease: 'easeInOut' }} // Animation timing and easing.
            >
              {options.length === 0 ? (
                // Displayed if no options are provided.
                <li className="px-3 py-2 text-gray-500 cursor-default">No options available</li>
              ) : (
                // Map over provided options to create list items.
                options.map((option, index) => (
                  <li
                    key={option.value} // React key for list items.
                    id={`${buttonId}-option-${option.value}`} // Unique ID for each option, used by aria-activedescendant.
                    role="option" // ARIA: Identifies this as an option in a listbox.
                    aria-selected={option.value === value} // ARIA: Indicates if this option is currently selected.
                    tabIndex={-1} // Individual options are not focusable via Tab key.
                    // Dynamic styling for highlighted, selected, and standard states.
                    className={`relative px-3 py-2 cursor-pointer 
                                ${index === highlightedIndex ? 'bg-primary-600 text-white' : 'text-gray-900 hover:bg-gray-100'}
                                ${option.value === value && index !== highlightedIndex ? 'bg-primary-100 text-primary-700 font-semibold' : ''}
                                ${option.value === value && index === highlightedIndex ? 'font-semibold' : ''}
                              `}
                    onClick={() => handleSelectOption(option.value)} // Selects option on click.
                    // Allows selecting option with Enter or Space key when it's focused via mouse hover (onMouseEnter sets highlight).
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectOption(option.value);
                      }
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)} // Highlights option on mouse enter for keyboard consistency.
                  >
                    <span className="block truncate">{option.label}</span> {/* Displays option label. */}
                    {/* Show checkmark if this option is selected. */}
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
      {/* Display error message if `error` prop is provided. */}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {/* Hidden input to store the selected value, useful for native form submission if `name` prop is provided. */}
      {name && <input type="hidden" name={name} value={value || ''} />}
    </div>
  );
});

// Set a display name for the component, useful in React DevTools.
ForwardedSelect.displayName = 'ForwardedSelect';

// PropTypes for type-checking and component documentation.
ForwardedSelect.propTypes = {
  /** Text label displayed above the select component. */
  label: PropTypes.string,
  /** Unique ID for the select component; links label to the button and used for ARIA attributes. Required. */
  id: PropTypes.string.isRequired,
  /** Name attribute for the hidden input field, facilitating native form submissions. */
  name: PropTypes.string,
  /** The currently selected value. Should match one of the `option.value`s. Can be empty if using a placeholder. */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Callback function invoked when an option is selected. Receives an object like `{ target: { name, value } }`. Required. */
  onChange: PropTypes.func.isRequired,
  /** Array of option objects, each with `value` and `label` properties. `value` must be unique. Required. */
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  /** If true, marks the select as a required field with a visual indicator (`*`). */
  required: PropTypes.bool,
  /** If true, disables the select, preventing interaction. */
  disabled: PropTypes.bool,
  /** Optional additional CSS classes for the main wrapper `div` of the select component. */
  className: PropTypes.string,
  /** Placeholder text displayed when no option is selected or if the `value` prop is empty/undefined. */
  placeholder: PropTypes.string,
  /** Error message to display below the select. If present, also applies error styling to the select border. */
  error: PropTypes.string,
};

// Default values for props if not provided by the parent component.
ForwardedSelect.defaultProps = {
  label: undefined,
  name: undefined,
  value: '', // Default value to empty string, important for controlled component behavior with placeholder.
  // `options` is required, so it does not have a default here.
  required: false,
  disabled: false,
  className: '',
  placeholder: ' -- Select an option -- ', // Default placeholder text.
  error: '',
};

export default ForwardedSelect;
