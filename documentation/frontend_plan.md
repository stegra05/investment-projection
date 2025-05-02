# UI/UX Design Considerations (Updated - Multi-Panel & Guided Workflow)

## 1. Introduction

This document summarizes the revised key User Interface (UI) and User Experience (UX) considerations for the Investment Planning Projection website's React frontend. It reflects a shift away from a purely tabbed interface towards a more sophisticated **hybrid approach combining a multi-panel layout with guided workflows** for specific complex tasks. This direction aims to better serve the target audience of finance planners and students by offering both information density and focused guidance.

## 2. Overall Structure & Navigation

* **Core Views:** The primary views remain:
    * Login Page
    * Registration Page
    * Dashboard / Portfolio List Page
    * **Portfolio Workspace (Core Interaction Area)**
* **Portfolio Workspace Structure (Multi-Panel Layout):**
    * The workspace will adopt a **multi-panel layout**, primarily optimized for desktop/larger screens. The exact configuration is flexible, but a common pattern might include:
        * **Panel 1 (Navigation/Context):** Persistently displays the list of user portfolios (allowing quick switching) and potentially high-level details of the currently selected portfolio.
        * **Panel 2 (Main Content/Editor):** The primary area where users interact with detailed views – displaying assets, planned changes, or projection settings. Content within this panel might still use internal navigation (e.g., simple tabs or segmented controls) if needed for organization (e.g., switching between viewing Assets and Planned Changes).
        * **Panel 3 (Visualization/Output):** Dedicated space for displaying the projection chart, allowing it to remain visible while adjustments are made elsewhere.
    * **Responsiveness:** On smaller screens (tablets/mobile), this multi-panel layout MUST adapt gracefully. Panels might stack vertically, collapse into drawers/menus, or transition to a more focused single-view approach, possibly resembling the original tabbed idea as a fallback. Designing this adaptation effectively is crucial.
* **Navigation:**
    * Standard routing (React Router) handles navigation between Login, Register, Dashboard, and the Portfolio Workspace.
    * Within the Portfolio Workspace, interaction will primarily occur *within and between panels*, reducing reliance on explicit top-level navigation like main tabs. Quick portfolio switching happens via the navigation panel.

## 3. Key Views/Panels & Content

* **Login/Register Pages:** Standard forms, unchanged conceptually.
* **Dashboard Page:** Displays a list/cards of portfolios; includes "Create New Portfolio" CTA. Unchanged conceptually.
* **Portfolio Workspace Panels (Example Configuration):**
    * **Navigation Panel:** List of user portfolios. Clicking one loads its data into the other panels. May show summary details (name, total value) of the selected portfolio.
    * **Main Content/Editor Panel:** This is the primary interactive area. It could contain:
        * An **Assets View:** For viewing, adding, editing, deleting assets. Handles allocation (%/value) and return inputs. Includes allocation guidance and error messaging (M-UX1, M-UX2).
        * A **Planned Changes View:** For viewing, adding, editing, deleting future changes. Will accommodate recurring changes (SH-UX2) and contextual info (SH-UX3) later.
        * An **Overview/Settings View:** Displays portfolio metadata (name, description), allows editing, and potentially houses portfolio-level settings (like inflation rate - SH-INF1).
        * *(Internal navigation within this panel might use sub-tabs or segmented buttons)*.
    * **Projection Panel:** Contains inputs for projection parameters (dates, model type) and displays the output chart (Recharts). Provides status feedback (SH-UX1). Will accommodate Monte Carlo options/outputs later (SH-MC1, SH-MC3).

## 4. Core User Workflows & Guided Workflows

* **Onboarding & Initial Setup:** New user registers, logs in, lands on Dashboard, creates a portfolio. **Crucially, upon creating a portfolio, the system should likely guide the user through an initial setup workflow**, perhaps focusing the Main Content panel sequentially on adding initial assets, then optionally planned changes, before showing the full multi-panel view. This incorporates the **Guided Workflow** approach for this specific task.
* **Managing & Projecting:** User logs in, selects portfolio from Dashboard Navigation Panel. The Main Content and Projection panels update. User interacts with Assets/Changes views in the Main panel, potentially seeing updates reflected in the Projection panel (if run). Running a complex projection (e.g., Monte Carlo) might trigger a **Guided Workflow** (e.g., a modal sequence or a temporary workflow state within the Projection panel) to configure parameters step-by-step.
* **Allocation Updates:** The dedicated allocation update feature (PUT /allocations) will likely be triggered from the **Assets View** within the Main Content panel, perhaps via a dedicated "Adjust Allocations" button that presents a focused UI for updating all percentages simultaneously.

## 5. Key Usability Goals (Derived from NFRs)

The revised design emphasizes:

* **U-1: Interface Clarity:** Achieved through clear panel separation, strong visual hierarchy within panels, and focused guided workflows for complex tasks.
* **U-2: Workflow Efficiency:** Multi-panel layout aims to maximize efficiency for expert users by reducing navigation needs. Guided workflows optimize specific complex tasks.
* **U-3: Design System Alignment (Guideline):** M3 principles remain a strong guideline, especially for component styling and accessibility, but the *layout* structure is now custom.
* **U-4: Animation Feedback (Guideline):** Subtle animations remain important for feedback within panels, transitions between workflow steps, and indicating panel updates. Performance is key.
* **U-5: Content & Microcopy:** Remains critical for clarity within panels, instructions in guided workflows, and error messages.

## 6. Consistency & UI Library

* Consistency within panels and across guided workflows is essential.
* Using **Tailwind CSS** provides the flexibility needed for this custom multi-panel layout. A component library might still be used for *individual components* (buttons, inputs, etc.) within the panels, chosen for compatibility with Tailwind and M3 guidelines (if desired for component styling).

## 7. Responsiveness

* **High Priority:** Defining the responsive behavior of the multi-panel layout for tablet and mobile is a critical design challenge that needs careful consideration during implementation.

---
*This revised plan outlines a more dynamic and potentially powerful UI structure, combining persistent information display with focused task guidance.*