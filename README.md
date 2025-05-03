# Investment Planning Projection Website

## 1. Description

A web application designed for intermediate to advanced users to build investment portfolios, plan future contributions/changes, and visualize long-term wealth projections based on user-defined assumptions. This project focuses on providing flexible planning capabilities.

## 2. Features (Core - Initial Version)

* Create, Edit, Delete investment portfolios.
* Select core assets (Stocks, Bonds) and specify allocation/weight.
* Manually input expected returns for assets/portfolio components.
* Plan future portfolio changes (contributions, withdrawals, reallocations) over time.
* Visualize projected portfolio value growth via a graph.
* Secure user registration and login to save portfolio data.
* Simple, clean, and efficient user interface.

## 3. Technology Stack Summary

* **Frontend:** React
* **Backend:** Flask (Python)
* **Database:** PostgreSQL
* **Database Interaction:** SQLAlchemy (with Flask-SQLAlchemy/Flask-Migrate likely)
* **Version Control:** Git / GitHub
* **Task Tracking:** Trello
* **Environment:** Python `venv`
* **Testing (Planned):** Jest (React), Pytest (Flask)

## 4. Setup (Local Development)

1.  **Prerequisites:** Ensure Git, Python 3.x, Node.js (npm/yarn), and PostgreSQL are installed.
2.  **Clone Repository:** `git clone https://github.com/stegra05/investment-projection`
3.  **Navigate to Project:** `cd investment-projection`
4.  **Backend Setup:**
    * `cd backend` (adjust directory name if needed)
    * `python -m venv venv`
    * `source venv/bin/activate` (Linux/macOS) or `.\venv\Scripts\activate` (Windows)
    * `pip install -r requirements.txt`
    * Configure Database Connection (e.g., set `DATABASE_URL` environment variable for your local PostgreSQL instance).
    * Ensure PostgreSQL server is running and database/user exist.
    * Apply Database Migrations (e.g., `flask db upgrade`).
5.  **Frontend Setup:**
    * `cd ../frontend` (adjust directory name if needed)
    * `npm install` (or `yarn install`)

## 5. Usage (Local Development)

1.  Ensure your local PostgreSQL server is running.
2.  **Run Backend:**
    * Navigate to backend directory & activate `venv`.
    * Set environment variables (e.g., `FLASK_APP`, `FLASK_ENV=development`, `DATABASE_URL`).
    * `flask run`
3.  **Run Frontend:**
    * Navigate to frontend directory.
    * `npm start` (or `yarn start`)
4.  Access application via browser at `http://localhost:3000` (or the port specified by React).

## 6. Initial Task List (High-Level)

*(Based on discussed features and architecture breakdown. Effort is a rough estimate: S=Small, M=Medium, L=Large, XL=Extra Large)*

| ID | Task Description                       | Priority   | Est. Effort | Dependencies |
|----|----------------------------------------|------------|-------------|--------------|
| T1 | Project Setup & Boilerplate          | Must       | M           | -            |
| T2 | Basic Flask Backend Setup (API structure) | Must       | M           | T1           |
| T3 | PostgreSQL DB Setup & Migrations     | Must       | M           | T1, T2       |
| T4 | User Auth Backend (Flask/SQLAlchemy)   | Must       | L           | T3           |
| T5 | Core Portfolio Models & API (Flask/SQLAlchemy) | Must | L           | T3           |
| T6 | Backend Projection Engine (Core Logic) | Must       | XL          | T5           |
| T7 | Basic React Frontend Setup           | Must       | M           | T1           |
| T8 | Frontend Auth Pages & Logic          | Must       | L           | T4, T7       |
| T9 | Frontend Portfolio Input/Mgmt UI     | Must       | L           | T5, T7       |
| T10| Frontend Projection Viz Display      | Must       | L           | T6, T7       |
| T11| Integrate FE/BE API Calls          | Must       | L           | T8, T9, T10  |
| T12| Basic Testing Setup (Jest/Pytest)    | Should     | M           | T1           |

## 7. Key Risks & Mitigations

*(Based on our discussion)*

| Risk Description                                  | Likelihood | Impact | Mitigation Strategy                                                                 | Contingency                                     |
|---------------------------------------------------|------------|--------|-----------------------------------------------------------------------------------|-------------------------------------------------|
| Underestimating Projection Engine Complexity      | Medium     | High   | Break down logic into smaller parts; allocate specific research/learning time. | Simplify projection model for V1 if necessary.  |
| Learning Curve for SQLAlchemy/PostgreSQL          | Medium     | Medium | Start with simple CRUD; follow tutorials; allocate learning time.                 | Seek community help (Stack Overflow, forums). |
| Data Source Limitations (Free APIs)               | Medium     | Medium | Implement caching; monitor usage; design defensively for API errors.              | Use small budget (€10/mo) for paid tier if vital. |
| Overall Time Estimation (Solo Dev @ 8hrs/wk)    | Medium     | High   | Use task tracking (Trello); Break down tasks; Regularly review progress vs plan.  | Adjust scope (move Must->Should); Extend timeline. |

## 8. Contributing

This is currently a personal project.

## 9. License

(Specify License - e.g., MIT License or None)

---
