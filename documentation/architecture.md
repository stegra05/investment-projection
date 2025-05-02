# Architecture Overview (Updated - Multi-Panel & Guided Workflow)

## 1. Introduction

This document provides a high-level overview of the system architecture for the Investment Planning Projection website, updated to reflect the adoption of a **hybrid multi-panel and guided workflow UI structure** for the frontend. It describes the main components, how they interact, the flow of data, and how the architecture supports the key Non-Functional Requirements (NFRs).

## 2. Key Components

The system retains a standard client-server architecture:

* **Frontend (Client):** A single-page application (SPA) built using **React**. Runs in the browser, responsible for UI rendering, input capture, and results display.
    * **UI Structure:** Organized into Login, Register, and Dashboard views. The core interaction area is the **Portfolio Workspace**, which now utilizes a **multi-panel layout** (especially on larger screens) instead of solely tabs. Guided workflows will be implemented for specific complex tasks (e.g., initial setup, advanced projections).
    * **Component Structure:** Components organized by feature/view (e.g., `features/PortfolioNavigatorPanel/`, `features/AssetsEditor/`, `features/ProjectionViz/`, `workflows/ProjectionSetup/`).
    * **State Management Strategy:** Tiered approach confirmed:
        * **Global State (Zustand):** Manages auth status/details, list of user portfolios.
        * **Contextual State (React Context API):** Likely used to manage the state of the *currently selected portfolio* across the different panels of the Portfolio Workspace. Might also manage state within multi-step guided workflows.
        * **Local State (`useState`/`useReducer`):** Used extensively within individual components/panels for forms, UI state, and fetched results.
* **Backend (Server):** API server using **Flask (Python)**. Handles API requests, business logic (auth, portfolio CRUD, change management, projections via `projection_engine.py`), DB interaction via **SQLAlchemy**, security.
* **Database (Data Store):** **PostgreSQL** relational database. Stores user, portfolio, asset, planned change data.

## 3. Interactions

* **Client-Server Communication:** React Frontend communicates with Flask Backend via RESTful API calls (HTTPS) using **Axios**.
* **Backend-Database Communication:** Flask Backend interacts with PostgreSQL via **SQLAlchemy**.
* **Internal Frontend Navigation:** **React Router** manages transitions between main views (Login, Dashboard, Workspace). Navigation *within* the Portfolio Workspace primarily involves interactions triggering updates across panels or stepping through guided workflows, rather than traditional page/tab routing.

## 4. Data Flow Example (Running a Projection - Multi-Panel Context)

1.  **User Action:** User logs in, sees Dashboard (e.g., in a navigation panel or separate view), selects a portfolio from the list/navigation panel.
2.  **Workspace Load:** Portfolio data is fetched, populating the relevant panels (e.g., Main Content panel shows Assets/Changes view, Projection panel shows chart/inputs).
3.  **Input & Workflow Trigger:** User interacts with Projection panel inputs. Clicking "Run Advanced Projection" might trigger a **Guided Workflow** (e.g., a modal sequence) for parameter setup.
4.  **API Request:** Once parameters are confirmed (via workflow or direct input), React sends API request via Axios to `/projections` endpoint.
5.  **Backend Processing:** Flask authenticates, verifies ownership, retrieves necessary data via SQLAlchemy, runs the `projection_engine.py` logic.
6.  **API Response:** Flask sends results (e.g., projection data points) back as JSON.
7.  **Frontend Display:** React receives data, updates state (potentially local state within the Projection panel or contextual state if other panels need awareness). The **Recharts** chart in the Projection panel re-renders to display the new visualization. Status updates are shown during the process.

## 5. NFR Alignment (Updated for New Structure)

This revised architecture impacts NFR alignment:

* **Maintainability (M-1):** Backend/frontend separation remains. Modular feature-based component structure and scoped state management in React are crucial for managing panel complexity. Linters/formatters enforced.
* **Usability (U-1, U-2):** Multi-panel layout aims for high efficiency/clarity for target users on desktop. Guided workflows enhance clarity for complex tasks. **Crucially, designing the responsive adaptation for smaller screens is key to maintaining usability across devices.**
* **Security (SEC-1-4):** Unchanged conceptually. Backend remains central to security. HTTPS, hashing, backend validation critical.
* **Performance (P-1, P-2):** Backend calculations unchanged. Frontend performance needs careful management due to potentially complex multi-panel state synchronization. Code-splitting/lazy-loading (especially for panels/charts) remains important. Potential for increased JS complexity needs monitoring.
* **Reliability (R-1):** Unchanged conceptually.
* **Data Accuracy (DA-1):** Unchanged conceptually. Backend precision, careful frontend display formatting.
* **Constraints (C-1):** Tech stack choices remain compliant with budget.

---
*This architecture overview now reflects the multi-panel structure and the integration of guided workflows, highlighting the impact on frontend structure, state management, and NFRs like usability and performance.*