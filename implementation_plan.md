# UI Improvement Implementation Plan

This document outlines the plan to address identified UI issues in the Investment Projection application.

## 1. "Change Details (5)" Title Alignment

*   **Issue:** The title "Change Details (5)" in the middle panel appears slightly misaligned (too far left) with the content cards below it.
*   **Relevant File(s):**
    *   `frontend/src/features/portfolio/components/ChangeDetailsList.js` (Specifically the `<h3>` tag).
*   **Plan:**
    1.  Inspect the CSS applied to the `<h3>` tag (and its parent container) containing "Change Details (...)". Target file: `frontend/src/features/portfolio/components/ChangeDetailsList.js`.
    2.  Adjust `margin-left`, `padding-left`, or use flex/grid alignment properties (e.g., `justify-content` if the parent is a flex container) on the `<h3>` or its container to align it precisely with the start of the content in the cards below. For instance, if cards have a `pl-4`, the title's container might need similar padding or the title itself needs a margin to match.
    3.  Verify that the alignment is visually harmonious with the cards and other elements in the panel.

## 2. Timeline Scroll/Overflow

*   **Issue:** The "Timeline" section on the left might not show a scrollbar if content overflows, potentially hiding entries.
*   **Relevant File(s):**
    *   `frontend/src/features/portfolio/views/ChangesView.js` (The `div` that wraps the `TimelineView` component).
    *   `frontend/src/features/portfolio/components/TimelineView.js` (The main container `div` within this component).
*   **Plan:**
    1.  Identify the primary scrollable container for the Timeline content. This is likely the main `div` within `frontend/src/features/portfolio/components/TimelineView.js` or its immediate parent wrapper in `frontend/src/features/portfolio/views/ChangesView.js`.
    2.  Ensure this container has `overflow-y: auto;` applied via CSS (e.g., Tailwind's `overflow-y-auto`).
    3.  A `max-height` must be set for this container. Use Tailwind's `max-h-[...]` classes (e.g., `max-h-[calc(100vh-Xpx)]`) or custom CSS. `Xpx` should represent the combined height of elements above and below the timeline section within its column (e.g., headers, footers, padding in the parent).
    4.  If using flexbox/grid for the parent layout, ensure the timeline container is allowed to shrink and its content to scroll (e.g., it might need `min-h-0` in a flex column if parents have fixed heights).
    5.  Test with a sufficient number of timeline entries to confirm scrollbar visibility, functionality, and appropriate styling (if custom scrollbars are used project-wide).

## 3. "Projection completed successfully!" Banner

*   **Issue:** The success message banner's placement and persistence could be improved.
*   **Relevant File(s):**
    *   `frontend/src/features/portfolio/pages/PortfolioWorkspacePage.js` (Likely orchestrates the projection and would trigger this message).
    *   `frontend/src/components/Notification/Notification.js` or a similar global messaging component (if one exists and is preferred for transient messages).
    *   `frontend/src/components/AlertMessage/AlertMessage.js` (If currently used for this banner).
*   **Plan:**
    1.  **Convert to Toast/Notification System:**
        *   Locate the logic that triggers this message after a successful projection, likely within `frontend/src/features/portfolio/pages/PortfolioWorkspacePage.js` or a related service/hook.
        *   Replace the current banner (potentially rendered using `frontend/src/components/AlertMessage/AlertMessage.js`) with a call to a global notification/toast system. If a `Notification.js` component or a `useNotification` hook exists and is suitable for transient messages, utilize it. Otherwise, consider implementing a standard toast notification pattern.
        *   The notification should:
            *   Automatically dismiss after a short duration (e.g., 3-5 seconds).
            *   Provide a close button (e.g., an 'x' icon) for manual dismissal.
    2.  **Styling and Placement:**
        *   Ensure the toast is clearly styled as a success message (e.g., green background, success icon).
        *   Position it in a non-obtrusive location, such as the top-right or bottom-right corner of the screen, consistent with common UX patterns for notifications.

## 4. Button Consistency in "Projection Setup"

*   **Issue:** The "Run Projection" button might have a slightly different style compared to the year selection buttons ("1Y", "2Y", etc.).
*   **Relevant File(s):**
    *   `frontend/src/features/portfolio/pages/PortfolioWorkspacePage.js` (Or the specific component rendering the "Projection Setup" panel).
    *   `frontend/src/components/Button/Button.js` (The shared button component).
*   **Plan:**
    1.  In the "Projection Setup" panel (likely within `frontend/src/features/portfolio/pages/PortfolioWorkspacePage.js`), examine the JSX for the "Run Projection" button and the year selection buttons ("1Y", "2Y", etc.).
    2.  Verify that all these buttons use the shared `frontend/src/components/Button/Button.js` component.
    3.  Inspect the props passed to each `Button` instance (e.g., `variant`, `colorScheme`, `size`, `className`).
    4.  **Achieve Consistency:**
        *   If year buttons and "Run Projection" are both primary actions, they should share the same primary variant and styling. Standardize the props to achieve this.
        *   If year buttons are considered secondary or selection options, and "Run Projection" is the main call-to-action, they can have distinct but harmonious styles (e.g., year buttons might use an outline variant of the primary color, while "Run Projection" uses a solid fill). The goal is visual consistency and clear affordance.
    5.  If necessary, update `Button.js` to offer appropriate variants or ensure its existing variants can produce the desired consistent look without ad-hoc styling.

## 5. "Portfolio Value" Label Placement on Chart

*   **Issue:** The "Portfolio Value" label below the chart could be better integrated or made more prominent.
*   **Relevant File(s):**
    *   `frontend/src/features/portfolio/pages/PortfolioWorkspacePage.js` (Or the component responsible for rendering the chart).
    *   The charting library's configuration options if a third-party library is used.
*   **Plan:**
    1.  Identify the chart rendering component within `frontend/src/features/portfolio/pages/PortfolioWorkspacePage.js` and how its labels/legend are configured. Note the charting library used (if any).
    2.  **Option A (Integrate into Legend):**
        *   Consult the charting library's documentation (e.g., Chart.js, Recharts).
        *   Configure the library to include "Portfolio Value" as part of the standard chart legend. This is often the cleanest solution if the library supports it well.
    3.  **Option B (Improve Standalone Label Prominence):**
        *   If it must remain a standalone label:
            *   Increase its font size and ensure it has sufficient contrast against the background.
            *   Position it more intentionally, e.g., as a clear title for the Y-axis, or as a subtitle for the chart if it's a single-series chart.
    4.  The small arrow pointing to the line should be removed if the label's association is made clear through direct legend integration (Option A) or improved placement (Option B). The goal is to rely on standard chart conventions.

## 6. Data Density in "Change Details" Cards

*   **Issue:** The "Change Details" cards are information-dense and could improve scannability. The "No Description" text is repetitive.
*   **Relevant File(s):**
    *   `frontend/src/features/portfolio/components/ChangeItemCard.js`.
*   **Plan:**
    1.  **Improve Visual Hierarchy & Scannability in `frontend/src/features/portfolio/components/ChangeItemCard.js`:**
        *   Review and refine CSS (Tailwind classes or custom styles).
        *   **Spacing:** Increase `margin` and `padding` between distinct pieces of information within the card (e.g., title, date/amount line, recurrence info, description) to create better visual separation. Use a consistent spacing scale.
        *   **Typography:** Differentiate labels (e.g., "Amount:", "Frequency:") from their values using font weight (e.g., `font-semibold` for labels, `font-normal` for values) or subtle color variations (e.g., a slightly lighter color for labels).
        *   **Alignment:** Ensure consistent alignment for label-value pairs.
    2.  **Handle "No Description" Text:**
        *   In `ChangeItemCard.js`, modify the rendering logic for the `change.description` field.
        *   If `change.description` is null, undefined, or an empty string:
            *   **Option 1 (Subtle Placeholder):** Render an italicized, lighter gray placeholder like "*No description provided*" or simply "*None*".
            *   **Option 2 (Omit):** If descriptions are frequently absent and not critical for a quick overview, consider not rendering the description section at all to save space and reduce clutter.
        *   Regardless of visual rendering, if the description exists, ensure it's available via the `title` attribute on the card's main title element (e.g., `<h4>`) for tooltip accessibility.

## 7. Filter Controls - "Search descrip" Placeholder

*   **Issue:** The placeholder text "Search descrip" in the Filters section is abrupt.
*   **Relevant File(s):**
    *   `frontend/src/features/portfolio/components/ChangeFilters.js`.
*   **Plan:**
    1.  In `frontend/src/features/portfolio/components/ChangeFilters.js`, locate the `Input` component used for filtering by description.
    2.  Update the `placeholder` prop to a more descriptive and user-friendly string, such as `"Search by description"` or `"Search description..."`.

## 8. "Initial Total Value ($)" Label Wrapping

*   **Issue:** The label "Initial Total Value ($)" in "Projection Setup" wraps to two lines, which could be tidied.
*   **Relevant File(s):**
    *   `frontend/src/features/portfolio/pages/PortfolioWorkspacePage.js` (Or the component rendering the "Projection Setup" panel).
*   **Plan:**
    1.  Locate the label element for "Initial Total Value ($)" within the "Projection Setup" panel (likely in `frontend/src/features/portfolio/pages/PortfolioWorkspacePage.js` or a sub-component).
    2.  **Option 1 (Preferred - Shorten Text):** Change the label text to a more concise version that fits on one line without sacrificing clarity, e.g., "Initial Value ($)", "Starting Value ($)", or "Total Initial Value ($)".
    3.  **Option 2 (CSS Adjustment - If text must remain long):**
        *   Adjust the layout of the form elements to provide more horizontal space for this specific label. This might involve changing column widths in a grid system or min-width for the label container.
        *   Using `white-space: nowrap;` on the label is an option but should be paired with ensuring its container can accommodate the full width to prevent overflow or layout breakage. Avoid inconsistent font sizes for labels if possible.

## 9. Overall Visual Hierarchy

*   **Issue:** A general point about ensuring the most important information and actions are immediately apparent.
*   **Relevant File(s):**
    *   `frontend/src/features/portfolio/pages/PortfolioWorkspacePage.js` (Primary layout).
    *   Related CSS/styling files or Tailwind utility classes used.
*   **Plan:**
    1.  This is a holistic review to be conducted after implementing the more specific fixes above. Focus on `frontend/src/features/portfolio/pages/PortfolioWorkspacePage.js` and its constituent components.
    2.  Assess the following aspects:
        *   **Emphasis & CTAs:** Are primary actions (e.g., "Run Projection," "Save Scenario") immediately obvious and visually distinct (e.g., using primary button styles, prominent placement)?
        *   **Grouping & Structure:** Are related elements and sections clearly grouped using techniques like cards, borders, background color variations, and adequate spacing? Does the layout guide the user's eye logically?
        *   **Consistency:** Is there a consistent application of typography (font families, sizes, weights), color palette, spacing units, and component styling (buttons, inputs, cards) across the entire page and its different panels?
        *   **Readability & Scannability:** Is text easy to read? Is information presented in a way that allows users to quickly scan and find what they need?
    3.  **Refinements:**
        *   Make minor CSS adjustments (tweaking Tailwind utility classes or custom CSS) to enhance clarity, balance, and visual appeal.
        *   Pay attention to consistent use of a spacing scale (e.g., multiples of 4px or 8px) for margins, paddings, and gaps between elements to achieve a harmonious rhythm. 