import React, { useState } from 'react';
import styles from './Tooltip.module.css';

/**
 * Tooltip Component
 * Displays a text tooltip when the user hovers over its child element.
 *
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - The element that triggers the tooltip on hover.
 * @param {string} props.text - The text content to display in the tooltip.
 * @param {'top' | 'bottom' | 'left' | 'right'} [props.position='top'] - Position of the tooltip relative to the child.
 */
export default function Tooltip({ children, text, position = 'top' }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className={styles.tooltipContainer}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)} // Added for keyboard accessibility
      onBlur={() => setIsVisible(false)} // Added for keyboard accessibility
      tabIndex={0} // Make the container focusable if the child isn't inherently
    >
      {children}
      {isVisible && (
        <div className={`${styles.tooltipBox} ${styles[position]}`}>
          {text}
        </div>
      )}
    </div>
  );
} 