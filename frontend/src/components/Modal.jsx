import React, { useEffect, useRef, useCallback } from 'react';
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
  const modalRef = useRef(null); // Ref for the modal content div
  const triggerRef = useRef(null); // Ref to store the element that opened the modal

  // Helper to find focusable elements within a node
  const getFocusableElements = useCallback((node) => {
    if (!node) return [];
    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(node.querySelectorAll(focusableSelector)).filter(
      (el) => el.offsetParent !== null // Ensure element is visible
    );
  }, []);

  // Focus trapping and Escape key handler
  const handleKeyDown = useCallback(
    (event) => {
      if (!modalRef.current) return;

      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements(modalRef.current);
        if (focusableElements.length === 0) {
            event.preventDefault(); // No focusable elements, prevent tabbing out
            return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const currentElement = document.activeElement;

        if (!event.shiftKey && currentElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        } else if (event.shiftKey && currentElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!modalRef.current.contains(currentElement)) {
          // If focus somehow escaped, bring it back to the first element
          event.preventDefault();
          firstElement.focus();
        }
      }
    },
    [onClose, getFocusableElements]
  );

  // Effect for focus management on open/close
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element before opening the modal
      triggerRef.current = document.activeElement;

      const modalNode = modalRef.current;

      // Use a short timeout to allow the modal and its content to render/animate
      const timerId = setTimeout(() => {
        if (!modalNode) return;

        const focusableElements = getFocusableElements(modalNode);
        const firstFocusable = focusableElements.length > 0 ? focusableElements[0] : modalNode; // Fallback to modal itself

        firstFocusable?.focus();

        // Add keydown listener for focus trapping and escape key
        document.addEventListener('keydown', handleKeyDown);
      }, 50); // Small delay (adjust if needed)

      // Cleanup function
      return () => {
        clearTimeout(timerId);
        document.removeEventListener('keydown', handleKeyDown);

        // Return focus to the element that opened the modal
        if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
           triggerRef.current.focus();
        }
        triggerRef.current = null; // Clear the ref
      };
    } else {
      // Ensure listener is removed if modal is closed externally
      document.removeEventListener('keydown', handleKeyDown);
      // Ensure triggerRef is cleared if closed while not focused inside
      if (triggerRef.current && !modalRef.current?.contains(document.activeElement)) {
          triggerRef.current = null;
      }
    }
  }, [isOpen, getFocusableElements, handleKeyDown]);

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
          transition={{ duration: 0.2 }} // Faster fade for backdrop
          aria-modal="true" // Indicate it's a modal
          role="dialog" // Role for accessibility
          aria-labelledby={title ? 'modal-title' : undefined}
        >
          <motion.div
            ref={modalRef}
            className={styles.modalContent}
            onClick={handleContentClick}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            tabIndex={-1} // Make the modal container focusable programmatically if needed
          >
            <header className={styles.modalHeader}>
              {title && <h2 id="modal-title" className={styles.modalTitle}>{title}</h2>}
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