import React from 'react';
import PropTypes from 'prop-types';
import styles from './Button.module.css';

const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'default',
  isActive = false,
  disabled = false,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const buttonClasses = `
    ${styles.button} 
    ${styles[variant]}
    ${styles[size] || styles['default']}
    ${isActive && styles[`${variant}Active`] ? styles[`${variant}Active`] : ''}
    ${fullWidth ? styles.fullWidth : ''} 
    ${className}
  `.trim();

  return (
    <button className={buttonClasses} onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'outline-select', 'tertiary']),
  size: PropTypes.oneOf(['default', 'small']),
  isActive: PropTypes.bool,
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
};

export default Button;
