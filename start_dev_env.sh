#!/bin/bash

# Get the absolute path to the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo "Starting development environment..."

# --- Start Backend Flask Application ---
echo "Attempting to start Backend Flask Application in a new terminal..."
osascript <<EOF
tell app "Terminal"
    do script "cd '$BACKEND_DIR' && echo 'Starting Flask Backend...' && source .venv/bin/activate && flask run"
end tell
EOF

# --- Start Celery Worker ---
echo "Attempting to start Celery Worker in a new terminal..."
osascript <<EOF
tell app "Terminal"
    do script "cd '$BACKEND_DIR' && echo 'Starting Celery Worker...' && source .venv/bin/activate && export FLASK_CONFIG=development && celery -A celery_worker.app_celery worker -l INFO"
end tell
EOF

# --- Start Frontend React Application ---
echo "Attempting to start Frontend React Application in a new terminal..."
osascript <<EOF
tell app "Terminal"
    do script "cd '$FRONTEND_DIR' && echo 'Starting Frontend React App...' && npm start"
end tell
EOF

echo "Development environment startup initiated."
echo "Please ensure PostgreSQL and Redis servers are running."
echo "NOTE: You might need to grant Terminal access to control other apps (System Settings -> Privacy & Security -> Automation)."