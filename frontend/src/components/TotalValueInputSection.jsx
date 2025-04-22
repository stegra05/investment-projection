import React from 'react';
import Input from './Input'; // Assuming Input component is in the same directory or adjust path

// Assuming styles object is passed from the parent

export default function TotalValueInputSection({ 
    value, 
    onChange, 
    id = "manualTotalValue", // Default ID, can be overridden by props
    label = "Enter Total Portfolio Value",
    placeholder = "e.g., 10000.00",
    step = "0.01",
    note = "This value is used to calculate individual asset values based on their allocation percentages for the chart below.",
    disabled,
    styles 
}) {
    return (
        <section className={`${styles.section} ${styles.manualValueSection}`}>
            <Input
                label={label}
                id={id}
                type="number"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                step={step}
                disabled={disabled}
            />
            {note && <p className={styles.inputNote}>{note}</p>}
        </section>
    );
} 