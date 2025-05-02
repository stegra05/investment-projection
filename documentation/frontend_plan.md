# UI/UX Design Considerations (Summary from Planning)

## 1. Introduction

This document summarizes the key User Interface (UI) and User Experience (UX) considerations derived from the planning discussions for the Investment Planning Projection website's React frontend. It serves as a high-level guide for design and implementation, ensuring alignment with functional requirements and usability goals.

## 2. Overall Structure & Navigation

* **Core Views:** The application will consist of the following primary views/pages:
    * Login Page
    * Registration Page
    * Dashboard / Portfolio List Page
    * Portfolio Workspace (main area for interacting with a single portfolio)
* **Portfolio Workspace Structure:** To manage complexity and improve focus, the Portfolio Workspace will utilize a **tabbed interface**.
* **Navigation:**
    * Standard routing will handle navigation between Login, Register, Dashboard, and Portfolio Workspace.
    * Within the Portfolio Workspace, clear tab navigation (e.g., using tab components from a UI library) will allow users to switch between different functional areas.
    * A persistent header or sidebar within the Portfolio Workspace should display the current portfolio context and potentially offer quick navigation back to the Dashboard.

## 3. Key Views/Tabs & Content

* **Login/Register Pages:** Standard forms for user authentication .
* **Dashboard Page:** Displays a list or cards of the user's portfolios; includes a clear call-to-action ("Create New Portfolio") .
* **Portfolio Workspace Tabs:**
    * **Overview/Snapshot Tab (Default):** Provides a quick summary (e.g., current value, allocation chart, upcoming changes) .
    * **Assets Tab:** Focused area for managing assets – viewing list, adding, editing, deleting. Handles allocation (%/value) and return inputs . Must include allocation guidance and error messaging .
    * **Planned Changes Tab:** Dedicated area for managing future single contributions, withdrawals, reallocations . Will accommodate recurring changes (SH-UX2) and contextual info (SH-UX3) later.
    * **Projections Tab:** Dedicated area for configuring (dates, model type, inflation) and displaying projection results (chart) . Will accommodate Monte Carlo (SH-MC1, SH-MC3) and status feedback (SH-UX1) later.

## 4. Core User Workflows

* **Onboarding & Initial Setup:** New user registers, logs in, lands on Dashboard, creates a portfolio, and is guided directly to the **Assets Tab** of the new portfolio to begin setup.
* **Managing & Projecting:** User logs in, selects portfolio from Dashboard, lands in Portfolio Workspace (Overview), navigates easily between **Assets**, **Planned Changes**, and **Projections** tabs to manage the portfolio and run calculations.

## 5. Key Usability Goals (Derived from NFRs)

The design should prioritize the following usability NFRs:

* **U-1: Interface Clarity:** Clean design, logical structure, easy to understand even with complex features . The tabbed structure aims to support this.
* **U-2: Workflow Efficiency:** Key tasks should be intuitive and require minimal steps . The refined workflows and navigation aim to achieve this.
* **U-3: Design System Alignment (Guideline):** Adherence to Material Design 3 (M3) principles is recommended for consistency and accessibility .
* **U-4: Animation Feedback (Guideline):** Subtle, performant animations should be used for feedback and transitions .
* **U-5: Content & Microcopy:** Clear labels, action-oriented buttons, helpful error messages, concise tooltips, guided empty states, and a professional tone are required .

## 6. Consistency & UI Library

* A consistent look and feel across the application is crucial for usability.
* Using a React UI component library (e.g., Material UI, Ant Design, Chakra UI - *to be decided*) is highly recommended to enforce consistency, align with M3 guidelines (if applicable), and speed up development.

## 7. Responsiveness

* The application interface must be responsive and usable across various screen sizes (desktop, tablet, potentially mobile). Design considerations should include flexible layouts and adaptable components.

---
*This summary provides a reference for the key design directions established during planning.*

