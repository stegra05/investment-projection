# Investment Planning Projection Website (Updated README)

## 1. Description

*(Updated)* A web application designed for personal finance planners and finance students seeking a simple, flexible tool to visualize long-term (3-40 year) investment projections. It allows detailed planning of future contributions/withdrawals and aims to utilize customizable projection models, including Monte Carlo simulations and inflation adjustments.

## 2. Features

### Core Features (Initial Version - M)

* Create, Edit, Delete investment portfolios. [cite: 19]
* Select core assets (Stocks, Bonds, etc.) and specify allocation/weight. [cite: 20]
* Manually input expected returns for assets/portfolio components. [cite: 20]
* Plan future portfolio changes (single contributions, withdrawals, reallocations) over time. [cite: 21]
* Visualize projected portfolio value growth via a graph (deterministic model). [cite: 21]
* Secure user registration and login to save portfolio data. [cite: 22]
* Clean and logically structured user interface (guided by M3 principles).
* Clear allocation guidance (displaying remaining % needed). *(New M-UX1)*
* Helpful error message if allocations don't sum to 100%. *(New M-UX2)*

### Planned Enhancements (Should-Haves - SH)

* **Monte Carlo Projections:** Option to run projections using Monte Carlo simulation based on asset return and volatility (manual override or class-based defaults). Results displayed as probability bands. *(New SH-MC1, SH-MC2, SH-MC3)*
* **Inflation Adjustment:** Option to specify a default portfolio inflation rate and factor it into projections. *(New SH-INF1, SH-INF2)*
* **Persistent Portfolio Value:** Store the last calculated total portfolio value in the database. *(New SH-PV1)*
* **Recurring Changes:** Define recurring future changes (e.g., monthly contributions). *(New SH-UX2)*
* **Enhanced UX:** Informative projection status updates, contextual information in forms. *(New SH-UX1, SH-UX3)*
* Extended Asset Selection, Asset Details, Portfolio Summary View, Password Management.

### Potential Future Features (Could-Haves - CH)

* Scenario Comparison, Portfolio Comparison, Advanced Risk Visualization, Manual Transaction Entry, Data Export, Goal Setting, Rebalancing Suggestions, Historical Data Integration.

## 3. Technology Stack Summary

*(No changes from previous discussion)*

* **Frontend:** React [cite: 23]
* **Backend:** Flask (Python) [cite: 23]
* **Database:** PostgreSQL [cite: 23]
* **Database Interaction:** SQLAlchemy [cite: 23]
* **Version Control:** Git / GitHub [cite: 23]
* **Task Tracking:** Trello [cite: 23]
* **Environment:** Python `venv` [cite: 23]
* **Testing (Planned):** Jest (React), Pytest (Flask) [cite: 23]
* **Design System (Guideline):** Material Design 3 (M3) principles
* **Animation (Guideline):** Subtle, performant animations for feedback and transitions

## 4. Setup (Local Development)

*(Instructions remain the same as original README)*

1.  **Prerequisites:** Ensure Git, Python 3.x, Node.js (npm/yarn), and PostgreSQL are installed. [cite: 24]
2.  **Clone Repository:** `git clone [Your GitHub Repo URL]` [cite: 24]
3.  **Navigate to Project:** `cd [repository-name]` [cite: 24]
4.  **Backend Setup:**
    * `cd backend` [cite: 24]
    * `python -m venv venv` [cite: 24]
    * `source venv/bin/activate` (Linux/macOS) or `.\venv\Scripts\activate` (Windows) [cite: 24]
    * `pip install -r requirements.txt` [cite: 24]
    * Configure Database Connection (`DATABASE_URL` env var). [cite: 24]
    * Ensure PostgreSQL server is running and database/user exist. [cite: 25]
    * Apply Database Migrations (e.g., `flask db upgrade`). [cite: 25]
5.  **Frontend Setup:**
    * `cd ../frontend` [cite: 26]
    * `npm install` (or `yarn install`) [cite: 26]

## 5. Usage (Local Development)

*(Instructions remain the same as original README)*

1.  Ensure your local PostgreSQL server is running. [cite: 27]
2.  **Run Backend:**
    * Navigate to backend directory & activate `venv`. [cite: 27]
    * Set environment variables (e.g., `FLASK_APP`, `FLASK_ENV=development`, `DATABASE_URL`). [cite: 28]
    * `flask run` [cite: 28]
3.  **Run Frontend:**
    * Navigate to frontend directory. [cite: 29]
    * `npm start` (or `yarn start`) [cite: 29]
4.  Access application via browser at `http://localhost:3000` (or the port specified by React). [cite: 29]

## 6. Initial Task List (High-Level - Updated)

*(Effort: S=Small, M=Medium, L=Large, XL=Extra Large. Priorities based on Must (M) / Should (SH) / Could (C))*

| ID  | Task Description                                       | Priority | Est. Effort | Dependencies |
| --- | ------------------------------------------------------ | -------- | ----------- | ------------ |
| T1  | Project Setup & Boilerplate [cite: 33]                  | M        | M           | - [cite: 35]        |
| T2  | Basic Flask Backend Setup (API structure) [cite: 36]     | M        | M           | T1 [cite: 38]       |
| T3  | PostgreSQL DB Setup & Migrations [cite: 39]             | M        | M           | T1, T2 [cite: 41]   |
| T4  | User Auth Backend (Flask/SQLAlchemy) [cite: 42]         | M        | L           | T3 [cite: 43]       |
| T5  | Core Portfolio Models & API (Flask/SQLAlchemy) [cite: 44]| M        | L           | T3 [cite: 45]       |
| T6  | Backend Projection Engine (Deterministic Logic) [cite: 46]| M        | XL          | T5 [cite: 48]       |
| T7  | Basic React Frontend Setup [cite: 49]                   | M        | M           | T1 [cite: 51]       |
| T8  | Frontend Auth Pages & Logic [cite: 52]                  | M        | L           | T4, T7 [cite: 54]   |
| T9  | Frontend Portfolio Input/Mgmt UI [cite: 55]             | M        | L           | T5, T7 [cite: 57]   |
| T10 | Frontend Projection Viz Display (Deterministic) [cite: 58]| M        | L           | T6, T7 [cite: 60]   |
| T11 | Integrate FE/BE API Calls [cite: 61]                    | M        | L           | T8, T9, T10 [cite: 63] |
| T12 | Basic Testing Setup (Jest/Pytest) [cite: 64]            | SH       | M           | T1 [cite: 65]       |
| **T13** | **(M-UX1/2) Implement Allocation Guidance & Errors** | **M** | **M** | T9           |
| **T14** | **(SH-MC2) Add Volatility/AssetClass to Asset Model/API** | **SH** | **M** | T5           |
| **T15** | **(SH-MC1/4) Update Projection Engine for Monte Carlo** | **SH** | **XL** | T6, T14      |
| **T16** | **(SH-MC4) Update Projection API for Monte Carlo I/O** | **SH** | **L** | T15          |
| **T17** | **(SH-MC3) Update Frontend Chart for Monte Carlo Bands** | **SH** | **L** | T10, T16     |
| **T18** | **(SH-INF1) Add Inflation Rate to Portfolio Model/API** | **SH** | **S** | T5           |
| **T19** | **(SH-INF2/3) Update Engine/API/FE for Inflation Adj.** | **SH** | **M** | T6, T10, T18 |
| **T20** | **(SH-PV1) Implement Persistent Portfolio Value Storage** | **SH** | **M** | T5           |
| **T21** | **(SH-UX1) Add Frontend Projection Status Updates** | **SH** | **S** | T10          |
| **T22** | **(SH-UX2) Design/Implement Recurring Changes Feature**| **SH** | **XL** | T5, T9       |
| **T23** | **(SH-UX3) Add Contextual Info to Change Form** | **SH** | **S** | T9           |
| **T24** | **(Guideline) Apply M3 Principles to Core Components** | **SH** | **L** | T7, T8, T9   |
| **T25** | **(Guideline) Implement Basic UI Animations** | **SH** | **M** | T7, T8, T9   |

## 7. Key Risks & Mitigations (Updated)

| Risk Description                                             | Likelihood | Impact | Mitigation Strategy                                                                                                   | Contingency                                                   |
| :----------------------------------------------------------- | :--------- | :----- | :-------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------ |
| Underestimating Projection Engine Complexity (Deterministic) [cite: 69] | Medium     | High   | Break down logic; allocate research time. [cite: 70]                                                                    | Simplify initial model if necessary. [cite: 71]              |
| **Underestimating Monte Carlo Engine Complexity** *(New)* | **High** | **High** | Start with basic implementation; heavy unit testing; allocate significant research/dev time; leverage math libraries. | Defer Monte Carlo to later version; focus on deterministic.   |
| **Performance Issues with Monte Carlo** *(New)* | **Medium** | **Medium** | Optimize calculations; potentially limit simulations; consider backend task queue for very long runs.              | Offer fewer simulations; display warning for long calculations. |
| Learning Curve for SQLAlchemy/PostgreSQL [cite: 72]          | Medium     | Medium | Start simple; follow tutorials; allocate learning time. [cite: 72]                                                        | Seek community help. [cite: 73]                               |
| **Complexity of Recurring Changes Implementation** *(New)* | **Medium** | **High** | Design carefully (DB schema, generation logic); implement iteratively; thorough testing.                              | Defer feature; rely on manual change input only.              |
| Data Source Limitations (Free APIs / Inflation Data) [cite: 74] | Medium     | Medium | Cache data; monitor usage; design defensively; use defaults or user input for inflation initially. [cite: 74]         | Use small budget (€10/mo) for paid tier if vital. [cite: 75]   |
| Overall Time Estimation (Solo Dev @ 8hrs/wk) [cite: 76]       | Medium     | High   | Use task tracking (Trello); Break down tasks; Regularly review progress vs plan. [cite: 77]                             | Adjust scope (move SH->C); Extend timeline. [cite: 78]       |
| **Scope Creep due to UX/Feature Enhancements** *(New)* | **Medium** | **High** | Rigorously prioritize using MoSCoW; stick to planned features per cycle; document future ideas separately.            | Explicitly defer lower-priority features (e.g., C/WH).        |

## 8. Contributing

This is currently a personal project. [cite: 79]

## 9. License

(Specify License - e.g., MIT License) [cite: 79]

---