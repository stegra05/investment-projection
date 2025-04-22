import React from 'react';
import PropTypes from 'prop-types';
import styles from './Button.module.css';
import { ArrowPathIcon } from '@heroicons/react/24/outline'; // For loading spinner

/**
 * A reusable button component adhering to Material Design 3 guidelines.
 *
 * @param {object} props - Component props.
 * @param {node} props.children - Button content.
 * @param {function} props.onClick - Click handler.
 * @param {'button'|'submit'|'reset'} [props.type='button'] - Button type attribute.
 * @param {'filled'|'tonal'|'outlined'|'text'|'elevated'} [props.variant='filled'] - M3 Button style variant.
 * @param {'primary'|'secondary'|'tertiary'|'error'} [props.color='primary'] - Semantic color role.
 * @param {boolean} [props.destructive=false] - DEPRECATED: Use color='error' instead. Kept for compatibility.
 * @param {node} [props.icon] - Optional icon element to display before the children.
 * @param {boolean} [props.iconOnly=false] - Whether the button should only display an icon (reduces padding, hides text).
 * @param {string} [props.className] - Additional CSS classes.
 * @param {boolean} [props.disabled] - Whether the button is disabled.
 * @param {boolean} [props.loading] - Whether to show a loading state.
 * @param {object} [props.rest] - Other native button props.
 */
function Button({
  children,
  onClick,
  type = 'button',
  variant = 'filled',
  color = 'primary',
  destructive = false, // Keep for backward compatibility map
  icon,
  iconOnly = false,
  className = '',
  disabled = false,
  loading = false,
  ...rest
}) {
  // Map deprecated 'destructive' prop to color='error'
  const effectiveColor = destructive ? 'error' : color;

  // Map deprecated 'icon' variant if necessary (assuming it meant iconOnly)
  // If the old variant prop value could be 'icon', uncomment and adjust:
  // const effectiveVariant = variant === 'icon' ? 'text' : variant; // Or maybe 'filled'/'tonal'
  // const effectiveIconOnly = iconOnly || variant === 'icon';
  const effectiveVariant = variant;
  const effectiveIconOnly = iconOnly;


  const buttonClasses = [
    styles.button, // Base M3 button styles
    styles[effectiveVariant], // e.g., styles.filled, styles.outlined
    styles[`color${effectiveColor.charAt(0).toUpperCase() + effectiveColor.slice(1)}`], // e.g., styles.colorPrimary, styles.colorError
    effectiveIconOnly ? styles.iconOnly : '',
    loading ? styles.loading : '',
    className,
  ].filter(Boolean).join(' ');

  // Remove props that shouldn't be passed directly to the DOM element
  const {
    loading: _loading,
    destructive: _destructive,
    iconOnly: _iconOnly,
    color: _color, // remove color prop
    variant: _variant, // remove variant prop
    ...buttonProps
  } = rest;

  return (
    <button
      type={type}
      onClick={onClick}
      className={buttonClasses}
      disabled={disabled || loading} // Disable if loading or explicitly disabled
      aria-label={effectiveIconOnly && typeof children === 'string' ? children : undefined} // Use children as aria-label for icon-only buttons if it's a simple string
      {...buttonProps} // Pass remaining native button props
    >
      {/* State Layer */}
      <span className={styles.stateLayer}></span>

      {/* Icon (Loading or Provided) */}
      {loading ? (
        <ArrowPathIcon className={`${styles.icon} ${styles.spinner}`} aria-hidden="true" />
      ) : (
        icon && React.cloneElement(icon, { className: styles.icon, 'aria-hidden': true })
      )}

      {/* Text Content (conditionally rendered for iconOnly) */}
      {!effectiveIconOnly && children && <span className={styles.text}>{children}</span>}

      {/* Accessibility: Visually hide text for icon-only, but keep for screen readers unless aria-label is set */}
      {effectiveIconOnly && children && !buttonProps['aria-label'] && typeof children !== 'string' && (
         <span className={styles.visuallyHidden}>{children}</span>
      )}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  variant: PropTypes.oneOf(['filled', 'tonal', 'outlined', 'text', 'elevated']),
  color: PropTypes.oneOf(['primary', 'secondary', 'tertiary', 'error']),
  destructive: PropTypes.bool, // Keep for compatibility
  icon: PropTypes.element,
  iconOnly: PropTypes.bool,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
};

export default Button; 