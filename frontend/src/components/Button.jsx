import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for routing
import styles from './Button.module.css';

/**
 * Button Component
 * Renders a styled button with different variants and states.
 * Can also render as a link.
 *
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - The content of the button.
 * @param {() => void} [props.onClick] - Click handler for button actions.
 * @param {'button' | 'submit' | 'reset'} [props.type='button'] - Button type attribute.
 * @param {'primary' | 'secondary' | 'destructive'} [props.variant='primary'] - Button style variant.
 * @param {boolean} [props.disabled=false] - If true, disables the button.
 * @param {string} [props.className] - Additional class names for the button.
 * @param {string} [props.to] - If provided, renders the button as a React Router Link.
 * @param {React.ElementType} [props.as] - Optional: Render as a different HTML element (e.g., 'a'). href prop needed if 'a'.
 * @param {string} [props.href] - Href if rendered as an anchor ('a').
 * @param {React.ReactNode} [props.iconLeft] - Optional icon element to display to the left of the text.
 * @param {React.ReactNode} [props.iconRight] - Optional icon element to display to the right of the text.
 */
const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = '',
  to,
  as,
  href,
  iconLeft,
  iconRight,
  ...rest
}) => {
  const combinedClassName = [
    styles.button,
    styles[variant],
    className,
  ].filter(Boolean).join(' ');

  const content = (
    <>
      {iconLeft}
      {children}
      {iconRight}
    </>
  );

  // Render as React Router Link if 'to' prop is provided
  if (to) {
    return (
      <Link
        to={to}
        className={combinedClassName}
        // Pass disabled state for potential styling/logic if needed
        // aria-disabled={disabled} // Link doesn't have disabled, use aria
        onClick={disabled ? (e) => e.preventDefault() : onClick} // Prevent click if disabled
        {...rest}
      >
        {content}
      </Link>
    );
  }

  // Render as a custom element type (e.g., 'a') if 'as' prop is provided
  if (as) {
    const Component = as;
    return (
      <Component
        className={combinedClassName}
        onClick={onClick}
        href={href} // Important for 'a' tags
        // Add aria-disabled for accessibility on non-button elements
        aria-disabled={disabled}
        {...rest}
      >
        {content}
      </Component>
    );
  }

  // Default render as a button element
  return (
    <button
      type={type}
      className={combinedClassName}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {content}
    </button>
  );
};

export default Button; 