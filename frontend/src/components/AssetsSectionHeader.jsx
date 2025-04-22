import React from 'react';
import { PlusIcon, ArrowPathIcon as SaveIcon } from '@heroicons/react/24/outline';
import Button from './Button';

// Assuming styles object is passed from the parent

export default function AssetsSectionHeader({
    totalCurrentAllocation,
    allocationsChanged,
    onSaveAllocations,
    isSavingAllocations,
    saveSuccess,
    onAddAsset,
    disabled, // General disabled state for buttons (e.g., while other actions are processing)
    styles
}) {
    // Determine if the total allocation is exactly 100% (within tolerance)
    const isTotal100 = Math.abs(totalCurrentAllocation - 100) <= 0.01;

    // Disable save specifically if total is not 100%, general disable is true, or saving is in progress
    const isSaveDisabled = disabled || !isTotal100 || isSavingAllocations;
    // Disable add asset simply based on the overall disabled state passed from parent
    const isAddDisabled = disabled;

    // Determine class for the total allocation display
    const totalAllocationClasses = [
        styles.totalAllocationLabel,
        !isTotal100 ? styles.totalAllocationWarning : '', // Apply warning if not 100%
        saveSuccess ? styles.totalAllocationSuccess : '' // Apply success if save succeeded and total was 100%
    ].filter(Boolean).join(' '); // Filter out empty strings and join

    return (
        <header className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Assets & Allocation</h2>
            <div className={styles.assetHeaderActions}> {/* Container for buttons */}
                {/* Display Total Allocation, Progress Bar, and Save Button */}
                <div className={styles.allocationSummary}>
                    {/* Container for text and progress bar */}
                    <div className={styles.allocationDisplay}>
                        <span className={totalAllocationClasses}>
                            Total Allocation: {totalCurrentAllocation.toFixed(2)}%
                        </span>
                        {/* Simple Progress Bar */}
                        <div className={styles.progressBarContainer}>
                            <div
                                className={styles.progressBarFill}
                                style={{ width: `${Math.min(totalCurrentAllocation, 100)}%` }} // Cap width at 100%
                                role="progressbar"
                                aria-valuenow={totalCurrentAllocation}
                                aria-valuemin="0"
                                aria-valuemax="100"
                                aria-label="Total allocation progress"
                            ></div>
                        </div>
                    </div>
                    {/* Save Button (conditionally rendered) */}
                    {allocationsChanged && (
                        <Button
                            variant="filled"
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
                    variant="filled"
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