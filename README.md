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
* **Database Interaction:** SQLAlchemy (with Flask-SQLAlchemy/Flask-Migrate)
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
3.  **Option A: Manual Startup (Individual Components)**
    *   **Run Backend Flask Application:**
        *   In a terminal, navigate to the `backend` directory.
        *   Activate the virtual environment: `source .venv/bin/activate` (Linux/macOS) or `.\venv\Scripts\activate` (Windows).
        *   Set required environment variables (e.g., `FLASK_APP=run.py`, `FLASK_ENV=development`, `DATABASE_URL`). Refer to `.env.example` or your local `.env` file for necessary variables.
        *   Run the Flask app: `flask run`. This will typically serve on `http://127.0.0.1:5000`.
    *   **Run Celery Worker:**
        *   **In a separate terminal window:**
        *   Navigate to the `backend` directory.
        *   Activate the virtual environment.
        *   Set the `FLASK_CONFIG` environment variable if you use different configurations (e.g., `export FLASK_CONFIG=development`). The `celery_worker.py` script will use this or default to 'default'.
        *   Run the Celery worker: `celery -A celery_worker.app_celery worker -l INFO`.
    *   **Run Frontend:**
        *   Navigate to the `frontend` directory.
        *   `npm start` (or `yarn start`).
4.  **Option B: Automated Startup Script (macOS)**
    *   A helper script `start_dev_env.sh` is provided at the root of the project to automate starting the Flask backend, Celery worker, and React frontend in separate Terminal windows on macOS.
    *   **First-time setup:** Make the script executable:
        ```bash
        chmod +x start_dev_env.sh
        ```
    *   **Run the script:**
        ```bash
        ./start_dev_env.sh
        ```
    *   **Stopping the Automated Environment:**
        *   A corresponding `stop_dev_env.sh` script is provided to stop all services initiated by `start_dev_env.sh`.
        *   **First-time setup (if not already done):** Make the script executable:
            ```bash
            chmod +x stop_dev_env.sh
            ```
        *   **Run the stop script:**
            ```bash
            ./stop_dev_env.sh
            ```
        *   This script will attempt to terminate the Flask backend, Celery worker, and the React frontend development server processes. You can verify their termination by checking if the services are unresponsive or by using process monitoring tools (e.g., `ps aux | grep flask`). The terminal windows opened by the start script will remain open but the processes within them should have exited.
    *   **Important Notes for `start_dev_env.sh`:**
        *   On macOS, you might need to grant Terminal permission to control other apps (System Settings -> Privacy & Security -> Automation) the first time you run it.
        *   This script is currently tailored for macOS using `osascript`. For Linux/Windows, you'll need to adapt the commands for opening new terminals or use Option A.
5.  Access application via browser at `http://localhost:3000` (or the port specified by React).

### Accessing Logs

The backend application (Flask and Celery) is configured to output detailed logs to files, which is essential for development and debugging.

*   **Log File Locations:** All log files are stored in the `backend/logs/` directory.
    *   `flask_app.log`: Contains logs from the Flask web application, including request handling, API calls, and general application events.
    *   `celery_worker.log`: Contains logs specific to Celery task processing, including task execution, errors within tasks, and worker status.
    *   `errors.log`: A consolidated log file that captures all messages logged at `ERROR` or `CRITICAL` levels from both the Flask app and Celery workers. This is useful for quickly identifying critical issues.
*   **Log Format:** Logs include a timestamp, log level, logger name (indicating the source module/component), module, function name, line number, and the log message.
*   **Log Rotation:** Log files are automatically rotated daily, and a history of the last 7 days is kept to prevent files from growing excessively large.
*   **Usage for Debugging:**
    *   To monitor logs in real-time, you can "tail" the log files in your terminal. For example:
        ```bash
        tail -f backend/logs/flask_app.log
        tail -f backend/logs/celery_worker.log
        tail -f backend/logs/errors.log
        ```
    *   Review these logs to understand application flow, diagnose errors, and track the execution of background tasks.

### Running Backend Tests

The backend includes a comprehensive suite of unit and integration tests using Pytest.

To run the tests:

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Ensure you have the development and testing dependencies installed (refer to the setup instructions, typically from `requirements.txt`). If you haven't already, activate your virtual environment:
    ```bash
    source venv/bin/activate  # Linux/macOS
    # OR
    .\venv\Scripts\activate  # Windows
    ```
3.  Run Pytest:
    ```bash
    pytest
    ```

**Test Configuration:**

*   Test execution is configured in `pytest.ini` located in the `backend` directory. This file includes settings for markers (like `celery`, `integration`, `unit`) and default options.
*   The tests utilize an in-memory SQLite database for speed and isolation, as defined in the `TestingConfig` (see `backend/config.py`). Your original development database data is not affected.
*   Celery background tasks are configured to run eagerly and synchronously during testing (`CELERY_TASK_ALWAYS_EAGER = True` in `TestingConfig`), so no separate Celery worker process is needed to run tests involving Celery tasks.

**Test Coverage:**

To run tests and generate a coverage report (ensure `pytest-cov` is installed, which should be part of `requirements.txt` development dependencies):

```bash
pytest --cov=app --cov-report=html
```
This command will:
*   Run all tests.
*   Measure code coverage for the `app` module (located at `backend/app`).
*   Generate an HTML report in `backend/htmlcov/index.html` which you can open in a browser to explore coverage details.

**Running Specific Tests:**

You can run specific test files, directories, or tests marked with specific markers.

*   **By file:**
    ```bash
    pytest tests/unit/test_models.py
    pytest tests/integration/test_auth_routes.py
    ```
*   **By directory:**
    ```bash
    pytest tests/unit/
    pytest tests/integration/
    pytest tests/celery/
    ```
*   **By marker:** (Markers are defined in `pytest.ini`)
    ```bash
    pytest -m unit
    pytest -m integration
    pytest -m celery 
    ```
    (Note: The `celery` marker specifically targets tests for Celery tasks, though most Celery-related integration tests might also fall under the `integration` marker.)

For more Pytest options, refer to the [official Pytest documentation](https://docs.pytest.org/).

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


## 7. Development Guidelines

### File Naming Conventions

To maintain consistency and ensure proper build processes, follow these file naming conventions:

**Frontend Files:**
- **React Components**: Use `.jsx` extension for all files containing JSX syntax
  - Example: `Button.jsx`, `PortfolioView.jsx`, `LoginForm.jsx`
- **JavaScript Utilities**: Use `.js` extension for files without JSX (hooks, services, configurations)
  - Example: `useTheme.js`, `portfolioService.js`, `api.js`
- **TypeScript**: Use `.tsx` for TypeScript files with JSX, `.ts` for TypeScript files without JSX

**Backend Files:**
- **Python Files**: Use `.py` extension for all Python files
- **Configuration Files**: Use appropriate extensions (`.json`, `.yaml`, `.env`)

### Code Organization

**Frontend Structure:**
```
src/
├── components/           # Reusable UI components (.jsx)
├── features/            # Feature-specific components and logic
│   └── auth/
│       ├── components/  # Feature-specific components (.jsx)
│       ├── hooks/       # Feature-specific hooks (.js)
│       └── pages/       # Feature pages (.jsx)
├── hooks/               # Global custom hooks (.js)
├── api/                 # API service functions (.js)
├── store/               # Global state management (.js)
├── constants/           # Application constants (.js)
└── utils/               # Utility functions (.js)
```

**Backend Structure:**
```
app/
├── models/              # SQLAlchemy models (.py)
├── routes/              # Flask route blueprints (.py)
├── services/            # Business logic layer (.py)
├── schemas/             # Pydantic schemas (.py)
└── utils/               # Utility functions (.py)
```

### Import Statement Standards

- Always use explicit file extensions in imports for component files
- Use relative imports for local files, absolute imports for shared utilities
- Group imports: React first, external libraries, then internal imports

```javascript
// Good examples:
import React, { useState } from 'react';
import Button from '../../../components/Button/Button.jsx';
import { usePortfolio } from '../state/PortfolioContext';
import portfolioService from '../../../api/portfolioService.js';

// Avoid:
import Button from '../../../components/Button/Button'; // Missing extension
```

## 8. Contributing

This is currently a personal project.

---
