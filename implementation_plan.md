# Robust Logging Implementation Plan

This document outlines the steps to implement robust, file-based logging for the backend Flask application and Celery workers.

## I. Core Logging Configuration (Python `logging` module)

-   [ ] **1. Create `logs` Directory:**
    -   [ ] Manually create a `backend/logs/` directory.
    -   [ ] Add `backend/logs/` to `.gitignore` to prevent log files from being committed.
-   [ ] **2. Define Log Formatters in `backend/config.py`:**
    -   [ ] Define a verbose formatter (e.g., `detailed_formatter`) including: `asctime`, `levelname`, `name` (logger name), `module`, `funcName`, `lineno`, and `message`.
    -   [ ] Define a simpler formatter for the console if needed (optional, as console output might be removed or reduced).
-   [ ] **3. Define File Handlers in `backend/config.py`:**
    -   [ ] **Flask App Log (`flask_app.log`):**
        -   [ ] `TimedRotatingFileHandler` for `backend/logs/flask_app.log`.
        -   [ ] Configure daily rotation (e.g., `when='midnight'`, `interval=1`).
        -   [ ] Configure backup count (e.g., `backupCount=7` for 7 days of logs).
        -   [ ] Apply the `detailed_formatter`.
        -   [ ] Set default log level (e.g., `DEBUG` for development, `INFO` for production, driven by `Config` classes).
    -   [ ] **Celery Worker Log (`celery_worker.log`):**
        -   [ ] `TimedRotatingFileHandler` for `backend/logs/celery_worker.log`.
        -   [ ] Configure daily rotation.
        -   [ ] Configure backup count.
        -   [ ] Apply the `detailed_formatter`.
        -   [ ] Set default log level (e.g., `DEBUG` for development, `INFO` for production).
    -   [ ] **Consolidated Error Log (`errors.log`):**
        -   [ ] `TimedRotatingFileHandler` for `backend/logs/errors.log`.
        -   [ ] Configure daily rotation.
        -   [ ] Configure backup count.
        -   [ ] Apply the `detailed_formatter`.
        -   [ ] Set log level to `ERROR` (to capture only `ERROR` and `CRITICAL` messages).
-   [ ] **4. Define Console Handler in `backend/config.py` (Optional but Recommended for Dev):**
    -   [ ] `StreamHandler` for console output (`sys.stderr` or `sys.stdout`).
    -   [ ] Apply `detailed_formatter` or a simpler one.
    -   [ ] Set log level (e.g., `INFO` or `DEBUG` for development, possibly `WARNING` or disabled in production for console).

## II. Flask Application Logging Setup

-   [ ] **1. Modify `backend/app/__init__.py` (`create_app` function):**
    -   [ ] Remove or comment out the global `logging.basicConfig()` from `backend/run.py` if it conflicts.
    -   [ ] Get the current configuration object (e.g., `config[config_name]`).
    -   [ ] Explicitly configure `app.logger`:
        -   [ ] Clear any default handlers Flask might add: `app.logger.handlers = []`.
        -   [ ] Add the configured `TimedRotatingFileHandler` for `flask_app.log`.
        -   [ ] Add the configured `TimedRotatingFileHandler` for `errors.log` (filtered for ERROR level).
        -   [ ] Add the configured `StreamHandler` (console) if desired for the current environment.
        -   [ ] Set `app.logger.setLevel()` based on the environment (e.g., `DEBUG` or `INFO`).
    -   [ ] Ensure SQLAlchemy logging is configured (or explicitly decided against for now). Default is usually quiet. If verbose SQL logging is needed:
        -   [ ] `logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)` (or `DEBUG`)
        -   [ ] Add a handler for `sqlalchemy.engine` to `flask_app.log` or a separate SQL log.

## III. Celery Worker Logging Setup

-   [ ] **1. Modify `backend/celery_worker.py` (or Celery app setup location):**
    -   [ ] Leverage Celery signals for logging setup (`after_setup_logger` or `setup_logging`).
        -   Reference: [Celery Logging Docs](https://docs.celeryq.dev/en/stable/userguide/signals.html#setup_logging)
    -   [ ] Inside the signal handler:
        -   [ ] Get the root Celery logger (e.g., `celery.utils.log.get_task_logger(__name__)` or `logging.getLogger('celery')`).
        -   [ ] Clear any default Celery handlers if necessary.
        -   [ ] Add the configured `TimedRotatingFileHandler` for `celery_worker.log`.
        -   [ ] Add the configured `TimedRotatingFileHandler` for `errors.log` (filtered for ERROR level).
        -   [ ] Add the configured `StreamHandler` (console) if desired for the current environment.
        -   [ ] Set the logger's level (e.g., `DEBUG` or `INFO`).
    -   [ ] Ensure the Celery worker command (`celery -A ... worker`) does not override with its own `-l` or `--loglevel` if we want the code configuration to take full precedence (or ensure they match).

## IV. Review and Refine Existing Log Calls

-   [ ] **1. Standardize Logger Names:**
    -   [ ] Review all `logging.*` calls (especially in `services`, `models`, `utils` not directly using `current_app.logger`).
    -   [ ] Ensure they use `logging.getLogger(__name__)` to get a module-specific logger. This helps with filtering and context in logs (the `%(name)s` part of the format).
    -   [ ] Calls using `current_app.logger` or `app.logger` are generally fine as their name will be related to the app.
-   [ ] **2. Verify Log Levels:**
    -   [ ] Review existing `DEBUG`, `INFO`, `WARNING`, `ERROR`, `EXCEPTION` calls.
    -   [ ] Ensure they use the appropriate level for the message's severity.
    -   [ ] Convert any `print()` statements used for debugging to `logger.debug()`.
-   [ ] **3. Enhance Context:**
    -   [ ] Where appropriate, add more contextual information to log messages (e.g., relevant IDs, states).
-   [ ] **4. Add Request Logging (Flask - Optional Enhancement):**
    -   [ ] Implement an `@app.after_request` handler in `backend/app/__init__.py` or a dedicated request logging module.
    -   [ ] Log details like `request.method`, `request.path`, `response.status_code`, `request.remote_addr`, request duration.

## V. Testing and Verification

-   [ ] **1. Run the Application (Flask & Celery):**
    -   [ ] Start the Flask development server.
    -   [ ] Start the Celery worker.
-   [ ] **2. Trigger Loggable Events:**
    -   [ ] Make successful API requests.
    -   [ ] Make requests that cause validation errors (4xx).
    -   [ ] Trigger actions that result in server errors (5xx).
    -   [ ] Dispatch and complete Celery tasks successfully.
    -   [ ] Dispatch Celery tasks that are expected to fail.
-   [ ] **3. Verify Log Files:**
    -   [ ] Check `backend/logs/flask_app.log` for Flask-related messages.
    -   [ ] Check `backend/logs/celery_worker.log` for Celery-related messages.
    -   [ ] Check `backend/logs/errors.log` for ERROR/CRITICAL messages from both.
    -   [ ] Confirm log format is correct.
    -   [ ] Confirm log levels are working as expected (e.g., DEBUG messages appear if level is DEBUG).
-   [ ] **4. Verify Log Rotation (Simulate or Wait):**
    -   [ ] Check if logs rotate after reaching the configured time/size (can be simulated by changing system time or using a small size for `RotatingFileHandler` temporarily for testing).
-   [ ] **5. Verify Console Output:**
    -   [ ] Check console output matches expectations based on console handler configuration.

## VI. Documentation and Cleanup

-   [ ] **1. Update `README.md`:**
    -   [ ] Briefly mention the new logging setup and log file locations.
    -   [ ] Explain how to access logs for debugging.
-   [ ] **2. Review `.gitignore`:**
    -   [ ] Double-check `backend/logs/` is present and correct.
    -   [ ] Ensure no other sensitive files (like `.env` if not already gitignored) are accidentally committed.
-   [ ] **3. Final Code Review:**
    -   [ ] Review all logging-related changes for clarity, correctness, and consistency.

---
Once this plan is in place, we can start tackling these items one by one. 