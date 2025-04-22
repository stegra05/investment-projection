import React from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Button from './Button';

// Assuming styles are passed down or defined/imported here if specific
// If styles object is passed, use props.styles.className
// If specific class names are expected, adjust accordingly
// Let's assume the parent passes the styles object for flexibility

export default function PortfolioPageHeader({ 
    portfolioName, 
    portfolioDescription, 
    onEdit, 
    onDelete, 
    disabled, 
    styles // Expecting the CSS module 'styles' object from the parent
}) {
    return (
        <header className={styles.pageHeader}>
            <div>
                <h1 className={styles.pageTitle}>{portfolioName}</h1>
                {portfolioDescription && (
                    <p className={styles.portfolioDescription}>{portfolioDescription}</p>
                )}
            </div>
            <div className={styles.headerActions}>
                <Button
                    variant="tonal"
                    onClick={onEdit} // Parent passes the complete handler
                    icon={<PencilIcon />}
                    disabled={disabled}
                >
                    Edit Portfolio
                </Button>
                <Button
                    variant="filled"
                    color="error"
                    onClick={onDelete}
                    icon={<TrashIcon />}
                    disabled={disabled}
                >
                    Delete Portfolio
                </Button>
            </div>
        </header>
    );
} 