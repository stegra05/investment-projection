# Architecture Overview (Updated - Multi-Panel & Guided Workflow)

## 1. Introduction

This document provides a high-level overview of the system architecture for the Investment Planning Projection website, updated to reflect the adoption of a **hybrid multi-panel and guided workflow UI structure** for the frontend, styled using a **Data-Focused Flat 2.0 aesthetic** with **purposeful animation** and **clear, professional content**. It describes the main components, interactions, data flow, and NFR alignment.

## 2. Key Components

The system retains a standard client-server architecture:

* **Frontend (Client):** A single-page application (SPA) built using **React**. Runs in the browser, responsible for UI rendering, input capture, and results display, implementing the approved visual and interactive vision.
    * **UI Structure:** Organized into Login, Register, and Dashboard views. The core interaction area is the **Portfolio Workspace**, utilizing a **multi-panel layout** (optimized for larger screens) and incorporating **guided workflows** for complex tasks (e.g., onboarding, advanced projections). This is implemented in `frontend/src/features/portfolio/pages/PortfolioWorkspacePage.jsx` using `Allotment` for resizable panes.
    * **Component Structure:** Organized by feature and view. Key panel components for the workspace are located in `frontend/src/features/portfolio/panels/`, for example:
        *   `NavigationPanel.jsx`
        *   `MainContentPanel.jsx` (which would render specific views like `AssetView.jsx` or `PlannedChangesView.jsx` from a `views` subdirectory)
        *   `ProjectionPanel.jsx`
    * **State Management Strategy:** Tiered approach confirmed:
        * **Global State (Zustand):** Manages auth status/details, list of user portfolios.
        * **Contextual State (React Context API):** Manages the state of the *currently selected portfolio* across the different panels. May also manage state within multi-step guided workflows.
        * **Local State (`useState`/`useReducer`):** Used extensively within individual components/panels for forms, UI state, and fetched results.
* **Backend (Server):** API server using **Flask (Python)**. Handles API requests, business logic (auth, portfolio CRUD, change management, projections via `projection_engine.py`), DB interaction via **SQLAlchemy**, security.
* **Database (Data Store):** **PostgreSQL** relational database. Stores user, portfolio, asset, planned change data.

## 3. Interactions

* **Client-Server Communication:** React Frontend communicates with Flask Backend via RESTful API calls (HTTPS) using **Axios**.
* **Backend-Database Communication:** Flask Backend interacts with PostgreSQL via **SQLAlchemy**.
* **Internal Frontend Navigation:** **React Router** manages transitions between main views. Navigation *within* the Portfolio Workspace primarily involves interactions triggering updates across panels (with smooth animations) or stepping through guided workflows (also animated).

## 4. Data Flow Example (Running a Projection - Multi-Panel Context)

1.  **User Action:** User logs in (clear Flat 2.0 styled form), sees Dashboard, selects a portfolio from the Navigation Panel.
2.  **Workspace Load:** Portfolio data is fetched. Panels update smoothly (animated transition) to display data for the selected portfolio (e.g., Main Content panel shows Assets view, Projection panel shows chart/inputs). Panels adhere to the Flat 2.0 style (clear typography, defined containers, subtle affordances).
3.  **Input & Workflow Trigger:** User interacts with Projection panel inputs (styled clearly). Clicking "Run Advanced Projection" triggers a **Guided Workflow** (e.g., a modal sequence with clear, professional text and smooth step animations).
4.  **API Request:** Parameters confirmed, React sends API request via Axios. Microcopy provides feedback ("Running projection...").
5.  **Backend Processing:** Flask authenticates, verifies ownership, retrieves data, runs `projection_engine.py`.
6.  **API Response:** Flask sends JSON results.
7.  **Frontend Display:** React receives data, updates state. Projection Panel updates, potentially with animated chart rendering (Recharts) and clear success confirmation message (Toast/Snackbar or inline).

## 5. NFR Alignment (Updated for Full Vision)

This architecture supports the NFRs within the context of the full vision:

* **Maintainability (M-1):** Modular structure (backend/frontend separation, feature-based components) is critical for managing the multi-panel UI and workflows. Consistent coding style (linters) aids readability.
* **Usability (U-1, U-2):** Multi-panel layout + guided workflows target efficiency and clarity. Flat 2.0 components ensure clear affordances. **Clear, professional microcopy (U-5)** is essential for guidance. Responsive adaptation remains key.
* **Security (SEC-1-4):** Unchanged conceptually. Backend handles core security.
* **Performance (P-1, P-2):** Backend calculation targets remain. Frontend performance requires diligent optimization: code-splitting, lazy-loading panels/charts, efficient state updates, **performant animations** (prioritizing transform/opacity).
* **Reliability (R-1):** Unchanged conceptually.
* **Data Accuracy (DA-1):** Backend precision (Decimal), clear frontend formatting.
* **Constraints (C-1):** Tech stack (React, Flask, PG, Tailwind, etc.) remains budget-compliant.

---
*This architecture overview incorporates the multi-panel/guided workflow structure, the Data-Focused Flat 2.0 aesthetic, animation goals, and content strategy, outlining how they interact and align with non-functional requirements.*