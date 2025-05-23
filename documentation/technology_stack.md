# Technology Stack (Updated - Multi-Panel & Guided Workflow Context)

## 1. Introduction

This document outlines the selected technology stack for the Investment Planning Projection website. These choices are based on the project's functional requirements, non-functional requirements (especially maintainability, usability, budget), developer familiarity, and relevant knowledge base principles. The stack supports the implementation of the **hybrid multi-panel layout and guided workflow** frontend structure, styled with a **Data-Focused Flat 2.0 aesthetic**, **purposeful animation**, and **clear, professional content**.

## 2. Core Backend Technologies

*   **Backend Framework:** **Flask (Python)**
    *   *Rationale:* Leverages user's Python familiarity; strong ecosystem for potential numerical/data tasks; flexible.
*   **Database:** **PostgreSQL**
    *   *Rationale:* Robust RDBMS suitable for structured financial data; data integrity; excellent free tiers available; works well with SQLAlchemy. `psycopg2-binary` is used as the Python adapter.
*   **Database Interaction (ORM):** **SQLAlchemy**
    *   *Rationale:* Pythonic DB interaction; enhances maintainability and readability; integrates well with Flask.
*   **Database Migrations:** **Flask-Migrate** (uses Alembic)
    *   *Rationale:* Handles database schema migrations systematically.
*   **Data Validation/Serialization:** **Pydantic**
    *   *Rationale:* Robust data validation, parsing, and settings management using Python type hints. Ensures data integrity at API boundaries.
*   **Asynchronous Task Processing:** **Celery**
    *   *Rationale:* Distributed task queue for handling long-running operations (e.g., complex financial projections) asynchronously, improving API responsiveness.
*   **Message Broker/Result Backend (for Celery):** **Redis**
    *   *Rationale:* Efficient in-memory data store, commonly used with Celery as a message broker and for storing task results.
*   **Authentication:** **Flask-JWT-Extended**
    *   *Rationale:* Provides secure and straightforward management of JSON Web Tokens (JWTs) for authenticating API requests.
*   **Password Hashing:** **bcrypt**
    *   *Rationale:* Strong and widely recommended library for securely hashing user passwords.
*   **API Security & Utilities:**
    *   **Flask-CORS:** Handles Cross-Origin Resource Sharing, allowing the frontend to securely interact with the backend API from a different domain/port.
    *   **Flask-Limiter:** Provides rate limiting capabilities to protect API endpoints from abuse.
    *   **Flask-Talisman:** Helps protect against common web vulnerabilities by setting HTTP security headers (CSP, HSTS, etc.).

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
    * *Rationale:* React-centric, component-based library for creating charts; integrates naturally; renders SVG charts suitable for the Projection Panel. Adheres to Flat 2.0 aesthetic with appropriate configuration.
* **Animation Library (Consideration):** **Framer Motion**
    * *Rationale:* Implementing the approved subtle, performant animations for panel transitions, workflow steps, and microinteractions (NFR U-4) will likely benefit from a dedicated library. Framer Motion is a strong conceptual candidate due to its focus on UI interactions and layout animations. React Spring is an alternative for physics-based motion. *(Approved Consideration)*
*   **Build Tool/Development Server:** **Vite**
    *   *Rationale:* Offers extremely fast Hot Module Replacement (HMR) and build times, significantly improving the development experience for modern JavaScript applications. (Identified from `frontend/package.json` and `vite.config.js`).
*   **Layout Components:**
    *   **Allotment:** React component for creating resizable split panes. (Identified from `frontend/package.json`).
    *   **Headless UI (`@headlessui/react`)**: Unstyled, fully accessible UI components for modals, menus, etc. (Identified from `frontend/package.json`).
*   **Icons:**
    *   **Heroicons (`@heroicons/react`)**: SVG icons styled by Tailwind CSS. (Identified from `frontend/package.json`).
    *   **React-Icons**: Broad collection of icon libraries. (Identified from `frontend/package.json`).
*   **Utilities:**
    *   **Zxcvbn:** Password strength estimation. (Identified from `frontend/package.json`).
    *   **UUID:** Client-side unique ID generation. (Identified from `frontend/package.json`).


## 4. Development & Workflow Tools

* **Version Control:** **Git / GitHub**
    * *Rationale:* Industry standard; free private repos; essential.
*   **Containerization:** **Docker and Docker Compose**
    *   *Rationale:* Ensures consistent development, testing, and deployment environments. (Identified from `docker-compose.yml` and Dockerfiles).
* **Task Tracking:** **Trello**
    * *Rationale:* Simple, visual Kanban board; free tier sufficient; user preferred.
* **Environment Management:** **Python Virtual Environments (`venv`)**; **Node.js/npm** for frontend.
* **Code Editor:** **Cursor** (User Specified).
* **Code Quality:** **ESLint & Prettier** (Frontend)
    * *Rationale:* Enforce consistent code style, catch errors early, improve readability/maintainability. (Identified from `frontend/package.json` and linting configurations).

## 5. Testing Frameworks

* **Frontend Testing:** **Jest / React Testing Library**
    * *Rationale:* Jest is a popular framework for testing React applications. React Testing Library provides utilities for testing components in a way that resembles how users interact with them. (Identified from `frontend/package.json` dependencies like `@testing-library/jest-dom`, `@testing-library/react`). The `package.json` script "test" notes a need for review for Vite compatibility, suggesting Vitest could be a future option for better integration with Vite.
* **Backend Testing:** **Pytest**
    * *Rationale:* Powerful and popular testing framework for Python. (Identified from `backend/requirements.txt` and `backend/pytest.ini`).

## 6. Hosting & Deployment (Initial Considerations)

* **Hosting Platform:** Prioritize platforms with free tiers for Flask/Python and PostgreSQL (e.g., Render) and static site hosting for the React build (e.g., GitHub Pages, Netlify, Vercel). Must fit budget (C-1).
*   **Web Server (Production Backend):** Consider Gunicorn or uWSGI behind Nginx for production (standard practice for Flask apps).
* **Data APIs:** Prioritize free APIs or those with generous free tiers; consider caching.

---
*This technology stack document confirms the chosen tools and includes notes reflecting the implications of the approved multi-panel/guided workflow structure, Flat 2.0 aesthetic, animation, and content strategy.*