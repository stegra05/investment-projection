# Docker & Docker Compose Usage Cheatsheet
## For the Investment Projection Project

This cheatsheet provides common Docker and Docker Compose commands relevant to managing your development environment for this project. Run these commands from your project's root directory (where `docker-compose.yml` is located).

## 1. Building Images

- **Build all services defined in `docker-compose.yml`:**
  ```bash
  docker-compose build
  ```
- **Build a specific service:**
  ```bash
  docker-compose build <service_name>
  ```
  *Example:* `docker-compose build backend`

- **Build images without using cache (for a clean build):**
  ```bash
  docker-compose build --no-cache
  ```

## 2. Starting Services

- **Start all services in attached mode (shows logs in the current terminal):**
  ```bash
  docker-compose up
  ```
- **Start all services and rebuild images if they changed or if Dockerfiles changed:**
  ```bash
  docker-compose up --build
  ```
- **Start all services in detached mode (runs in the background):**
  ```bash
  docker-compose up -d
  ```
- **Start specific services:**
  ```bash
  docker-compose up <service_name_1> <service_name_2>
  ```
  *Example:* `docker-compose up backend redis`

## 3. Stopping Services

- **Stop and remove containers, networks, and default volumes (if running in attached mode, press `Ctrl+C` first):**
  ```bash
  docker-compose down
  ```
- **Stop and remove containers, networks, AND named volumes (like database data - USE WITH CAUTION!):**
  ```bash
  docker-compose down -v
  ```
- **Stop services without removing containers (useful if you want to quickly `docker-compose start` them again):**
  ```bash
  docker-compose stop
  ```
  *(To start them again: `docker-compose start`)*

## 4. Viewing Logs

- **View logs for all running services (if detached):**
  ```bash
  docker-compose logs
  ```
- **Follow (stream) logs for all running services (if detached):**
  ```bash
  docker-compose logs -f
  ```
- **View logs for a specific service:**
  ```bash
  docker-compose logs <service_name>
  ```
  *Example:* `docker-compose logs backend`

- **Follow (stream) logs for a specific service:**
  ```bash
  docker-compose logs -f <service_name>
  ```
  *Example:* `docker-compose logs -f celeryworker`

- **Show logs with timestamps:**
  ```bash
  docker-compose logs -t
  ```
- **Show last N lines of logs:**
  ```bash
  docker-compose logs --tail=50 <service_name>
  ```

## 5. Executing Commands in Running Containers

This is essential for tasks like database migrations, running tests, or accessing a shell inside a container.

- **Execute a command in a running service's container:**
  ```bash
  docker-compose exec <service_name> <command_to_run>
  ```
- **Examples for this project:**
    - **Run database migrations (Flask):**
      ```bash
      docker-compose exec backend flask db upgrade
      ```
      *(Other migration commands: `flask db init`, `flask db migrate -m "your message"`)*
    - **Run backend tests (Pytest):**
      ```bash
      docker-compose exec backend pytest
      ```
    - **Open a bash shell inside the backend container:**
      ```bash
      docker-compose exec backend bash
      ```
    - **Open a sh shell inside the frontend container (Alpine images often use `sh`):**
      ```bash
      docker-compose exec frontend sh
      ```

## 6. Restarting Services

- **Restart all services:**
  ```bash
  docker-compose restart
  ```
- **Restart a specific service:**
  ```bash
  docker-compose restart <service_name>
  ```
  *Example (after changing Celery task code):* `docker-compose restart celeryworker`

## 7. Listing and Managing Docker Resources

- **List running containers managed by Docker Compose for the current project:**
  ```bash
  docker-compose ps
  ```
- **List all running Docker containers on your system:**
  ```bash
  docker ps
  ```
- **List all Docker containers on your system (including stopped ones):**
  ```bash
  docker ps -a
  ```
- **List Docker images:**
  ```bash
  docker images
  ```
- **List Docker volumes:**
  ```bash
  docker volume ls
  ```
- **Remove a specific Docker volume (BE CAREFUL - this deletes data if it's a data volume):**
  ```bash
  docker volume rm <volume_name>
  ```
  *Example (to remove the PostgreSQL data volume for this project, if named `projectname_postgres_data`):* `docker volume rm investment-projection_postgres_data` (The actual name might vary slightly based on your project directory name).

- **Clean up unused Docker resources (stopped containers, dangling images, unused networks, build cache):**
  ```bash
  docker system prune
  ```
- **Clean up ALL unused Docker resources INCLUDING VOLUMES (VERY DESTRUCTIVE - USE WITH EXTREME CAUTION!):**
  ```bash
  docker system prune -a --volumes
  ```

## 8. Quick Troubleshooting Tips

- **Port Conflicts:** If a service fails to start because a port is already in use on your host, change the host-side port mapping in `docker-compose.yml`. For example, change `ports: - "5000:5000"` to `ports: - "5001:5000"` for the backend service if port 5000 is taken on your host. Then access it via `http://localhost:5001`.
- **Environment Variables:** Double-check that environment variables are correctly defined in your root `.env` file and referenced correctly in `docker-compose.yml`. Ensure service names (like `db`, `redis`) are used for inter-container communication URLs (e.g., `DATABASE_URL=postgresql://user:pass@db:5432/dbname`).
- **Volume Mounts & Hot Reloading:** If hot reloading isn't working:
    - Verify volume paths in `docker-compose.yml` are correct.
    - For React, ensure `CHOKIDAR_USEPOLLING=true` is set.
    - For Flask, ensure `FLASK_ENV=development` (or `DEBUG=True`) is set.
- **Build Issues:** If `docker-compose build` fails, examine the output for errors. It often points to issues in a `Dockerfile` (e.g., missing dependencies, incorrect commands) or problems installing packages from `requirements.txt` / `package.json`.
- **"Service ... failed to build: ...":** Look at the error messages above this line. It usually indicates a problem within the `Dockerfile` for that service.
- **"Cannot connect to the Docker daemon":** Make sure Docker Desktop is running.

This cheatsheet should cover most of your daily Docker interactions for this project!
