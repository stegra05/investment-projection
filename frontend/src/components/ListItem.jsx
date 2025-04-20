import React from 'react';
import styles from './ListItem.module.css';

/**
 * ListItem Component
 * Displays content in a list format, optionally interactive and with secondary actions.
 *
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - The main content of the list item.
 * @param {React.ReactNode} [props.secondaryAction] - Optional elements to display on the right (e.g., buttons, icons).
 * @param {boolean} [props.interactive=false] - If true, applies hover/focus styles.
 * @param {string} [props.className] - Additional class names for the list item.
 * @param {React.ElementType} [props.as='div'] - The HTML element type to render (e.g., 'div', 'button', 'a').
 * @param {() => void} [props.onClick] - Click handler if interactive.
 * @param {string} [props.href] - Href if rendered as an anchor ('a').
 */
const ListItem = ({
  children,
  secondaryAction,
  interactive = false,
  className = '',
  as: Component = 'div',
  onClick,
  href,
  ...rest
}) => {
  const combinedClassName = [
    styles.listItem,
    interactive ? styles.interactive : '',
    className,
  ].filter(Boolean).join(' ');

  const props = {
    className: combinedClassName,
    onClick: interactive ? onClick : undefined,
    href: Component === 'a' ? href : undefined,
    type: Component === 'button' ? 'button' : undefined,
    ...rest,
  };

  return (
    <Component {...props}>
      <div className={styles.content}>{children}</div>
      {secondaryAction && (
        <div className={styles.secondaryAction}>{secondaryAction}</div>
      )}
    </Component>
  );
};

export default ListItem; 