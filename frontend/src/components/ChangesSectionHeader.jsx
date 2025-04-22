import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import Button from './Button';

// Assuming styles object is passed from the parent

export default function ChangesSectionHeader({ 
    onAddChange, 
    disabled, 
    styles 
}) {
    return (
        <header className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Planned Changes</h2>
            <Button
                variant="primary"
                onClick={onAddChange}
                icon={<PlusIcon />}
                disabled={disabled}
            >
                Add Change
            </Button>
        </header>
    );
} 