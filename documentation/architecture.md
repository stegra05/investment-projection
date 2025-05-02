# Architecture Overview (Updated Again)

## 1. Introduction

This document provides a high-level overview of the system architecture for the Investment Planning Projection website. It describes the main components, how they interact, the flow of data, and how the architecture supports the key Non-Functional Requirements (NFRs).

## 2. Key Components

The system is designed using a standard client-server architecture consisting of three primary components:

* **Frontend (Client):** A single-page application (SPA) built using **React**. It runs in the user's web browser and is responsible for rendering the UI, capturing input, and displaying results.
    * **UI Structure:** Organized into distinct views/pages (Login, Register, Dashboard) and a core **Portfolio Workspace** view utilizing a **tabbed interface** (Overview, Assets, Planned Changes, Projections).
    * **Component Structure:** Components will be organized primarily by **feature/page/tab** (e.g., `features/AssetsTab/`, `features/Auth/`) to enhance modularity and maintainability (M-1). *(New specification)*
    * **State Management Strategy:** A tiered approach will be used: *(New Section)*
        * **Global State (Zustand):** Manages truly global data like user authentication status/details and the basic list of user portfolios.
        * **Contextual State (React Context API):** Used within the `PortfolioWorkspace` to provide data for the currently selected portfolio (fetched once) to all its child tabs (Overview, Assets, Changes, Projections).
        * **Local State (`useState`/`useReducer`):** Used extensively within individual components for form inputs, UI toggles, and temporary fetched data (e.g., projection results).
        * *Rationale:* This balances simplicity, maintainability, and performance by scoping state appropriately.
* **Backend (Server):** An API server built using **Flask (Python)**. Responsible for API request handling, business logic (auth, portfolio management, projections), database interaction via **SQLAlchemy**, and security enforcement.
* **Database (Data Store):** A **PostgreSQL** relational database. Stores user data, portfolios, assets, planned changes, etc.

## 3. Interactions

* **Client-Server Communication:** React Frontend communicates with Flask Backend via RESTful API calls over HTTPS, defined in the API specification. Frontend uses **Axios** for requests.
* **Backend-Database Communication:** Flask Backend interacts with PostgreSQL via **SQLAlchemy**.
* **Internal Frontend Navigation:** **React Router** manages transitions between pages. Tab navigation within the Portfolio Workspace manages view sections.

## 4. Data Flow Example (Running a Projection - Updated)

1.  **User Action:** User logs in, navigates Dashboard, selects portfolio, clicks "Projections" tab in Portfolio Workspace.
2.  **Input & API Request:** User enters parameters, clicks "Run Projection." React sends API request via Axios.
3.  **Backend Processing:** Flask authenticates, queries DB via SQLAlchemy, runs projection engine.
4.  **API Response:** Flask sends results back as JSON.
5.  **Frontend Display:** React receives data, displays visualization using **Recharts** within the "Projections" tab. Status updates shown.

## 5. NFR Alignment

This architecture supports key NFRs:

* **Maintainability (M-1):** Clear backend/frontend separation; modular **feature-based component structure** and **scoped state management** in React; SQLAlchemy on backend. Use of **ESLint/Prettier** enforced.
* **Usability (U-1, U-2):** Tabbed workspace improves clarity/efficiency. **Tailwind CSS** allows for custom, clean UI. **M3** as strong guideline.
* **Security (SEC-1-4):** Backend handles core auth/hashing. HTTPS enforced. Basic client-side validation planned; critical validation on backend.
* **Performance (P-1, P-2):** Backend calculations separate. Frontend performance addressed via **code-splitting, lazy loading**, and appropriate state management.
* **Reliability (R-1):** Tolerates occasional downtime.
* **Data Accuracy (DA-1):** Backend calculations primary; Frontend ensures accurate display formatting using **Recharts** / number formatting.
* **Constraints (C-1):** All chosen libraries (**React Router, Tailwind, Zustand, Axios, Recharts, Jest**) are free/open-source, adhering to budget.

---
*This architecture overview now includes specifics on the frontend component structure and state management approach.*