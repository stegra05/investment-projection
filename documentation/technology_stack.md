# Technology Stack (Updated - Multi-Panel & Guided Workflow Context)

## 1. Introduction

This document outlines the selected technology stack for the Investment Planning Projection website. These choices are based on the project's functional requirements, non-functional requirements (especially maintainability, usability, budget), developer familiarity, and relevant knowledge base principles. The stack supports the implementation of the **hybrid multi-panel layout and guided workflow** frontend structure.

## 2. Core Backend Technologies

* **Backend Framework:** **Flask (Python)**
    * *Rationale:* Leverages user's Python familiarity; strong ecosystem for potential numerical/data tasks; flexible.
* **Database:** **PostgreSQL**
    * *Rationale:* Robust RDBMS suitable for structured financial data; data integrity; excellent free tiers available; works well with SQLAlchemy.
* **Database Interaction (ORM):** **SQLAlchemy**
    * *Rationale:* Pythonic DB interaction; enhances maintainability and readability; integrates well with Flask.

## 3. Core Frontend Technologies

* **UI Framework:** **React**
    * *Rationale:* Popular, component-based; large community and ecosystem; user confirmed preference. Suitable for building complex, interactive UIs like the multi-panel workspace.
* **Routing Library:** **React Router**
    * *Rationale:* Standard for routing in React SPAs; handles navigation between main views (Login, Dashboard, Workspace).
* **UI/Styling Approach:** **Tailwind CSS**
    * *Rationale:* Utility-first CSS framework offering high customization and potentially smaller bundles. Provides the flexibility needed to build the custom multi-panel layout without being constrained by a specific component library's opinions.
    * *Note:* Building complex UI elements like resizable panels, modals for guided workflows, or sophisticated drawers for mobile adaptation might require significant custom implementation or integration with compatible headless UI libraries (e.g., Headless UI, Radix UI).
* **State Management:** **Zustand (for global state) + React Context API / Hooks (for local/simpler state)**
    * *Rationale:* Zustand provides a simple, lightweight solution for global state (auth, portfolio list). React's built-in tools handle local/component state. Context API is suitable for sharing selected portfolio state across panels.
    * *Note:* The multi-panel layout might introduce more complex cross-panel state synchronization needs. While the current tiered approach is appropriate to start, monitor complexity during development. Ensure efficient state updates to maintain panel responsiveness (NFR P-2).
* **Data Fetching:** **Axios**
    * *Rationale:* Small, popular library simplifying client-server communication (API calls); low overhead.
* **Charting Library:** **Recharts**
    * *Rationale:* React-centric, component-based library for creating charts; integrates naturally; renders SVG charts suitable for the Projection Panel.
* **Animation Library (Consideration):**
    * *Rationale:* While not part of the initial core stack, implementing smooth transitions between panel states, guided workflow steps, and providing interactive feedback (NFR U-4) might benefit from a dedicated animation library later (e.g., **Framer Motion** for ease of UI interaction/layout animation or **React Spring** for physics-based effects). *(New Consideration)*

## 4. Development & Workflow Tools

* **Version Control:** **Git / GitHub**
    * *Rationale:* Industry standard; free private repos; essential.
* **Task Tracking:** **Trello**
    * *Rationale:* Simple, visual Kanban board; free tier sufficient; user preferred.
* **Environment Management:** **Python Virtual Environments (`venv`)**; **Node.js/npm/yarn** for frontend.
* **Code Editor:** **Cursor** (User Specified).
* **Code Quality:** **ESLint & Prettier**
    * *Rationale:* Enforce consistent code style, catch errors early, improve readability/maintainability (M-1, M-2).

## 5. Testing Frameworks

* **Frontend Testing:** **Jest**
    * *Rationale:* Popular framework for testing React applications (unit/integration tests for components, hooks, state logic).
* **Backend Testing:** **Pytest**
    * *Rationale:* Powerful and popular testing framework for Python (unit/integration tests for API endpoints, services, models).

## 6. Hosting & Deployment (Initial Considerations)

* **Hosting Platform:** Prioritize platforms with free tiers for Flask/Python and PostgreSQL (e.g., Render) and static site hosting for the React build (e.g., GitHub Pages, Netlify, Vercel). Must fit budget (C-1).
* **Data APIs:** Prioritize free APIs or those with generous free tiers; consider caching.

---
*This stack remains largely unchanged but includes notes acknowledging the increased complexity the multi-panel/guided workflow approach might bring to styling/component building and state management, suggesting potential future additions like animation libraries.*