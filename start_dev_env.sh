#!/bin/bash

# --- Configuration ---
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Window Titles
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

# --- Helper Functions ---
check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}Error: Command '$1' not found. Please install it and ensure it's in your PATH.${NC}"
        return 1
    fi
    echo -e "${GREEN}Command '$1' found.${NC}"
    return 0
}

check_path_exists() {
    if [ ! -e "$1" ]; then # -e checks for existence (file or directory)
        echo -e "${RED}Error: Required path '$1' not found.${NC}"
        return 1
    fi
    echo -e "${GREEN}Required path '$1' found.${NC}"
    return 0
}

prompt_yes_no() {
    while true; do
        read -p "$1 (y/n): " yn
        case $yn in
            [Yy]* ) return 0;;
            [Nn]* ) return 1;;
            * ) echo "Please answer yes (y) or no (n).";;
        esac
    done
}

execute_osascript() {
    local script_title="$1"
    local window_title_var_name="$2" # Name of the variable holding the window title string
    local base_command_to_run="$3"
    local dir_to_cd="$4"
    local initial_echo_message="$5"

    local S_SHELL_CYAN="\\\\033[0;36m"
    local S_SHELL_NC="\\\\033[0m"

    local initial_echo_message_shell_safe
    initial_echo_message_shell_safe=$(echo "$initial_echo_message" | sed "s/'/'\\\\''/g")
    
    local colored_echo_command="echo -e '${S_SHELL_CYAN}${initial_echo_message_shell_safe}${S_SHELL_NC}'"
    local full_shell_command_for_tab="cd '$dir_to_cd' && ${colored_echo_command} && ${base_command_to_run}"

    local applescript_escaped_shell_command
    applescript_escaped_shell_command=$(echo "$full_shell_command_for_tab" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')

    echo -e "${BLUE}Attempting to start ${script_title} in a new terminal...${NC}"

    osascript <<EOF
    tell application "Terminal"
        activate
        try
            set new_tab to do script "$applescript_escaped_shell_command"
            
            delay 0.5  -- Delay for tab to initialize and script to start running

            if exists (new_tab) then
                set custom title of new_tab to "${!window_title_var_name}"
                try
                    -- Get the window containing the new tab and miniaturize it
                    set parent_window to window of new_tab
                    set miniaturized of parent_window to true
                on error errmsg_miniaturize number errnum_miniaturize
                    -- Failed to miniaturize, could log or ignore. For now, ignore.
                end try
            else
                -- Fallback: new_tab reference wasn't obtained.
                -- Try to operate on the front window, assuming it's the one just affected.
                if (count of windows) > 0 then
                    set front_w to front window
                    try
                        -- Try to set title of selected tab in front window
                        set custom title of (selected tab of front_w) to "${!window_title_var_name}"
                    on error
                        -- If that fails, try setting title of the window itself
                        set custom title of front_w to "${!window_title_var_name}"
                    end try
                    set miniaturized of front_w to true
                end if
            end if

        on error errMsg number errorNum -- Outer error handler for 'do script' or activation issues
            tell me to activate
            display dialog "AppleScript Error for ${script_title}:\\n" & errMsg & "\\nNumber: " & errorNum buttons {"OK"} default button "OK"
        end try
    end tell
EOF
    local osascript_exit_status=$?
    if [ $osascript_exit_status -ne 0 ]; then
        echo -e "${RED}Error: osascript command execution failed for ${script_title} with exit status $osascript_exit_status.${NC}"
        echo -e "${YELLOW}This might be due to Terminal automation permissions or a more fundamental issue with osascript.${NC}"
        echo -e "${YELLOW}Please check System Settings -> Privacy & Security -> Automation.${NC}"
        echo -e "${YELLOW}Ensure your current terminal/script editor has permission to control 'Terminal.app'.${NC}"
        return 1
    fi
    echo -e "${GREEN}${script_title} startup initiated via osascript.${NC}"
    return 0
}

# --- Pre-flight Checks ---
echo -e "${MAGENTA}--- Running Pre-flight Checks ---${NC}"
checks_passed=true
if ! check_command "osascript"; then checks_passed=false; fi
if ! check_command "npm"; then checks_passed=false; fi
if ! check_command "redis-server"; then checks_passed=false; fi
if ! check_path_exists "$BACKEND_DIR/.venv/bin/activate"; then checks_passed=false; fi

if [ "$checks_passed" = false ]; then
    echo -e "${RED}One or more pre-flight checks failed. Please resolve the issues above and try again.${NC}"
    exit 1
fi
echo -e "${GREEN}All pre-flight checks passed.${NC}"
echo ""


# --- Main Startup ---
echo -e "${MAGENTA}--- Starting Development Environment ---${NC}"
echo "Script Directory: $SCRIPT_DIR"
echo "Backend Directory: $BACKEND_DIR"
echo "Frontend Directory: $FRONTEND_DIR"
echo ""

# --- Interactive Service Selection ---
start_flask=false
start_celery=false
start_frontend=false
start_redis=false

if prompt_yes_no "Start Backend Flask Application?"; then
    start_flask=true
fi
if prompt_yes_no "Start Celery Worker?"; then
    start_celery=true
fi
if prompt_yes_no "Start Frontend React Application?"; then
    start_frontend=true
fi
if prompt_yes_no "Start Redis Server?"; then
    start_redis=true
fi

echo ""

# --- Start Selected Services ---
if [ "$start_flask" = true ]; then
    execute_osascript "Backend Flask Application" "FLASK_WINDOW_TITLE" "source .venv/bin/activate && flask run" "$BACKEND_DIR" "Starting Flask Backend..."
    echo ""
fi

if [ "$start_celery" = true ]; then
    execute_osascript "Celery Worker" "CELERY_WINDOW_TITLE" "source .venv/bin/activate && export FLASK_CONFIG=development && celery -A celery_worker.app_celery worker -l INFO" "$BACKEND_DIR" "Starting Celery Worker..."
    echo ""
fi

if [ "$start_frontend" = true ]; then
    execute_osascript "Frontend React Application" "FRONTEND_WINDOW_TITLE" "npm start" "$FRONTEND_DIR" "Starting Frontend React App..."
    echo ""
fi

if [ "$start_redis" = true ]; then
    execute_osascript "Redis Server" "REDIS_WINDOW_TITLE" "redis-server" "$SCRIPT_DIR" "Starting Redis Server... (ensure config allows foreground mode if not default)"
    echo ""
fi

echo -e "${GREEN}Development environment startup sequence complete.${NC}"
echo -e "${YELLOW}Please ensure PostgreSQL and Redis servers are running if your application requires them.${NC}"
echo -e "${YELLOW}NOTE: You might need to grant Terminal access to control other apps (System Settings -> Privacy & Security -> Automation).${NC}"