# UI/UX Design Considerations (Updated - Multi-Panel & Guided Workflow)

## 1. Introduction

This document summarizes the revised key User Interface (UI) and User Experience (UX) considerations for the Investment Planning Projection website's React frontend. It reflects a shift away from a purely tabbed interface towards a more sophisticated **hybrid approach combining a multi-panel layout with guided workflows** for specific complex tasks. This direction aims to better serve the target audience of finance planners and students by offering both information density and focused guidance, aligned with a **Data-Focused Flat 2.0 aesthetic**.

## 2. Overall Structure & Navigation

* **Core Views:** The primary views remain:
    * Login Page
    * Registration Page
    * Dashboard / Portfolio List Page
    * **Portfolio Workspace (Core Interaction Area)**
* **Portfolio Workspace Structure (Multi-Panel Layout):**
    * The workspace will adopt a **multi-panel layout**, primarily optimized for desktop/larger screens. The exact configuration is flexible, but a common pattern might include:
        * **Panel 1 (Navigation/Context):** Persistently displays the list of user portfolios (allowing quick switching) and potentially high-level details of the currently selected portfolio. Styling should be clean, perhaps using subtle background differences or borders consistent with Flat 2.0.
        * **Panel 2 (Main Content/Editor):** The primary area where users interact with detailed views – displaying assets, planned changes, or projection settings. Content within this panel might still use internal navigation (e.g., simple tabs or segmented controls) if needed for organization (e.g., switching between viewing Assets and Planned Changes). Clear visual hierarchy using typography and spacing is key.
        * **Panel 3 (Visualization/Output):** Dedicated space for displaying the projection chart, allowing it to remain visible while adjustments are made elsewhere. Ensure chart elements have good contrast and legibility.
    * **Responsiveness:** On smaller screens (tablets/mobile), this multi-panel layout MUST adapt gracefully. Panels might stack vertically, collapse into drawers/menus, or transition to a more focused single-view approach. Designing this adaptation effectively is crucial for usability.
* **Navigation:**
    * Standard routing (React Router) handles navigation between main views.
    * Within the Portfolio Workspace, interaction primarily occurs *within and between panels*, reducing reliance on explicit top-level navigation. Quick portfolio switching happens via the navigation panel, with smooth visual transitions (see Animation).

## 3. Key Views/Panels & Content

* **Login/Register Pages:** Standard forms, styled according to the Flat 2.0 aesthetic (clear labels, distinct input fields, primary action button using the vibrant accent color).
* **Dashboard Page:** Displays a list/cards of portfolios; includes "Create New Portfolio" CTA. Cards styled using Flat 2.0 principles (subtle shadows/borders for definition).
* **Portfolio Workspace Panels (Example Configuration):**
    * **Navigation Panel:** List of user portfolios. Clear visual indication of the selected portfolio. Uses professional, clear typography.
    * **Main Content/Editor Panel:** This is the primary interactive area. Content views within should maintain consistency:
        * An **Assets View:** Clean table or card list for assets. Input fields styled for clarity. Allocation guidance (%) clearly visible. Error messages are specific and placed near the source.
        * A **Planned Changes View:** List or timeline view of changes. Forms for adding/editing changes are clear and potentially part of a guided workflow for complex recurring changes (SH-UX2). Uses helpful microcopy (SH-UX3).
        * An **Overview/Settings View:** Displays portfolio metadata. Clear headings and potentially input fields for editable items (like name, description, inflation rate - SH-INF1).
    * **Projection Panel:** Contains clear input fields for parameters. The Recharts chart uses the chosen color palette effectively (e.g., vibrant accent for key lines/areas, neutral tones otherwise). Status feedback (SH-UX1) is clear and uses subtle animation.

## 4. Core User Workflows & Guided Workflows

* **Onboarding & Initial Setup:** New user registers, logs in, lands on Dashboard, creates portfolio. **Initiates a guided setup workflow** (modal sequence or focused panel states) using clear instructions, professional tone, and smooth step transitions (Animation). Focuses user on adding essential initial data (name, first asset).
* **Managing & Projecting:** User logs in, selects portfolio from Navigation Panel. Panels update smoothly. User interacts with Assets/Changes views in the Main panel. Running a complex projection (e.g., Monte Carlo) triggers a **Guided Workflow** with clear steps and focused inputs, utilizing animation for transitions and feedback.
* **Allocation Updates:** Triggered from the Assets View, presenting a focused UI (perhaps a modal or dedicated panel state) for efficiently updating all percentages, with clear feedback on the total sum (M-UX1, M-UX2).

## 5. Key Usability Goals (Derived from NFRs)

The revised design emphasizes:

* **U-1: Interface Clarity:** Achieved through panel separation, strong visual hierarchy (typography, spacing), Flat 2.0 component clarity, and focused guided workflows.
* **U-2: Workflow Efficiency:** Multi-panel layout maximizes desktop efficiency. Guided workflows optimize specific complex tasks. Responsive design for smaller screens is critical.
* **U-3: Design System Alignment (Guideline):** M3 principles guide component styling/accessibility where appropriate, but the overall layout and aesthetic follow the custom Flat 2.0 / Multi-Panel direction.
* **U-4: Animation Feedback (Guideline):** Subtle, performant animations provide feedback, smooth transitions (panels/workflows), and enhance Flat 2.0 affordance.
* **U-5: Content & Microcopy:** **Clear, Professional, Guiding** tone implemented via meticulous microcopy is essential for usability and trust.

## 6. Consistency & UI Library

* Consistency in component styling (buttons, inputs, cards based on Flat 2.0), typography, spacing, and interaction feedback across all panels and workflows is crucial.
* Using **Tailwind CSS** provides layout flexibility. Consider using headless UI components or building custom components for panels/modals/drawers, styled with Tailwind according to the Flat 2.0 vision.

## 7. Responsiveness

* **High Priority:** Defining and implementing the responsive behavior for tablet and mobile is a key challenge requiring careful planning and testing.

---
*This revised plan details the UI structure and user experience goals aligned with the Multi-Panel, Guided Workflow, and Data-Focused Flat 2.0 direction, incorporating considerations for tone and animation.*