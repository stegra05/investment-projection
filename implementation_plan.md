# Implementation Plan: "Overview & Settings" View

This document outlines the implementation steps for the "Overview & Settings" view, based on the "Visionary Plan for 'Overview & Settings' View" (`plan_outline.md`).

## 1. UX/Interactivity

The "Overview & Settings" area aims to be an intuitive hub, providing a clear portfolio summary and access to essential application-wide configurations, aligning with the "Clear, Professional, Guiding" tone.

### 1.1. Portfolio Summary (Overview)

**Context:** Upon navigation, users should immediately see a concise summary of the active portfolio, supporting the **Visibility of System Status heuristic**.

1.  **Display Key Portfolio Metrics**
    *   `[x]` Fetch and display `portfolio_id`, `name`, `description`, `created_at`, `updated_at`.
    *   `[x]` Calculate and display `totalValue` (dynamically). This provides immediate context and key details to the user.
    *   **Relevant Files & Context:**
        *   Main Component: `frontend/src/features/portfolio/views/OverviewSettingsView.js`
        *   API for data fetching: `frontend/src/api/portfolioService.js` (Extend or create)
        *   Backend Schema: `backend/app/schemas/portfolio_schemas.py` (Create if not existing; Reference `PortfolioSchema`, `PortfolioSummarySchema` for data structure)
        *   State Management: `frontend/src/store/portfolioListStore.js` (Create if not existing; Or relevant state store for portfolio data)
        *   Parent Container: `frontend/src/components/Layout/Layout.js` (Assumed to exist or be correctly planned within `Layout/` directory)

2.  **Editable Portfolio Name and Description**
    *   `[x]` Implement in-place editing (text transforms to input on click) or a lightweight modal dialog for `name` and `description`. This supports the **User Control and Freedom heuristic**, allowing easy data modification.
    *   `[x]` Handle API calls to save changes to the backend.
    *   `[x]` Provide immediate user feedback on save operations (success/failure notifications).
    *   **Relevant Files & Context:**
        *   Main Component: `frontend/src/features/portfolio/views/OverviewSettingsView.js`
        *   Input Component: `frontend/src/components/Input/Input.js` (Assumed to exist within `Input/` directory)
        *   Modal Component: `frontend/src/components/Modal/Modal.js` (Assumed to exist within `Modal/` directory; If using modal approach)
        *   API for updates: `frontend/src/api/portfolioService.js`
        *   Backend Route: `backend/app/routes/portfolios.py` (Create if not existing; Or relevant update endpoint, e.g., `PUT /portfolios/{portfolio_id}`)
        *   Notification/Alert: `frontend/src/components/Notification/NotificationContainer.js` (Assumed to exist within `Notification/` directory), `frontend/src/components/AlertMessage/AlertMessage.js` (Assumed to exist within `AlertMessage/` directory)

3.  **High-Level Analytics Snippet (Should-have)**
    *   `[x]` If Risk Profile (`SH-AN1`) or Performance Tracking (`SH-AN2`) features are implemented, display a small, non-interactive key metric (e.g., overall risk score, mini-chart of recent performance). This acts as an informative teaser, aligning with the **Recognition Over Recall heuristic** by surfacing important data without requiring separate navigation.
    *   **Relevant Files & Context:**
        *   Main Component: `frontend/src/features/portfolio/views/OverviewSettingsView.js`
        *   Analytics Component: `frontend/src/features/dashboard/components/AnalyticsWidget.js` (Create or adapt for this snippet)
        *   API for analytics data: `frontend/src/api/analyticsService.js` (Create or extend if separate, or extend portfolio API)

### 1.2. Application Settings (Settings)

**Context:** This section should be clearly delineated from the portfolio-specific overview (e.g., distinct card or sub-area).

1.  **Inflation Rate Input (`SH-INF1`)**
    *   `[x]` Create a clearly labeled input field for the user to specify and save a default annual inflation rate.
    *   `[x]` Implement saving functionality for this setting, persisting it for the user.
    *   `[x]` Ensure this rate is available for projection calculations to show 'real terms' values, providing a more realistic financial outlook.
    *   **Relevant Files & Context:**
        *   Main Component: `frontend/src/features/portfolio/views/OverviewSettingsView.js`
        *   Input Component: `frontend/src/components/Input/Input.js` (Assumed to exist within `Input/` directory)
        *   State Management: `frontend/src/store/settingsSlice.js` (Create if not existing; For application-wide settings like inflation rate)
        *   API for saving: `frontend/src/api/settingsApi.js` (Create or extend for user settings)
        *   Backend Model/Service: `backend/app/models/user.py` (Extend to include user settings, or create a separate user_settings.py file)

2.  **Theme/Appearance (Could-have)**
    *   `[ ]` If minor theme adjustments (e.g., high-contrast mode for accessibility) are planned, implement controls here. This would be the logical placement for such user preferences.
    *   **Relevant Files & Context:**
        *   Main Component: `frontend/src/features/portfolio/views/OverviewSettingsView.js`
        *   Styling: `frontend/tailwind.config.js`, `frontend/src/styles/index.css` (For theme variables, or create theme.js if needed)
        *   Theme Hook: `frontend/src/hooks/useTheme.js` (Create if not existing; If a custom hook is used for managing themes)

3.  **Data Management (Could-have)**
    *   `[ ]` Implement "Export All Data" (`C-2`) functionality, allowing users to download their information.
    *   `[ ]` Implement "Delete Account" functionality. This action should be clearly marked and require explicit confirmation due to its significance.
    *   **Relevant Files & Context:**
        *   Main Component: `frontend/src/features/portfolio/views/OverviewSettingsView.js`
        *   Button Component: `frontend/src/components/Button/Button.js` (Assumed to exist within `Button/` directory)
        *   Modal Component: `frontend/src/components/Modal/ConfirmationModal.js` (For "Delete Account" confirmation)
        *   API: `frontend/src/api/dataManagementApi.js` (Create if not existing; for export/delete operations)
        *   Backend Services: `backend/app/services/export_service.py` (Create if not existing; For data export logic), `backend/app/services/user_service.py` (Create if not existing; For account deletion logic)

### 1.3. Task Flow Considerations

1.  **Clear Segregation**
    *   `[ ]` Ensure visual and conceptual distinction between portfolio-specific settings (e.g., name, description) and application-wide settings (e.g., inflation rate). This avoids user confusion.
    *   **Relevant Files & Context:**
        *   Layout/Design in `frontend/src/features/portfolio/views/OverviewSettingsView.js` (Utilize cards or distinct sections)

2.  **Saving Feedback**
    *   `[ ]` Implement immediate and clear feedback (e.g., notifications, button state changes) for all save operations. This supports the **Visibility of System Status heuristic**, confirming to the user that actions were processed.
    *   **Relevant Files & Context:**
        *   Main Component: `frontend/src/features/portfolio/views/OverviewSettingsView.js`
        *   Feedback Components: `frontend/src/components/Notification/NotificationContainer.js` (Assumed to exist within `Notification/` directory), `frontend/src/components/AlertMessage/AlertMessage.js` (Assumed to exist within `AlertMessage/` directory)

## 2. Design/Aesthetics (Data-Focused Flat 2.0)

**Overall Goal:** Embody the "Data-Focused Flat 2.0" aesthetic, emphasizing clarity, order, and purposeful use of visual elements. The design should be clean, professional, and make data easily digestible.

### 2.1. Layout & Structure

1.  **Card-like Containers**
    *   `[ ]` Use clean, card-like containers for "Portfolio Summary" and "Application Settings" sections to achieve visual separation and organization.
    *   `[ ]` Employ subtle borders (e.g., `border-gray-200` from `tailwind.config.js`) or background shades (e.g., `bg-gray-50` if main panel is `bg-white`) for separation, aligning with Flat Design principles by avoiding heavy shadows.
    *   **Relevant Files & Context:**
        *   Styling in `frontend/src/features/portfolio/views/OverviewSettingsView.js` (using Tailwind CSS classes)
        *   Tailwind Config: `frontend/tailwind.config.js` (Verify/use `theme.colors.gray`, `theme.extend.backgroundColor`, `theme.borderColor`)

2.  **Information Hierarchy & Whitespace**
    *   `[ ]` Strategically use whitespace (negative space) to improve readability, create visual balance, and guide the user's eye to important information. This is a hallmark of minimalist-inspired and data-focused design.
    *   `[ ]` Ensure key data (portfolio name, total value, dates) has visual prominence through size, weight, or placement within the "Portfolio Summary" card.
    *   **Relevant Files & Context:**
        *   Styling in `frontend/src/features/portfolio/views/OverviewSettingsView.js` (using Tailwind CSS margin/padding utilities)

### 2.2. Typography

1.  **Consistent Font Usage**
    *   `[ ]` Consistently use the `Inter` sans-serif font family (defined in `tailwind.config.js`) due to its high readability, essential for a data-focused UI.
    *   **Relevant Files & Context:**
        *   Tailwind Config: `frontend/tailwind.config.js` (Ensure `theme.fontFamily.sans` includes `Inter` and is applied as default)
        *   Global Styles: `frontend/src/styles/global.css` (Ensure `Inter` font is correctly imported and applied body-wide; Create if not existing or ensure part of an equivalent global style setup)

2.  **Typographic Scale**
    *   `[ ]` Implement a clear and consistent typographic scale for headings (e.g., "Portfolio Overview"), sub-headings (e.g., "Default Inflation Rate"), labels, and data values. This reinforces visual hierarchy and aids scannability (e.g., labels medium weight, data regular weight).
    *   **Relevant Files & Context:**
        *   Styling in `frontend/src/features/portfolio/views/OverviewSettingsView.js`
        *   Tailwind Config: `frontend/tailwind.config.js` (Verify/use `theme.colors.primary` and its shades)

### 2.3. Color Palette

1.  **Primary Accent Color**
    *   `[ ]` Use the defined primary blue (e.g., `primary-600` from `tailwind.config.js`) purposefully for key interactive elements (buttons, edit icons) and to subtly highlight main section headings. This aligns with Flat Design's strategic use of bold color.
    *   **Relevant Files & Context:**
        *   Styling in `frontend/src/features/portfolio/views/OverviewSettingsView.js`
        *   Tailwind Config: `frontend/tailwind.config.js` (Verify/use `theme.colors.primary` and its shades)

2.  **Neutral Dominance**
    *   `[ ]` Dominate the palette with neutral grays (e.g., `text-gray-800` for primary text, `text-gray-600` for labels, `bg-white` or `bg-gray-50` for surfaces) as defined in `tailwind.config.js`. This creates a clean, professional backdrop, allowing data and key actions to stand out, characteristic of data-focused design.
    *   **Relevant Files & Context:**
        *   Styling in `frontend/src/features/portfolio/views/OverviewSettingsView.js`
        *   Tailwind Config: `frontend/tailwind.config.js` (Verify/use `theme.colors.gray`, `theme.textColor`, `theme.backgroundColor`)

### 2.4. Interactive Elements & Forms

1.  **In-Place Editing Styling**
    *   `[ ]` Style input fields for in-place editing with a clean, subtle Flat 2.0 look: light border, with focus state changing border color (e.g., to `primary-500`) or adding a subtle ring.
    *   **Relevant Files & Context:**
        *   Styling in `frontend/src/features/portfolio/views/OverviewSettingsView.js`
        *   Input Component: `frontend/src/components/Input/Input.js` (Assumed to exist within `Input/` directory; May need variants or prop-based styling for in-place editing context)

2.  **Inflation Rate Input Styling**
    *   `[ ]` Ensure the inflation rate input field is visually consistent with other input fields across the application (e.g., those in `AddAssetForm.js`, `Select.js`), maintaining a cohesive UI.
    *   **Relevant Files & Context:**
        *   Component: `frontend/src/components/Input/Input.js` (Assumed to exist within `Input/` directory; Ensure its default styling is appropriate)
        *   Reference: `frontend/src/features/portfolio/components/AddAssetForm.js` (Assumed to exist or be created), `frontend/src/components/Select/Select.js` (Assumed to exist within `Select/` directory) for styling consistency.

3.  **Button Styling**
    *   `[ ]` Style "Save" buttons as clear calls-to-action using the primary color (e.g., `bg-primary-600 text-white`), consistent with other primary action buttons in the application.
    *   **Relevant Files & Context:**
        *   Button Component: `frontend/src/components/Button/Button.js` (Assumed to exist within `Button/` directory; Ensure variants exist for primary actions or can be styled via props)
        *   Tailwind Config: `frontend/tailwind.config.js` (Colors like `primary-600` should be defined)

### 2.5. Flat 2.0 Nuances

1.  **Subtle Shadows (Optional)**
    *   `[ ]` If necessary to visually lift main content cards, sparingly use very subtle shadows (e.g., `boxShadow.sm` or `md` from `tailwind.config.js`). However, prefer separation via spacing and subtle color differentiation to maintain the clean, flat look.
    *   **Relevant Files & Context:**
        *   Styling in `frontend/src/features/portfolio/views/OverviewSettingsView.js`
        *   Tailwind Config: `frontend/tailwind.config.js` (Verify/use `theme.extend.boxShadow` if shadows are used)

### 2.6. Consistency with Other Views

1.  **Cohesive Styling**
    *   `[ ]` Ensure styling (fonts, colors, spacing, component appearance) is consistent with `AssetsView.js`, `ChangesView.js`, and other parts of `MainContentPanel.js`. This supports the **Consistency and Standards heuristic**, providing a predictable user experience.
    *   `[ ]` Use heading styles consistently (e.g., "Portfolio Overview" should match the style of `HEADING_EXISTING_ASSETS` if it's a top-level heading in the panel).
    *   **Relevant Files & Context:**
        *   Main Component: `frontend/src/features/portfolio/views/OverviewSettingsView.js`
        *   Reference Views: `frontend/src/features/portfolio/views/AssetsView.js` (Assumed to exist or be created), `frontend/src/features/portfolio/views/ChangesView.js` (Assumed to exist or be created)
        *   Layout: `frontend/src/components/Layout/MainContentPanel.js`
        *   Constants: `frontend/src/constants/textConstants.js` (Create if not existing; For `HEADING_EXISTING_ASSETS` and other shared text)

## 3. Animation

**Overall Principle:** Animations must be purposeful, subtle, and performant, enhancing usability and providing clear feedback without causing distraction. They should primarily serve to clarify, provide feedback, or smooth transitions.

### 3.1. Loading States for Data

1.  **Subtle Loading Animation**
    *   `[ ]` Implement a shimmer effect for placeholder text areas or a minimalist spinner during data fetching. This provides **Visibility of System Status** and manages user expectations during delays. Animation should be brief and unobtrusive.
    *   **Relevant Files & Context:**
        *   Main Component: `frontend/src/features/portfolio/views/OverviewSettingsView.js` (Wrap data display areas with loading state logic)
        *   Spinner: `frontend/src/components/Spinner/Spinner.js` (Assumed to exist within `Spinner/` directory)
        *   Skeleton/Shimmer: `frontend/src/components/SkeletonLoader/SkeletonLoader.js` (Create if not existing, for a shimmer effect on text blocks)

### 3.2. In-Place Editing Transitions

1.  **Smooth State Change**
    *   `[ ]` For in-place editable fields (e.g., portfolio name), implement a quick cross-fade animation (e.g., 150-200ms, ease-out curve) for the text-to-input transition. This makes the state change less jarring for the user.
    *   **Relevant Files & Context:**
        *   Main Component: `frontend/src/features/portfolio/views/OverviewSettingsView.js`
        *   Animation: CSS Transitions/Animations or a library like Framer Motion for smooth visual state changes.

### 3.3. Feedback on Saving Settings

1.  **Button Feedback**
    *   `[ ]` Implement tactile feedback on "Save Settings" button: a slight press-down effect (e.g., `transform: scale(0.98)`) and a quick color transition on click. This provides immediate interaction confirmation.
    *   **Relevant Files & Context:**
        *   Button Component: `frontend/src/components/Button/Button.js` (Assumed to exist within `Button/` directory; Enhance with press/active state styling or animation)
        *   Animation: CSS Transitions/Animations (e.g., `transition-transform`, `transition-colors`) or Framer Motion for interactive feedback.

2.  **Save Success Animation**
    *   `[ ]` Briefly display a checkmark icon on the button or a fade-in success message/notification upon successful save. This reinforces the successful action and aligns with providing clear success confirmation (related to the **Error Prevention heuristic**).
    *   **Relevant Files & Context:**
        *   Main Component: `frontend/src/features/portfolio/views/OverviewSettingsView.js` (Trigger based on API response)
        *   Notification: `frontend/src/components/Notification/Notification.js` (Assumed to exist within `Notification/` directory; For success messages)
        *   Button Component: `frontend/src/components/Button/Button.js` (Assumed to exist within `Button/` directory; Potentially show an icon within the button)
        *   Animation: Framer Motion or CSS for fade-in effects.

### 3.4. Transitions Between Sub-Sections (If Applicable)

1.  **Smooth Sub-section Transitions**
    *   `[ ]` If "Portfolio Summary" and "Application Settings" are distinct, switchable sub-sections (e.g., tabs), use a quick fade or subtle slide animation (e.g., 200-300ms). This helps maintain user context during the state change.
    *   **Relevant Files & Context:**
        *   Main Component: `frontend/src/features/portfolio/views/OverviewSettingsView.js` (If using tabs or similar switchable UI)
        *   Animation: Framer Motion or CSS for fade/slide transitions between content blocks.

### 3.5. Error State Animations

1.  **Gentle Error Indication**
    *   `[ ]` Animate error messages (e.g., from `AlertMessage.js`) with a subtle shake or soft pop to gently draw attention. This aids the **Help Users Recognize, Diagnose, and Recover from Errors heuristic**.
    *   **Relevant Files & Context:**
        *   Alert Component: `frontend/src/components/AlertMessage/AlertMessage.js` (Assumed to exist within `AlertMessage/` directory; Enhance with a subtle animation on appearance)
        *   Animation: Framer Motion or CSS (e.g., keyframe animation for shake).

## 4. Content (Microcopy)

**Overall Content Principle:** Adhere to a "Clear, Professional, Guiding" tone. All text should be user-focused, easy to understand, supportive of the task at hand, and avoid unnecessary jargon. Effective microcopy is crucial for a seamless user experience.

### 4.1. Section Titles

1.  **Clear and Descriptive Titles**
    *   `[ ]` Use clear, descriptive, and consistent titles for main sections, drawing from `frontend/src/constants/textConstants.js`. Examples: `HEADING_PORTFOLIO_OVERVIEW`, `HEADING_APPLICATION_SETTINGS`.
    *   **Relevant Files & Context:**
        *   Main Component: `frontend/src/features/portfolio/views/OverviewSettingsView.js`
        *   Constants: `frontend/src/constants/textConstants.js` (Create if not existing; Create/update these constants: `HEADING_PORTFOLIO_OVERVIEW`, `HEADING_PORTFOLIO_SETTINGS`, `HEADING_APPLICATION_SETTINGS`, etc. Ensure they are concise and informative.)

### 4.2. Portfolio Summary Content

1.  **Clear Labels**
    *   `[ ]` Ensure each data point (Portfolio Name, Description, Total Value, Created On, Last Updated) has a clear, concise label. Examples: "Portfolio Name:", "Current Total Value:".
    *   **Relevant Files & Context:**
        *   Main Component: `frontend/src/features/portfolio/views/OverviewSettingsView.js`
        *   Constants: `frontend/src/constants/textConstants.js` (Create if not existing; Define labels like `LABEL_PORTFOLIO_NAME`, `LABEL_TOTAL_VALUE` for consistency)

2.  **Accessible Edit Prompts**
    *   `[ ]` Provide `aria-label` for interactive edit icon buttons (e.g., "Edit Portfolio Name", "Edit portfolio description") to ensure accessibility.
    *   **Relevant Files & Context:**
        *   Main Component: `frontend/src/features/portfolio/views/OverviewSettingsView.js` (When implementing edit icons/buttons)

3.  **Empty State Prompts**
    *   `[ ]` For empty editable fields like description, provide a gentle guiding prompt when the field is empty or in edit mode (e.g., "Add a description to help you remember this portfolio's purpose.").
    *   **Relevant Files & Context:**
        *   Main Component: `frontend/src/features/portfolio/views/OverviewSettingsView.js`
        *   Constants: `frontend/src/constants/textConstants.js` (Create if not existing; e.g., `PLACEHOLDER_PORTFOLIO_DESCRIPTION`)

### 4.3. Application Settings Content

1.  **Inflation Rate Label & Helper Text**
    *   `[ ]` Label: "Default Annual Inflation Rate (%)".
    *   `[ ]` Helper Text/Tooltip: Provide guiding microcopy to explain its impact. Example: "This rate will be used to adjust future values in projections for inflation, providing a 'real terms' outlook. Leave blank or set to 0 to see nominal projections." This clarifies its purpose and usage.
    *   **Relevant Files & Context:**
        *   Main Component: `frontend/src/features/portfolio/views/OverviewSettingsView.js`
        *   Tooltip Component: `frontend/src/components/Tooltip/Tooltip.js` (Create if not existing, or use a simple helper text element)
        *   Constants: `frontend/src/constants/textConstants.js` (Create if not existing; e.g., `LABEL_INFLATION_RATE`, `HELP_TEXT_INFLATION_RATE`)

2.  **Save Button Label**
    *   `[ ]` Use an action-oriented label like "Save Settings" or "Apply Settings" for buttons that save application-level settings.
    *   **Relevant Files & Context:**
        *   Main Component: `frontend/src/features/portfolio/views/OverviewSettingsView.js`
        *   Constants: `frontend/src/constants/textConstants.js` (Create if not existing; e.g., `BUTTON_SAVE_SETTINGS`)

### 4.4. General Microcopy & Placeholders

1.  **Helpful Placeholders**
    *   `[ ]` Use placeholder text in input fields to offer hints or examples (e.g., "My Long-Term Growth Plan" for description, "2.5" for inflation rate) but ensure they do not replace persistent labels, aligning with the **Recognition Over Recall heuristic**.
    *   **Relevant Files & Context:**
        *   Main Component: `frontend/src/features/portfolio/views/OverviewSettingsView.js` (Apply to relevant input fields)
        *   Input Component: `frontend/src/components/Input/Input.js` (Assumed to exist within `Input/` directory; Ensure placeholder prop is supported and styled correctly)

2.  **Professional Language**
    *   `[ ]` Ensure all text is precise, professional, and avoids jargon, maintaining the application's overall tone.
    *   **Relevant Files & Context:** Review all text content within the feature during development and testing.

### 4.5. Feedback Messages

1.  **Success Messages**
    *   `[ ]` Use clear, affirmative messages for successful saves (e.g., "Portfolio details updated successfully.", "Inflation rate saved.").
    *   **Relevant Files & Context:**
        *   Notification Component: `frontend/src/components/Notification/Notification.js` (Assumed to exist within `Notification/` directory)
        *   Constants: `frontend/src/constants/textConstants.js` (Create if not existing; e.g., `SUCCESS_PORTFOLIO_UPDATED`, `SUCCESS_SETTINGS_SAVED`)

2.  **Constructive Error Messages**
    *   `[ ]` Error messages should be constructive, explaining the issue clearly and guiding the user towards resolution (e.g., "Inflation rate must be a valid number between 0 and 100.", "Failed to update portfolio. Please try again.").
    *   **Relevant Files & Context:**
        *   Alert Component: `frontend/src/components/AlertMessage/AlertMessage.js` (Assumed to exist within `AlertMessage/` directory)
        *   Constants: `frontend/src/constants/textConstants.js` (Create if not existing; e.g., `ERROR_INVALID_INFLATION_RATE`, `ERROR_PORTFOLIO_UPDATE_FAILED`)

## Conclusion

This plan provides a structured approach to implementing the "Overview & Settings" view, enriched with the rationale and detailed considerations from the `plan_outline.md`. Adherence to the project's core philosophy—particularly regarding user experience (clarity, heuristics), code quality (maintainability, consistency), and the defined Data-Focused Flat 2.0 aesthetic—is paramount throughout development. Regular reference to both this implementation plan and the visionary outline will ensure the final feature aligns with the project's goals.

## 5. Enhancement Suggestions

These additional suggestions refine the implementation plan with deeper attention to microinteractions, consistency, and data-focused UX details.

### 5.1. Microinteractions for Custom Select

1.  **Smooth Dropdown Animation**
    *   `[ ]` Implement a subtle animation (100-150ms) for select dropdown panels when opening/closing, such as a gentle scale/fade from the top. This makes the interaction feel more polished than an instant appearance.
    *   `[ ]` Ensure the chevron icon rotation is smoothly animated with CSS transitions when dropdown state changes.
    *   **Relevant Files & Context:**
        *   Select Component: `frontend/src/components/Select/Select.js` (Assumed to exist within `Select/` directory)
        *   Animation: CSS Transitions/Animations (e.g., `transition-transform`, `transition-opacity`) or consider Framer Motion for more complex animations.

### 5.2. Focus State Consistency

1.  **Unified Focus Styling**
    *   `[ ]` Apply consistent focus ring styles (`ring-2 ring-primary-500 ring-offset-1`) across all interactive elements: form inputs, buttons, select components, and radio buttons.
    *   **Relevant Files & Context:**
        *   Input Component: `frontend/src/components/Input/Input.js`
        *   Button Component: `frontend/src/components/Button/Button.js`
        *   Select Component: `frontend/src/components/Select/Select.js` (Assumed to exist within `Select/` directory)
        *   Form Elements: Any form-related components including custom radio buttons
        *   Styling: Consider adding consistent focus styles to a base component or utility class

### 5.3. Data-Focused Emphasis in Form Controls

1.  **Visual Data Type Indicators**
    *   `[ ]` For data input selection components like "Allocation Type" (Percentage vs. Value), add subtle icons within the styled labels to visually hint at the type of input expected.
    *   `[ ]` This reinforces the data-centric nature of the application and provides visual cues that align with the "Data-Focused Flat 2.0" design philosophy.
    *   **Relevant Files & Context:**
        *   Radio Button Component: Form components where users select data types
        *   Icons: Subtle, minimalist icons representing percentage (%), currency ($), etc.

### 5.4. Custom Select Component Alternatives

1.  **Implementation Fallbacks**
    *   `[ ]` If the custom select becomes too complex for perfect implementation with full accessibility, prepare a well-styled native select as a fallback option.
    *   `[ ]` Consider evaluating headless UI libraries (like Headless UI or Radix UI) for complex interactive components in the future, as they handle state and accessibility internally.
    *   **Relevant Files & Context:**
        *   Select Component: `frontend/src/components/Select/Select.js` (Assumed to exist within `Select/` directory)
        *   Alternate implementation as a styled native select element with limited but consistent styling
