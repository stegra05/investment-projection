import React from 'react';
import styles from './FormCommon.module.css';

/**
 * A simple wrapper component to apply common form container styles.
 */
export const FormCommon = ({ children, onSubmit }) => {
  // Render as a form if onSubmit is provided, otherwise a div
  const Tag = onSubmit ? 'form' : 'div';

  return (
    <Tag className={styles.formContainer} onSubmit={onSubmit}>
      {children}
    </Tag>
  );
};

// Export default is not needed if only exporting named component
// export default FormCommon; 