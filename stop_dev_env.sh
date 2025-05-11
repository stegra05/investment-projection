#!/bin/bash

# Window Titles (must match those in start_dev_env.sh)
FLASK_WINDOW_TITLE="DEV_ENV: Flask Backend"
CELERY_WINDOW_TITLE="DEV_ENV: Celery Worker"
FRONTEND_WINDOW_TITLE="DEV_ENV: React Frontend"
REDIS_WINDOW_TITLE="DEV_ENV: Redis Server"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${MAGENTA}--- Attempting to Stop Development Environment Processes and Windows ---${NC}"
echo ""

# --- Function to Close Terminal Windows/Tabs by Title ---
close_terminal_by_title() {
    local window_title_to_close="$1"
    echo -e "${BLUE}Attempting to close terminal window/tab with title: '${window_title_to_close}'...${NC}"

    # Check if Terminal app is running
    if ! pgrep -x "Terminal" > /dev/null; then
        echo -e "${YELLOW}Terminal application is not running. Skipping window close for '${window_title_to_close}'.${NC}"
        echo ""
        return
    fi

    # Check if osascript is available
    if ! command -v osascript >/dev/null; then
        echo -e "${RED}Error: osascript command not found. Cannot close terminal windows.${NC}"
        return 1
    fi

    osascript <<'EOF'
    tell application "Terminal"
        set target_title to "$window_title_to_close"
        set window_or_tab_closed to false

        try
            -- Check windows first
            repeat with w in windows
                try
                    if name of w is target_title or custom title of w is target_title then
                        close w
                        set window_or_tab_closed to true
                        exit repeat
                    end if
                end try
            end repeat

            -- If no window matched, check tabs within windows
            if not window_or_tab_closed then
                repeat with w in windows
                    repeat with t in tabs of w
                        try
                            if custom title of t is target_title then
                                close t
                                set window_or_tab_closed to true
                                exit repeat
                            end if
                        end try
                    end repeat
                    if window_or_tab_closed then exit repeat
                end repeat
            end if
        on error errMsg
            return "Error: " & errMsg
        end try
    end tell
EOF

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Successfully closed terminal for '${window_title_to_close}'.${NC}"
    else
        echo -e "${YELLOW}Failed to close terminal for '${window_title_to_close}'. It might have been closed manually.${NC}"
    fi
    echo ""
}

# --- Stop Backend Flask Application ---
echo -e "${BLUE}Stopping Flask backend process...${NC}"
if pkill -f "flask run"; then
    echo -e "${GREEN}Flask backend process(es) sent kill signal.${NC}"
else
    echo -e "${YELLOW}Flask backend process(es) not found or already stopped.${NC}"
fi
close_terminal_by_title "$FLASK_WINDOW_TITLE"

# --- Stop Celery Worker ---
echo -e "${BLUE}Stopping Celery worker process...${NC}"
if pkill -f "celery -A celery_worker.app_celery worker"; then
    echo -e "${GREEN}Celery worker process(es) sent kill signal.${NC}"
else
    echo -e "${YELLOW}Celery worker process(es) not found or already stopped.${NC}"
fi
close_terminal_by_title "$CELERY_WINDOW_TITLE"

# --- Stop Frontend React Application ---
echo -e "${BLUE}Stopping Frontend React app process...${NC}"
FRONTEND_PORT=3000
FRONTEND_PID=$(lsof -t -i:"$FRONTEND_PORT" 2>/dev/null)

if [ -n "$FRONTEND_PID" ]; then
    echo "Found frontend process (PID: $FRONTEND_PID) on port $FRONTEND_PORT. Attempting graceful shutdown..."
    kill "$FRONTEND_PID"
    stopped_gracefully=false
    for i in {1..3}; do
        if ! ps -p "$FRONTEND_PID" > /dev/null 2>&1; then
            stopped_gracefully=true
            break
        fi
        sleep 1
    done

    if [ "$stopped_gracefully" = true ]; then
        echo -e "${GREEN}Frontend process (PID: $FRONTEND_PID) on port $FRONTEND_PORT stopped gracefully.${NC}"
    else
        echo -e "${YELLOW}Frontend process (PID: $FRONTEND_PID) did not stop gracefully. Sending SIGKILL...${NC}"
        kill -9 "$FRONTEND_PID"
        sleep 0.5
        if ! ps -p "$FRONTEND_PID" > /dev/null 2>&1; then
            echo -e "${GREEN}Frontend process (PID: $FRONTEND_PID) killed with SIGKILL.${NC}"
        else
            echo -e "${RED}ERROR: Failed to kill frontend process (PID: $FRONTEND_PID) with SIGKILL.${NC}"
        fi
    fi
else
    echo -e "${YELLOW}No process found running on port $FRONTEND_PORT.${NC}"
fi

echo -e "${BLUE}Attempting to stop any 'react-scripts/scripts/start.js' processes by name as a fallback...${NC}"
if pkill -f "react-scripts/scripts/start.js"; then
    echo -e "${GREEN}Sent SIGTERM to 'react-scripts/scripts/start.js' process(es).${NC}"
    sleep 0.5
    if pgrep -f "react-scripts/scripts/start.js" > /dev/null; then
        echo -e "${YELLOW}Process 'react-scripts/scripts/start.js' still running, trying SIGKILL.${NC}"
        pkill -9 -f "react-scripts/scripts/start.js"
    fi
else
    echo -e "${YELLOW}No 'react-scripts/scripts/start.js' process(es) found or already stopped.${NC}"
fi
close_terminal_by_title "$FRONTEND_WINDOW_TITLE"

# --- Stop Redis Server ---
echo -e "${BLUE}Stopping Redis server...${NC}"
redis_stopped_gracefully=false
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo "Attempting graceful shutdown of Redis server via redis-cli SHUTDOWN..."
        if redis-cli SHUTDOWN SAVE &> /dev/null; then # Use NOSAVE for dev, or SAVE if data persistence is critical
            # Wait for Redis to stop
            for i in {1..5}; do
                if ! pgrep -f "redis-server" &> /dev/null; then
                    redis_stopped_gracefully=true
                    break
                fi
                sleep 1
            done
            if [ "$redis_stopped_gracefully" = true ]; then
                echo -e "${GREEN}Redis server shut down gracefully via redis-cli.${NC}"
            else
                echo -e "${YELLOW}Redis server did not stop after SHUTDOWN command.${NC}"
            fi
        else
            echo -e "${YELLOW}redis-cli SHUTDOWN command failed to execute properly.${NC}"
        fi
    else
        echo -e "${YELLOW}redis-cli found, but Redis server not responding to PING (already stopped or unresponsive).${NC}"
        # If PING fails, it's likely already stopped or not running correctly.
        if ! pgrep -f "redis-server" &> /dev/null; then
             redis_stopped_gracefully=true # Treat as gracefully stopped if process not found
        fi
    fi
else
    echo -e "${YELLOW}redis-cli command not found. Cannot attempt graceful shutdown.${NC}"
fi

if [ "$redis_stopped_gracefully" = false ]; then
    echo -e "${BLUE}Attempting to stop Redis server process using pkill...${NC}"
    if pkill -f "redis-server"; then
        echo -e "${GREEN}Redis server process(es) sent kill signal via pkill.${NC}"
        sleep 0.5 # Give pkill a moment
        if ! pgrep -f "redis-server" &> /dev/null; then
            echo -e "${GREEN}Redis server confirmed stopped after pkill.${NC}"
        else
            echo -e "${RED}Redis server may still be running after pkill.${NC}"
        fi
    else
        echo -e "${YELLOW}Redis server process(es) not found by pkill (or already stopped).${NC}"
    fi
fi
close_terminal_by_title "$REDIS_WINDOW_TITLE"

echo -e "${MAGENTA}--- Process and Window Stop Commands Issued ---${NC}"
echo -e "${YELLOW}Please verify that processes have terminated and windows are closed.${NC}"
echo -e "${YELLOW}If any processes/windows persist, you may need to intervene manually.${NC}" 