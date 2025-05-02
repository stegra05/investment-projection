# Investment Planning Projection Website (Updated README)

## 1. Description

*(Updated)* A web application designed for personal finance planners and finance students seeking a simple, flexible tool to visualize long-term (3-40 year) investment projections. It allows detailed planning of future contributions/withdrawals and aims to utilize customizable projection models, including Monte Carlo simulations and inflation adjustments. The user interface utilizes a **multi-panel layout** for efficient data interaction on larger screens, complemented by **guided workflows** for complex tasks.

## 2. Features

### Core Features (Initial Version - M)

* Create, Edit, Delete investment portfolios.
* Select core assets (Stocks, Bonds, etc.) and specify allocation/weight.
* Manually input expected returns for assets/portfolio components.
* Plan future portfolio changes (single contributions, withdrawals, reallocations) over time.
* Visualize projected portfolio value growth via a graph (deterministic model).
* Secure user registration and login to save portfolio data.
* **Efficient and logically structured user interface** (multi-panel & guided workflow approach). *(Updated Description)*
* Clear allocation guidance (displaying remaining % needed). *(New M-UX1)*
* Helpful error message if allocations don't sum to 100%. *(New M-UX2)*

### Planned Enhancements (Should-Haves - SH)

* **Monte Carlo Projections:** Option to run projections using Monte Carlo simulation based on asset return and volatility (manual override or class-based defaults). Results displayed as probability bands. *(New SH-MC1, SH-MC2, SH-MC3, SH-MC4)*
* **Inflation Adjustment:** Option to specify a default portfolio inflation rate and factor it into projections. *(New SH-INF1, SH-INF2, SH-INF3)*
* **Persistent Portfolio Value:** Store the last calculated total portfolio value in the database. *(New SH-PV1)*
* **Recurring Changes:** Define recurring future changes (e.g., monthly contributions). *(New SH-UX2)*
* **Guided Projection Workflow:** Use guided steps for complex projection setup (e.g., Monte Carlo). *(New SH-GW1)*
* **Enhanced UX:** Informative projection status updates, contextual information in forms. *(New SH-UX1, SH-UX3)*
* Extended Asset Selection, Asset Details, Portfolio Summary View, Password Management.

### Potential Future Features (Could-Haves - CH)

* Scenario Comparison, Portfolio Comparison, Advanced Risk Visualization, Manual Transaction Entry, Data Export, Goal Setting, Rebalancing Suggestions, Historical Data Integration.

## 3. Technology Stack Summary

*(No changes - uses React, Flask, PostgreSQL, SQLAlchemy, Tailwind, Zustand, Axios, Recharts etc.)*

## 4. Setup (Local Development)

*(Instructions remain the same)*

1.  **Prerequisites:** Ensure Git, Python 3.x, Node.js (npm/yarn), and PostgreSQL are installed.
2.  **Clone Repository:** `git clone [Your GitHub Repo URL]`
3.  **Navigate to Project:** `cd [repository-name]`
4.  **Backend Setup:**
    * `cd backend`
    * `python -m venv venv`
    * `source venv/bin/activate` (Linux/macOS) or `.\venv\Scripts\activate` (Windows)
    * `pip install -r requirements.txt`
    * Configure Database Connection (`DATABASE_URL` env var).
    * Ensure PostgreSQL server is running and database/user exist.
    * Apply Database Migrations (e.g., `flask db upgrade`).
5.  **Frontend Setup:**
    * `cd ../frontend`
    * `npm install` (or `yarn install`)

## 5. Usage (Local Development)

*(Instructions remain the same)*

1.  Ensure your local PostgreSQL server is running.
2.  **Run Backend:**
    * Navigate to backend directory & activate `venv`.
    * Set environment variables (e.g., `FLASK_APP`, `FLASK_ENV=development`, `DATABASE_URL`).
    * `flask run`
3.  **Run Frontend:**
    * Navigate to frontend directory.
    * `npm start` (or `yarn start`)
4.  Access application via browser at `http://localhost:3000` (or the port specified by React).

## 6. Initial Task List (High-Level - Updated for UI Structure)

*(Effort: S=Small, M=Medium, L=Large, XL=Extra Large. Priorities: Must (M) / Should (SH) / Could (C))*

| ID  | Task Description                                       | Priority | Est. Effort | Dependencies     | Notes |
| --- | ------------------------------------------------------ | -------- | ----------- | ---------------- | ----- |
| T1  | Project Setup & Boilerplate                  | M        | M           | -            |       |
| T2  | Basic Flask Backend Setup (API structure)     | M        | M           | T1           |       |
| T3  | PostgreSQL DB Setup & Migrations             | M        | M           | T1, T2       |       |
| T4  | User Auth Backend (Flask/SQLAlchemy)         | M        | L           | T3           |       |
| T5  | Core Portfolio Models & API (Flask/SQLAlchemy)| M        | L           | T3           |       |
| T6  | Backend Projection Engine (Deterministic Logic)| M        | XL          | T5           |       |
| T7  | Basic React Frontend Setup                   | M        | M           | T1           |       |
| **T7a** | **Implement Core Multi-Panel Layout Structure (FE)** | **M** | **L** | T7               | *(New)* |
| **T7b** | **Implement Responsive Adaptation for Panels (FE)** | **M** | **L** | T7a              | *(New)* |
| T8  | Frontend Auth Pages & Logic                  | M        | L           | T4, T7       |       |
| T9  | Frontend Portfolio Input/Mgmt UI (within Panels) | M        | L           | T5, T7a      |       |
| T10 | Frontend Projection Viz Display (within Panel)| M        | L           | T6, T7a      |       |
| T11 | Integrate FE/BE API Calls                    | M        | L           | T8, T9, T10  |       |
| T12 | Basic Testing Setup (Jest/Pytest)            | SH       | M           | T1           |       |
| T13 | (M-UX1/2) Implement Allocation Guidance & Errors       | M        | M           | T9               |       |
| **T13a**| **Implement Guided Onboarding/Setup Workflow (FE)** | **M** | **M** | T7a, T8, T9      | *(New)* |
| T14 | (SH-MC2) Add Volatility/AssetClass to Asset Model/API  | SH       | M           | T5               |       |
| T15 | (SH-MC1/4) Update Projection Engine for Monte Carlo    | SH       | XL          | T6, T14          |       |
| T16 | (SH-MC4) Update Projection API for Monte Carlo I/O     | SH       | L           | T15              |       |
| T17 | (SH-MC3) Update Frontend Chart for Monte Carlo Bands   | SH       | L           | T10, T16         |       |
| T18 | (SH-INF1) Add Inflation Rate to Portfolio Model/API    | SH       | S           | T5               |       |
| T19 | (SH-INF2/3) Update Engine/API/FE for Inflation Adj.    | SH       | M           | T6, T10, T18     |       |
| T20 | (SH-PV1) Implement Persistent Portfolio Value Storage  | SH       | M           | T5               |       |
| T21 | (SH-UX1) Add Frontend Projection Status Updates        | SH       | S           | T10              |       |
| T22 | (SH-UX2) Design/Implement Recurring Changes Feature     | SH       | XL          | T5, T9           |       |
| T23 | (SH-UX3) Add Contextual Info to Change Form            | SH       | S           | T9               |       |
| **T23a**| **(SH-GW1) Implement Guided Projection Workflow (FE)**| **SH** | **M** | T10, T7a         | *(New)* |
| T24 | (Guideline) Apply M3 Principles to Core Components     | SH       | L           | T7, T8, T9       |       |
| T25 | (Guideline) Implement Basic UI Animations              | SH       | M           | T7, T8, T9       |       |

## 7. Key Risks & Mitigations (Updated)

| Risk Description                                             | Likelihood | Impact | Mitigation Strategy                                                                                                    | Contingency                                                   |
| :----------------------------------------------------------- | :--------- | :----- | :--------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------ |
| Underestimating Projection Engine Complexity (Deterministic) | Medium     | High   | Break down logic; research time.                                                                           | Simplify model if necessary.                       |
| **Underestimating Monte Carlo Engine Complexity** *(New)* | **High** | **High** | Basic implementation first; unit testing; research/dev time; leverage libraries.                                         | Defer Monte Carlo.                                            |
| **Performance Issues with Monte Carlo** *(New)* | **Medium** | **Medium** | Optimize; limit simulations; consider backend task queue.                                                              | Fewer simulations; warning for long calcs.                    |
| **Complexity of Multi-Panel State Sync (FE)** *(New)* | **Medium** | **Medium** | Use appropriate state management (Zustand/Context); memoization; careful component design.                               | Simplify panel interactions; fetch data more often.         |
| **Challenge of Responsive Multi-Panel Design (FE)** *(New)* | **Medium** | **High** | Design mobile-first or desktop-first with clear adaptation plan; use Tailwind effectively; allocate specific testing time. | Implement simpler mobile-specific layout (e.g., stacked/tabbed). |
| Learning Curve for SQLAlchemy/PostgreSQL          | Medium     | Medium | Start simple; tutorials; learning time.                                                                    | Seek community help.                               |
| **Complexity of Recurring Changes Implementation** *(New)* | **Medium** | **High** | Careful design; iterative implementation; thorough testing.                                                            | Defer feature.                                                |
| Data Source Limitations (Free APIs / Inflation Data) | Medium     | Medium | Cache; monitor usage; design defensively; use defaults/user input.                                         | Small budget (€10/mo) if vital.                      |
| Overall Time Estimation (Solo Dev @ 8hrs/wk)       | Medium     | High   | Task tracking; Break down tasks; Review progress.                                                          | Adjust scope (SH->C); Extend timeline.              |
| **Scope Creep due to UX/Feature Enhancements** *(New)* | **Medium** | **High** | Rigorous prioritization (MoSCoW); stick to plan; document future ideas.                                                | Explicitly defer lower-priority features.                     |

## 8. Contributing

This is currently a personal project.

## 9. License

(Specify License - e.g., MIT License)

---