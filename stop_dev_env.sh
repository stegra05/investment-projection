#!/bin/bash

echo "Attempting to stop development environment processes..."

# Stop Backend Flask Application
echo "Stopping Flask backend..."
pkill -f "flask run"
if [ $? -eq 0 ]; then
    echo "Flask backend process(es) sent kill signal."
else
    echo "Flask backend process(es) not found or already stopped."
fi

# Stop Celery Worker
echo "Stopping Celery worker..."
pkill -f "celery -A celery_worker.app_celery worker"
if [ $? -eq 0 ]; then
    echo "Celery worker process(es) sent kill signal."
else
    echo "Celery worker process(es) not found or already stopped."
fi

# Stop Frontend React Application
# This will kill the 'npm start' process. Often, this also stops the child Node server.
echo "Stopping Frontend React app (npm start)..."
pkill -f "npm start"
if [ $? -eq 0 ]; then
    echo "Frontend (npm start) process(es) sent kill signal."
else
    echo "Frontend (npm start) process(es) not found or already stopped."
fi

echo ""
echo "Process stop commands issued."
echo "Please verify in your terminals or using a process monitor (e.g., 'ps aux | grep flask', 'ps aux | grep celery', 'ps aux | grep npm') that the processes have terminated."
echo "If any processes are still running, you may need to close the terminal windows manually or use 'kill <PID>'." 