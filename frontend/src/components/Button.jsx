import React from 'react';
import PropTypes from 'prop-types';
import styles from './Button.module.css';
import { ArrowPathIcon } from '@heroicons/react/24/outline'; // For loading spinner

/**
 * A reusable button component adhering to the design system.
 *
 * @param {object} props - Component props.
 * @param {node} props.children - Button content.
 * @param {function} props.onClick - Click handler.
 * @param {'button'|'submit'|'reset'} [props.type='button'] - Button type attribute.
 * @param {'primary'|'secondary'|'destructive'|'icon'} [props.variant='primary'] - Button style variant.
 * @param {node} [props.icon] - Optional icon element to display before the children.
 * @param {string} [props.className] - Additional CSS classes.
 * @param {boolean} [props.disabled] - Whether the button is disabled.
 * @param {boolean} [props.loading] - Whether to show a loading state.
 * @param {object} [props.rest] - Other native button props.
 */
function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  icon,
  className = '',
  disabled = false,
  loading = false, // Add loading prop
  ...rest
}) {
  const buttonClasses = [
    styles.buttonBase,
    styles[variant], // e.g., styles.primary, styles.secondary
    loading ? styles.loading : '', // Add loading class if loading
    className,
  ].filter(Boolean).join(' ');

  // Remove loading from rest props to avoid passing it to DOM
  const { loading: _loading, ...buttonProps } = rest;

  return (
    <button
      type={type}
      onClick={onClick}
      className={buttonClasses}
      disabled={disabled || loading} // Disable if loading
      {...buttonProps} // Pass remaining props
    >
      {loading ? (
        <ArrowPathIcon className={`${styles.icon} ${styles.spinner}`} aria-hidden="true" />
      ) : (
        icon && React.cloneElement(icon, { className: styles.icon, 'aria-hidden': true })
      )}
      {children && <span className={styles.text}>{children}</span>}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'destructive', 'icon']),
  icon: PropTypes.element,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  loading: PropTypes.bool, // Add prop type for loading
};

export default Button; 