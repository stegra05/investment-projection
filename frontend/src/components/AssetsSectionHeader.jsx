import React from 'react';
import { PlusIcon, ArrowPathIcon as SaveIcon } from '@heroicons/react/24/outline';
import Button from './Button';

// Assuming styles object is passed from the parent

export default function AssetsSectionHeader({
    totalCurrentAllocation,
    allocationsChanged,
    onSaveAllocations,
    isSavingAllocations,
    onAddAsset,
    disabled, // General disabled state for buttons (e.g., while other actions are processing)
    styles
}) {
    // Disable save specifically if total is not 100% (within tolerance)
    const isSaveDisabled = disabled || Math.abs(totalCurrentAllocation - 100) > 0.01;
    // Disable add asset if any action is processing
    const isAddDisabled = disabled;

    return (
        <header className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Assets & Allocation</h2>
            <div className={styles.assetHeaderActions}> {/* Container for buttons */}
                {/* Display Total Allocation and Save Button */}
                <div className={styles.allocationSummary}>
                    <span className={`${styles.totalAllocationLabel} ${Math.abs(totalCurrentAllocation - 100) > 0.01 ? styles.totalAllocationWarning : ''}`}> {/* Use tolerance */}                        Total Allocation: {totalCurrentAllocation.toFixed(2)}%                    </span>
                    {allocationsChanged && (
                        <Button
                            variant="primary"
                            onClick={onSaveAllocations}
                            icon={<SaveIcon />}
                            disabled={isSaveDisabled} 
                            loading={isSavingAllocations ? true : undefined}
                            className={styles.saveButton} // Add class for specific styling if needed
                        >
                            Save Allocations
                        </Button>
                    )}
                </div>
                <Button
                    variant="primary"
                    onClick={onAddAsset}
                    icon={<PlusIcon />}
                    disabled={isAddDisabled}
                >
                    Add Asset
                </Button>
            </div>
        </header>
    );
} 