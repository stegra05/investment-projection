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
* **Task Queue:** Celery (with Redis as broker/backend)
* **Version Control:** Git / GitHub
* **Task Tracking:** Trello
* **Environment:** Python `venv`
* **Testing (Planned):** Jest (React), Pytest (Flask)

## 4. Setup (Local Development)

1.  **Prerequisites:** Ensure Git, Python 3.x, Node.js (npm/yarn), PostgreSQL, and Redis are installed.
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
2.  Ensure your local Redis server is running (e.g., `redis-server &`).
3.  **Run Backend Flask Application:**
    * In a terminal, navigate to the `backend` directory.
    * Activate the virtual environment: `source .venv/bin/activate` (Linux/macOS) or `.\venv\Scripts\activate` (Windows).
    * Set required environment variables (e.g., `FLASK_APP=run.py`, `FLASK_ENV=development`, `DATABASE_URL`).
    * Run the Flask app: `flask run`. This will typically serve on `http://127.0.0.1:5000`.
4.  **Run Celery Worker:**
    * **In a separate terminal window:**
    * Navigate to the `backend` directory.
    * Activate the virtual environment: `source .venv/bin/activate` (Linux/macOS) or `.\venv\Scripts\activate` (Windows).
    * Set the `FLASK_CONFIG` environment variable if you use different configurations (e.g., `export FLASK_CONFIG=development`). The `celery_worker.py` script will use this or default to 'default'.
    * Run the Celery worker: `celery -A celery_worker.app_celery worker -l INFO`.
5.  **Run Frontend:**
    * Navigate to the `frontend` directory.
    * `npm start` (or `yarn start`)
6.  Access application via browser at `http://localhost:3000` (or the port specified by React).

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


## 7. Contributing

This is currently a personal project.

---
