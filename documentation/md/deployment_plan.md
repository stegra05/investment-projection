# Deployment Plan

This document outlines the steps for deploying the Investment Planning Projection website (React Frontend, Flask Backend, PostgreSQL Database) to a suitable hosting platform (e.g., Render, Heroku [cite: 164]).

**Target Environment:** Cloud Platform-as-a-Service (PaaS) with support for Python/Flask, Node.js/React, and PostgreSQL, adhering to the budget constraint[cite: 84].

## 1. Pre-Deployment Checks

* **[ ] Code Freeze (Optional but Recommended):** Temporarily halt major feature development to stabilize the code before deployment.
* **[ ] Final Testing:**
    * Run all automated tests (Pytest for backend[cite: 163], Jest for frontend [cite: 162]) and ensure they pass.
    * Perform final manual testing of all core ("Must-have") featuresin a production-like local environment.
* **[ ] Configuration Review:**
    * Ensure all necessary configuration settings (Database URL, Secret Keys, API keys, CORS origins) are managed via environment variables [cite: 83] and **not** hardcoded.
    * Verify production environment variable values are ready.
* **[ ] Database Migrations:** Ensure all database schema changes are captured in Flask-Migrate migration scripts[cite: 93].
* **[ ] Dependencies:** Confirm `requirements.txt` (backend) and `package.json` (frontend) list all necessary production dependencies.
* **[ ] Build Frontend:** Create a production build of the React application (e.g., using `npm run build` or `yarn build`). This generates optimized static files.
* **[ ] Version Control:** Ensure all code, including the frontend build artifacts (if not built on the platform), is committed and pushed to the main branch on GitHub[cite: 155].
* **[ ] Hosting Provider Setup:**
    * Choose a specific provider (e.g., Render [cite: 164]).
    * Create an account on the chosen hosting platform.
    * Provision a PostgreSQL database instance through the provider. Note the connection URL.
    * Set up necessary services/apps on the platform (one for the Flask backend, potentially one for serving React static files if not done via Flask/CDN).

## 2. Deployment Steps

*(Steps are generic; consult provider documentation for specifics)*

* **1. Configure Backend Service:**
    * Connect the hosting platform service to your GitHub repository[cite: 156].
    * Configure the build command (usually `pip install -r requirements.txt`).
    * Configure the start command (e.g., `gunicorn app:app` - Gunicorn is a common production WSGI server for Flask).
    * Set up production environment variables on the platform:
        * `DATABASE_URL` (pointing to the provisioned cloud PostgreSQL instance [cite: 152])
        * `FLASK_ENV=production`
        * `SECRET_KEY` (generate a strong random key)
        * Any other required API keys or settings.
* **2. Deploy Backend:**
    * Trigger the deployment process on the hosting platform (often automatic on push to the main branch).
    * Monitor the build and deployment logs for errors.
* **3. Run Database Migrations:**
    * Connect to the production environment (some platforms provide a shell or run command).
    * Run the database migration command (e.g., `flask db upgrade` [cite: 93]). **Crucial step!**
* **4. Configure Frontend Deployment:**
    * *(Option A: Serve static files via backend/CDN)* Configure Flask or a CDN to serve the React build files. Ensure backend routes don't clash with frontend routes.
    * *(Option B: Deploy as a separate static site)* Configure a static site service on the hosting platform, pointing to the frontend build directory in your GitHub repo or uploading the build artifacts. Set the build command (if needed, e.g., `npm run build`) and publish directory.
* **5. Deploy Frontend:** Trigger the deployment for the frontend static files.
* **6. Configure DNS (Optional):** If using a custom domain, update DNS records to point to the hosting provider's servers.
* **7. Enable HTTPS:** Ensure HTTPS is enforced for all traffic[cite: 72]. Most modern PaaS providers handle this automatically with managed certificates (like Let's Encrypt [cite: 524]).

## 3. Post-Deployment Verification

* **[ ] Access Application:** Open the live URL(s) in a browser.
* **[ ] Core Functionality Test:**
    * Test user registration and login[cite: 45].
    * Test creating/viewing a portfolio[cite: 42].
    * Test running a basic projection[cite: 44, 45].
* **[ ] Check Browser Console:** Look for any errors (JavaScript errors, failed network requests).
* **[ ] Check Server Logs:** Review backend logs on the hosting platform for any runtime errors.
* **[ ] Verify HTTPS:** Confirm the connection is secure (padlock icon in the browser address bar).

## 4. Rollback Procedure (Simple)

* **Option 1 (Provider Feature):** Many platforms allow redeploying a previous successful deployment via their dashboard with a single click. Identify this feature beforehand.
* **Option 2 (Git Revert):**
    1.  Identify the last working commit hash in Git.
    2.  Revert the changes locally (`git revert <commit-hash>`).
    3.  Push the revert commit to GitHub.
    4.  Trigger a new deployment on the hosting platform based on the reverted code.
* *(Database rollbacks are more complex and typically involve restoring from backups - ensure your hosting provider offers automated backups [cite: 80])*