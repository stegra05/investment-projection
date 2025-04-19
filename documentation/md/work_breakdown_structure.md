# Detailed Work Breakdown Structure (WBS)

This WBS breaks down the high-level tasks from the project README [cite: 98] into smaller sub-tasks for more detailed planning.

## 1. Project Setup & Boilerplate (T1) [cite: 100]
    - 1.1. Initialize Git repository locally and on GitHub [cite: 464, 466, 467] [DONE]
    - 1.2. Create project directory structure (e.g., backend/, frontend/, docs/) [DONE]
    - 1.3. Set up Python virtual environment (`venv`) for backend [cite: 160, 834] [DONE]
    - 1.4. Set up Node.js environment (npm/yarn) for frontend [cite: 91] [DONE]
    - 1.5. Create initial README, LICENSE, .gitignore files [cite: 812, 822] [DONE]

## 2. Basic Flask Backend Setup (T2) [cite: 103]
    - 2.1. Install Flask and essential extensions (e.g., Flask-SQLAlchemy, Flask-Migrate, Flask-CORS) [cite: 92] [DONE]
    - 2.2. Create basic Flask application structure (`app.py` or package) [DONE]
    - 2.3. Configure environment variables (e.g., `FLASK_APP`, `DATABASE_URL`, `SECRET_KEY`) [cite: 83] [DONE]
    - 2.4. Set up basic API routing structure (e.g., using Blueprints) [DONE]

## 3. PostgreSQL DB Setup & Migrations (T3) [cite: 106]
    - 3.1. Install and configure local PostgreSQL server [cite: 91] [DONE]
    - 3.2. Create development database and user roles [DONE]
    - 3.3. Integrate Flask-SQLAlchemy and Flask-Migrate with the Flask app [cite: 92] [DONE]
    - 3.4. Define initial database models (e.g., User) [cite: 155] [DONE]
    - 3.5. Generate and apply initial database migration [cite: 93] [DONE]

## 4. User Authentication Backend (T4) [cite: 109]
    - 4.1. Finalize User database model (including password hashing field) [cite: 71]
    - 4.2. Implement password hashing (using bcrypt) [cite: 71, 517]
    - 4.3. Create API endpoints for user registration (`/register`)
    - 4.4. Create API endpoints for user login (`/login`, returning token/session)
    - 4.5. Create API endpoints for user logout (`/logout`)
    - 4.6. Implement password reset functionality (e.g., email link - may need email service setup) [cite: 47]
    - 4.7. Add authorization checks (e.g., require login for certain endpoints) [cite: 70]

## 5. Core Portfolio Models & API (T5) [cite: 111]
    - 5.1. Define Database Models (SQLAlchemy) for:
        - Portfolio
        - Asset (linking to Portfolio)
        - PlannedFutureChange (linking to Portfolio)
    - 5.2. Generate and apply database migrations for new models
    - 5.3. Create API endpoints for Portfolio CRUD (Create, Read, Update, Delete) [cite: 43]
    - 5.4. Create API endpoints for managing Assets within a Portfolio [cite: 40, 41]
    - 5.5. Create API endpoints for managing PlannedFutureChanges within a Portfolio [cite: 44]

## 6. Backend Projection Engine (T6) [cite: 113]
    - 6.1. Research/define core projection calculation logic (considering returns, time, future changes)
    - 6.2. Implement projection calculation function(s) in Python
    - 6.3. Integrate projection logic with portfolio/asset/change data fetched via SQLAlchemy
    - 6.4. Create API endpoint (`/projections`) to trigger calculations and return results [cite: 17]
    - 6.5. Consider performance optimization for calculations (if needed) [cite: 29]

## 7. Basic React Frontend Setup (T7) [cite: 116]
    - 7.1. Create React application using `create-react-app` or similar tool [cite: 831]
    - 7.2. Set up project structure (components/, pages/, services/, etc.)
    - 7.3. Configure basic routing (e.g., using React Router)
    - 7.4. Set up basic styling approach (e.g., CSS modules, styled-components)

## 8. Frontend Authentication Pages & Logic (T8) [cite: 119]
    - 8.1. Create Registration page/component UI
    - 8.2. Create Login page/component UI
    - 8.3. Implement frontend logic to call backend registration API
    - 8.4. Implement frontend logic to call backend login API (store token/session)
    - 8.5. Implement frontend logic for logout
    - 8.6. Set up protected routes (redirect if not logged in)
    - 8.7. Implement UI for password reset flow

## 9. Frontend Portfolio Input/Management UI (T9) [cite: 122]
    - 9.1. Create UI components for displaying list of portfolios
    - 9.2. Create UI form/component for creating/editing a portfolio
    - 9.3. Create UI components for adding/editing assets within a portfolio [cite: 40, 41]
    - 9.4. Create UI components for defining/editing planned future changes [cite: 44]
    - 9.5. Integrate UI components with backend Portfolio/Asset/Change APIs [cite: 128]

## 10. Frontend Projection Visualization Display (T10) [cite: 125]
    - 10.1. Select and install a charting library (e.g., Chart.js, Recharts)
    - 10.2. Create UI component to trigger projection calculation via API call
    - 10.3. Create UI component to display the projection graph using the chosen library [cite: 45, 21]
    - 10.4. Handle loading and error states for the visualization

## 11. Integrate FE/BE API Calls (T11) [cite: 128]
    - 11.1. Set up mechanism for frontend to make API calls (e.g., `axios`, `fetch`)
    - 11.2. Configure CORS on Flask backend to allow requests from React frontend
    - 11.3. Ensure authentication tokens/sessions are sent with relevant requests
    - 11.4. Implement error handling for API calls on the frontend
    - 11.5. Connect all frontend components (Auth, Portfolio, Projection) to their respective backend API endpoints

## 12. Basic Testing Setup (T12) [cite: 131]
    - 12.1. Configure Jest for React frontend testing [cite: 162]
    - 12.2. Write sample Jest unit tests for 1-2 core React components
    - 12.3. Configure Pytest for Flask backend testing [cite: 163]
    - 12.4. Write sample Pytest unit tests for 1-2 backend utility functions or models