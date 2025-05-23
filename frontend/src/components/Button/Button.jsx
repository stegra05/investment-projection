import React from 'react';
import PropTypes from 'prop-types';
import styles from './Button.module.css'; // Utilizes CSS Modules for styling

/**
 * @component Button
 * @description A versatile and consistently styled button component for various actions within the application.
 * It supports multiple visual variants, sizes, active states (useful for toggles or selections),
 * and can be configured to span the full width of its container.
 * Uses CSS Modules for scoped styling, ensuring style encapsulation and predictability.
 *
 * @example
 * // Primary action button
 * <Button variant="primary" onClick={handleSubmit}>Submit</Button>
 *
 * // Danger button for destructive actions
 * <Button variant="danger" size="small" onClick={handleDelete}>Delete Item</Button>
 *
 * // An active 'outline-select' button, perhaps for a filter
 * <Button variant="outline-select" isActive={true} onClick={toggleFilter}>Filter Active</Button>
 *
 * @param {object} props - The component's props.
 * @param {React.ReactNode} props.children - The content to be displayed inside the button (e.g., text, icon). Required.
 * @param {Function} [props.onClick] - Function to call when the button is clicked.
 * @param {'primary'|'secondary'|'danger'|'outline-select'|'tertiary'} [props.variant='primary'] - The visual style of the button.
 * @param {'default'|'small'} [props.size='default'] - The size of the button.
 * @param {boolean} [props.isActive=false] - Whether the button should appear in an active state.
 *                                           Effective for variants like 'outline-select'.
 * @param {boolean} [props.disabled=false] - If true, the button will be disabled and non-interactive.
 * @param {boolean} [props.fullWidth=false] - If true, the button will attempt to span the full width of its parent.
 * @param {string} [props.className=''] - Additional CSS classes to apply to the button, allowing for further customization.
 * @param {object} [props...rest] - Any other standard HTML button attributes (e.g., `type`, `aria-label`).
 *
 * @returns {JSX.Element} The rendered button component.
 */
const Button = ({
  children,
  onClick,
  variant = 'primary', // Default variant
  size = 'default',    // Default size
  isActive = false,
  disabled = false,
  fullWidth = false,
  className = '',      // Allows for external custom styling
  ...props             // Collects any other props passed (e.g., type="submit", aria-label)
}) => {
  // Dynamically constructs the button's CSS class string using CSS Modules.
  // This approach combines base styles, variant-specific styles, size-specific styles,
  // and conditional styles for active state, full-width, and custom external classes.
  const buttonClasses = `
    ${styles.button} 
    ${styles[variant]}
    ${styles[size] || styles['default']} 
    ${isActive && styles[`${variant}Active`] ? styles[`${variant}Active`] : ''}
    ${fullWidth ? styles.fullWidth : ''}
    ${className} 
  `.trim(); // .trim() removes any leading/trailing whitespace that might result from conditional logic.

  return (
    <button 
      className={buttonClasses} 
      onClick={onClick} 
      disabled={disabled} 
      {...props} // Spreads any additional HTML button attributes.
    >
      {children}
    </button>
  );
};

// PropTypes for type-checking and component documentation.
Button.propTypes = {
  /** The content rendered inside the button (e.g., text, an icon, or both). */
  children: PropTypes.node.isRequired,
  /** Function executed when the button is clicked. */
  onClick: PropTypes.func,
  /** Determines the button's visual style (e.g., 'primary' for main actions, 'danger' for destructive ones). */
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'outline-select', 'tertiary']),
  /** Sets the button's size. 'default' is standard, 'small' is more compact. */
  size: PropTypes.oneOf(['default', 'small']),
  /** If true, styles the button as active, often used for toggle or selection states (especially with 'outline-select'). */
  isActive: PropTypes.bool,
  /** If true, disables the button, making it unclickable and visually distinct. */
  disabled: PropTypes.bool,
  /** If true, the button will expand to the full width of its container. */
  fullWidth: PropTypes.bool,
  /** Allows adding custom CSS classes for further styling overrides or additions. */
  className: PropTypes.string,
};

export default Button;
