import React from 'react';

// Assuming styles object is passed from the parent

export default function ProjectionSectionHeader({ styles }) {
    return (
        <header className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Projection</h2>
        </header>
    );
} 