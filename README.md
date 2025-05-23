# Investment Projection Web Application

## 1. Description

A web application designed for personal finance planners and finance students to build investment portfolios, plan future contributions/changes (including recurring ones), and visualize long-term (3-40 year) wealth projections based on user-defined assumptions. This project focuses on providing flexible planning capabilities with a Data-Focused Flat 2.0 aesthetic.

## 2. Features

The application implements the following core features:

*   **Portfolio Management (CRUD):** Create, view, edit, and delete investment portfolios.
*   **Asset Selection & Allocation:** Select core assets (e.g., Stocks, Bonds) and specify their allocation amount or weight within the portfolio. The UI provides guidance on total allocation and remaining percentages.
*   **Manual Expected Returns:** Input expected rates of return for individual assets or portfolio components.
*   **Future Change Planning:** Define and schedule future single and recurring portfolio changes (e.g., contributions, withdrawals, reallocations).
*   **Projection Visualization:** Calculate and display a visual graph of the projected portfolio value based on a deterministic model.
*   **User Authentication:** Secure user registration and login to save and manage portfolio data.
*   **Task Management:** Utilizes a background task queue (Celery) for handling potentially long-running operations like complex projections, with UI feedback on task status.
*   **User Interface:** A simple, clean, and efficient user interface following Flat 2.0 design principles, with clear error messaging (e.g., for asset allocation).
*   **(Should-have additions based on project context):**
    *   Define recurring future changes (e.g., monthly contributions). (SH-UX2)
    *   Asynchronous task processing for operations like projections. (SH-TK1)
    *   Display task status and progress in the UI. (SH-TK2)

## 3. Technology Stack

*   **Frontend:**
    *   **Framework/Library:** React
    *   **Build Tool/Dev Server:** Vite
    *   **Routing:** React Router
    *   **Styling:** Tailwind CSS
    *   **State Management:** Zustand (global), React Context/Hooks (local)
    *   **Data Fetching:** Axios
    *   **Charting:** Recharts
    *   **Animation (Considered):** Framer Motion
    *   **Code Quality:** ESLint, Prettier
    *   **Testing (Planned):** Jest/React Testing Library
*   **Backend:**
    *   **Framework:** Flask (Python)
    *   **Database:** PostgreSQL
    *   **ORM:** SQLAlchemy (with Flask-SQLAlchemy, Flask-Migrate)
    *   **Task Queue:** Celery
    *   **Message Broker/Result Backend:** Redis
    *   **API Interaction:** Pydantic (for data validation/serialization)
    *   **Authentication:** Flask-JWT-Extended
    *   **Security:** Flask-CORS, Flask-Limiter, Flask-Talisman
    *   **Testing:** Pytest
*   **DevOps & General:**
    *   **Containerization:** Docker, Docker Compose
    *   **Version Control:** Git / GitHub
    *   **Task Tracking:** Trello (conceptual)
    *   **Environment Management (local, non-Docker):** Python `venv` / Node.js `npm`

## 4. Setup (Local Development with Docker)

This project is designed to be run using Docker and Docker Compose for a consistent development environment.

1.  **Prerequisites:**
    *   Git
    *   Docker Engine
    *   Docker Compose
    *   Python 3.x (for any local pre-commit hooks or scripts, if not using Docker for everything)
    *   Node.js (npm/yarn) (for any local pre-commit hooks or scripts, if not using Docker for everything)

2.  **Clone Repository:**
    ```bash
    git clone https://github.com/stegra05/investment-projection
    ```

3.  **Navigate to Project Root:**
    ```bash
    cd investment-projection
    ```

4.  **Environment Configuration:**
    *   **Root `.env` File:** Copy the `.env.example` file in the project root to `.env`.
        ```bash
        cp .env.example .env
        ```
        Review and update the variables in this `.env` file. These are used by `docker-compose.yml` to configure services (database credentials, ports, etc.).
    *   **Backend `.env` File:** Copy the `backend/.env.example` file to `backend/.env`.
        ```bash
        cp backend/.env.example backend/.env
        ```
        Review and update the variables in `backend/.env`. These are specific to the Flask application (secret keys, API settings, etc.). **Important:** The `DATABASE_URL` in `backend/.env` should match the database service configured in `docker-compose.yml` and the root `.env` file (e.g., `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:${DB_PORT_INTERNAL}/${POSTGRES_DB}`).

5.  **Start Core Services (Database & Redis):**
    It's often useful to start the database and Redis first and ensure they are running correctly.
    ```bash
    docker-compose up -d db redis
    ```
    Wait for them to initialize. You can check their status with `docker-compose ps`.

6.  **Backend Setup (Docker):**
    *   The Docker image for the backend will be built automatically by Docker Compose. It handles Python environment setup and `pip install -r requirements.txt`.
    *   **Apply Database Migrations:** Once the `db` service is healthy, run database migrations *inside* the backend container.
        ```bash
        docker-compose exec backend flask db upgrade
        ```
        If this is the first time, you might need to initialize the migrations:
        ```bash
        # Only if migrations haven't been initialized in the project yet:
        # docker-compose exec backend flask db init 
        # docker-compose exec backend flask db migrate -m "Initial migration." 
        # docker-compose exec backend flask db upgrade
        ```
    *   The backend service can then be started (if not already running as a dependency):
        ```bash
        docker-compose up -d --build backend 
        # Use --build to ensure the image is up-to-date with any code changes.
        # Remove -d to see logs in the current terminal.
        ```

7.  **Frontend Setup (Docker):**
    *   The Docker image for the frontend will be built by Docker Compose. It handles Node.js setup and `npm install`.
    *   The frontend service can be started:
        ```bash
        docker-compose up -d --build frontend
        # Use --build to ensure the image is up-to-date.
        # Remove -d to see logs.
        ```

## 5. Usage (Local Development with Docker)

The primary way to run the application for local development is using Docker Compose.

1.  **Ensure Environment Variables are Set:**
    *   Verify that you have copied `.env.example` to `.env` in the project root and `backend/.env.example` to `backend/.env`.
    *   Ensure the variables in these files are correctly configured, especially `DATABASE_URL` in `backend/.env` to point to the Dockerized database service (e.g., `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:${DB_PORT_INTERNAL}/${POSTGRES_DB}`).

2.  **Start All Services with Docker Compose:**
    *   Navigate to the project root directory (where `docker-compose.yml` is located).
    *   To build (or rebuild) images and start all services (backend, frontend, celery worker, database, redis) in detached mode:
        ```bash
        docker-compose up -d --build
        ```
    *   To start services and see aggregated logs in your terminal (useful for debugging):
        ```bash
        docker-compose up --build
        ```
    *   If you need to start specific services, you can list them:
        ```bash
        docker-compose up -d --build db redis backend celeryworker frontend
        ```

3.  **Accessing the Application:**
    *   **Frontend:** Once the services are running, the frontend should be accessible at `http://localhost:3000` (or the `REACT_PORT_ON_HOST` defined in your root `.env` file).
    *   **Backend API:** The backend API will be available at `http://localhost:5000` (or the `FLASK_PORT_ON_HOST` defined in your root `.env` file). The frontend is configured to proxy requests to this address.

4.  **Stopping Services:**
    *   To stop all running services:
        ```bash
        docker-compose down
        ```
    *   To stop and remove volumes (e.g., to clear database data):
        ```bash
        docker-compose down -v
        ```

**Note on Local Non-Docker Setup:**
While Docker is the recommended approach, minimal setup for running outside Docker would involve:
*   Manually setting up and running PostgreSQL and Redis.
*   Setting up Python virtual environment for backend, installing `requirements.txt`.
*   Setting up Node.js environment for frontend, running `npm install`.
*   Managing environment variables manually for each service.
This method is not actively documented or supported as the primary development path.

### Accessing Logs

There are two primary ways to access logs when running the application with Docker Compose:

1.  **Via `docker-compose logs`:**
    This command fetches and displays the logs from the standard output/error streams of your containers. It's useful for a combined view or for services that primarily log to console.
    *   To view logs for all services and follow new output:
        ```bash
        docker-compose logs -f
        ```
    *   To view and follow logs for specific services:
        ```bash
        docker-compose logs -f backend
        docker-compose logs -f celeryworker
        docker-compose logs -f frontend
        docker-compose logs -f db
        docker-compose logs -f redis
        ```

2.  **Via Log Files (Backend Service):**
    The backend application (Flask and Celery worker) is configured to output detailed logs to files within the `backend` service container. These files are stored in the `/usr/src/app/logs` directory inside the container, which is mapped to `backend/logs` on your host machine due to the volume mount in `docker-compose.yml`.

    *   **Log File Locations (accessible at `backend/logs/` on host):**
        *   `flask_app.log`: Contains logs from the Flask web application, including request handling, API calls, and general application events. (Configured in `backend/config.py`)
        *   `celery_worker.log`: Contains logs specific to Celery task processing, including task execution, errors within tasks, and worker status. (Celery logging is also configured to use handlers defined in `backend/config.py`)
        *   `errors.log`: A consolidated log file that captures all messages logged at `ERROR` or `CRITICAL` levels from both the Flask app and Celery workers.
    *   **Log Format:** Logs include a timestamp, log level, logger name (indicating the source module/component), module, function name, line number, and the log message.
    *   **Log Rotation:** Log files are automatically rotated daily (at midnight), and a history of the last 7 days is kept to prevent files from growing excessively large. This is configured in `backend/config.py`.
    *   **Usage for Debugging (Tailing Logs within Container):**
        To monitor these log files in real-time directly from the container:
        ```bash
        docker-compose exec backend tail -f /usr/src/app/logs/flask_app.log
        docker-compose exec backend tail -f /usr/src/app/logs/celery_worker.log
        docker-compose exec backend tail -f /usr/src/app/logs/errors.log
        ```
        Alternatively, since these logs are volume-mounted to `backend/logs/` on your host:
        ```bash
        tail -f backend/logs/flask_app.log
        tail -f backend/logs/celery_worker.log
        tail -f backend/logs/errors.log
        ```
    *   Review these logs to understand application flow, diagnose errors, and track the execution of background tasks.

### Running Backend Tests

The backend includes a comprehensive suite of unit and integration tests using Pytest. Tests are run inside the Docker container to ensure an environment consistent with deployment.

**To run all backend tests:**

Execute the following command in your project root directory:
```bash
docker-compose exec backend pytest
```

**Test Configuration:**

*   **Pytest Configuration:** Test execution is configured in `backend/pytest.ini`. This file specifies test paths (`tests`), Python file patterns (`test_*.py`), and custom markers (e.g., `celery`).
*   **Test Environment:** Tests utilize the `TestingConfig` (defined in `backend/config.py`). This configuration ensures:
    *   An **in-memory SQLite database** is used for testing, providing speed and isolation from your development database.
    *   **Celery tasks run eagerly and synchronously** (`CELERY_TASK_ALWAYS_EAGER = True`), meaning background tasks are executed immediately in the same process, simplifying testing without needing a separate Celery worker.
    *   CSRF protection is typically disabled, and rate limiting might also be disabled for ease of testing.
    *   Debug mode is often enabled for more detailed error output.

**Test Coverage:**

To run tests and generate a code coverage report:

1.  Ensure `pytest-cov` is listed in `backend/requirements.txt` (it should be).
2.  Run the following command:
    ```bash
    docker-compose exec backend pytest --cov=app --cov-report=html
    ```
    This command will:
    *   Run all tests.
    *   Measure code coverage for the `app` module (located at `backend/app`).
    *   Generate an HTML report in `backend/htmlcov/`. You can open `backend/htmlcov/index.html` in your browser to explore coverage details. This directory is accessible on your host machine due to the volume mount.

**Running Specific Tests:**

You can run specific test files, directories, or tests marked with specific markers by appending standard Pytest arguments to the `docker-compose exec backend pytest` command.

*   **By file:**
    ```bash
    docker-compose exec backend pytest tests/unit/test_models.py
    docker-compose exec backend pytest tests/integration/test_auth_routes.py
    ```
*   **By directory:**
    ```bash
    docker-compose exec backend pytest tests/unit/
    docker-compose exec backend pytest tests/integration/
    docker-compose exec backend pytest tests/celery/
    ```
*   **By marker** (markers are defined in `backend/pytest.ini`, e.g., `celery`):
    ```bash
    docker-compose exec backend pytest -m celery
    # docker-compose exec backend pytest -m unit (if you add 'unit' marker in pytest.ini)
    # docker-compose exec backend pytest -m integration (if you add 'integration' marker in pytest.ini)
    ```
    (Note: The `celery` marker specifically targets tests for Celery tasks. Other markers like `unit` and `integration` can be added to `pytest.ini` and used to group tests.)

For more Pytest options and advanced usage, refer to the [official Pytest documentation](https://docs.pytest.org/).

## 6. Initial Task List (High-Level - *Status as of last major review*)

*(This section provides a snapshot. For up-to-date task status, refer to the project's Trello board or equivalent task management tool.)*

| ID  | Task Description                               | Priority | Est. Effort | Status        | Dependencies |
|-----|------------------------------------------------|----------|-------------|---------------|--------------|
| T1  | Project Setup & Boilerplate                    | Must     | M           | Completed     | -            |
| T2  | Basic Flask Backend Setup (API structure)      | Must     | M           | Completed     | T1           |
| T3  | PostgreSQL DB Setup & Migrations               | Must     | M           | Completed     | T1, T2       |
| T4  | User Auth Backend (Flask/SQLAlchemy)           | Must     | L           | Completed     | T3           |
| T5  | Core Portfolio Models & API (Flask/SQLAlchemy) | Must     | L           | Completed     | T3           |
| T6  | Backend Projection Engine (Core Logic)         | Must     | XL          | In Progress   | T5           |
| T7  | Basic React Frontend Setup (Vite)              | Must     | M           | Completed     | T1           |
| T8  | Frontend Auth Pages & Logic                    | Must     | L           | Completed     | T4, T7       |
| T9  | Frontend Portfolio Input/Mgmt UI               | Must     | L           | In Progress   | T5, T7       |
| T10 | Frontend Projection Viz Display                | Must     | L           | In Progress   | T6, T7       |
| T11 | Integrate FE/BE API Calls                      | Must     | L           | In Progress   | T8, T9, T10  |
| T12 | Basic Testing Setup (Jest/Pytest)              | Should   | M           | Completed     | T1           |


## 7. Development Guidelines

### File Naming Conventions

To maintain consistency and ensure proper build processes, follow these file naming conventions:

**Frontend Files (JavaScript - React):**
-   **React Components**: Use `.jsx` extension for all files containing JSX syntax.
    -   Example: `Button.jsx`, `PortfolioView.jsx`, `LoginForm.jsx`
-   **JavaScript Utilities/Modules**: Use `.js` extension for files without JSX (e.g., custom hooks, services, configurations, utility functions).
    -   Example: `useTheme.js`, `portfolioService.js`, `api.js`, `validation.js`
-   *(Note: TypeScript is not currently used in this project. If introduced, files would be `.ts` or `.tsx`.)*

**Backend Files (Python - Flask):**
-   **Python Files**: Use `.py` extension for all Python source code files.
-   **Configuration Files**: Use appropriate extensions based on the format (e.g., `.env` for environment variables, `pytest.ini` for Pytest config).

### Code Organization

The project follows a modular structure for both frontend and backend to promote separation of concerns and maintainability.

**Frontend Structure (`frontend/src/`):**
```
src/
├── api/                 # API service functions for backend communication (.js)
├── assets/              # Static assets (images, icons - if not in public/)
├── components/          # Global, reusable UI components (.jsx)
├── config/              # Frontend configuration (e.g., API base URLs) (.js)
├── constants/           # Application-wide constants (e.g., action types, text) (.js)
├── features/            # Feature-specific modules, each potentially containing its own components, hooks, pages, utils
│   ├── auth/            # Example: Authentication feature
│   │   ├── components/  # Auth-specific React components (.jsx)
│   │   ├── pages/       # Auth-related pages (e.g., LoginPage.jsx, RegistrationPage.jsx)
│   │   └── utils/       # Auth-specific utilities (e.g., validation.js)
│   └── portfolio/       # Example: Portfolio feature
│       ├── components/
│       ├── hooks/
│       ├── layouts/
│       ├── pages/
│       ├── utils/
│       └── views/
├── hooks/               # Global custom React hooks (.js)
├── layouts/             # Layout components (e.g., MainLayout.jsx) - if global ones exist
├── pages/               # Top-level page components (if not organized by feature)
├── store/               # Global state management stores (e.g., Zustand stores) (.js)
├── styles/              # Global styles, Tailwind base/plugins, main CSS file (index.css)
├── utils/               # Global utility functions (.js)
└── App.jsx              # Main application component
└── index.jsx            # Entry point for the React application
```
*(This structure is a general guide; refer to the `frontend/src` directory for the exact organization.)*

**Backend Structure (`backend/app/`):**
```
app/
├── models/              # SQLAlchemy ORM models (.py)
├── routes/              # API route blueprints/controllers (.py)
├── services/            # Business logic layer, interacting with models and other services (.py)
├── schemas/             # Pydantic schemas for request/response validation and serialization (.py)
├── utils/               # Utility functions and decorators (.py)
├── config/              # Configuration loading (though main config is in backend/config.py)
├── enums.py             # Enumerations used across the backend
├── error_handlers.py    # Global error handlers
└── __init__.py          # Application factory (create_app)
```
*(This structure is a general guide; refer to the `backend/app` directory for the exact organization.)*

### Import Statement Standards (Frontend - JavaScript/React)

-   **Clarity with Extensions:** While Vite (the frontend build tool) can resolve imports without extensions for `.js` and `.jsx` files, it is preferred to **use explicit file extensions** (e.g., `import MyComponent from './MyComponent.jsx';`) for custom module imports. This improves clarity and reduces ambiguity, especially when dealing with files that might have the same base name but different types (e.g., `utils.js` vs. `utils.css`).
-   **Grouping and Ordering:** Group imports for better readability:
    1.  React and core React libraries (e.g., `react`, `react-router-dom`).
    2.  External/third-party libraries (e.g., `axios`, `recharts`, `zustand`).
    3.  Internal absolute imports (e.g., from aliases if configured, or full paths from `src/`).
    4.  Internal relative imports (e.g., `../components/`, `./utils.js`).
-   **Example:**
    ```javascript
    import React, { useState, useEffect } from 'react'; // React imports
    import { Link, useNavigate } from 'react-router-dom';
    
    import axios from 'axios'; // External libraries
    import { useStore } from 'zustand';
    
    import MainLayout from 'src/layouts/MainLayout.jsx'; // Internal absolute/aliased
    import { apiService } from 'src/api/apiService.js';
    
    import MyButton from '../components/common/MyButton.jsx'; // Internal relative
    import { someUtilFunction } from './utils.js';
    ```

## 8. Contributing

This is currently a personal project. If you are interested in contributing, please reach out to the project owner.

---
