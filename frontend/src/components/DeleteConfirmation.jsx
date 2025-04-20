import React from 'react';
import styles from './DeleteConfirmation.module.css'; // Create this CSS module next

const DeleteConfirmation = ({ itemType, itemName, onConfirm, onCancel, isProcessing }) => {
  return (
    <div className={styles.confirmationContent}>
      <p className={styles.message}>
        Are you sure you want to delete this {itemType}{itemName ? `: "${itemName}"` : ''}?
      </p>
      <div className={styles.buttonGroup}>
        <button 
          onClick={onCancel} 
          disabled={isProcessing} 
          className={`${styles.button} ${styles.cancelButton}`}
        >
          Cancel
        </button>
        <button 
          onClick={onConfirm} 
          disabled={isProcessing} 
          className={`${styles.button} ${styles.confirmButton}`}
        >
          {isProcessing ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
};

export default DeleteConfirmation; 