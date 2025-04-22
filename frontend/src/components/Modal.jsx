import React from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Import Framer Motion
import styles from './Modal.module.css'; // Create this CSS module next
import { XMarkIcon } from '@heroicons/react/24/outline';

// Define animation variants
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } // Faster exit easing
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.2, 0, 0, 1] } // Emphasized entry easing
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } // Consistent exit easing
  },
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) {
    return null;
  }

  // Prevent clicks inside the modal from closing it
  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          onClick={onClose}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.3 }} // Simple fade for backdrop
        >
          <motion.div
            className={styles.modalContent}
            onClick={handleContentClick}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <header className={styles.modalHeader}>
              {title && <h2 className={styles.modalTitle}>{title}</h2>}
              <button onClick={onClose} className={styles.closeButton} aria-label="Close modal">
                <XMarkIcon className={styles.closeIcon} />
              </button>
            </header>
            <div className={styles.modalBody}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal; 