#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

echo "============================================"
echo " Medical Image Annotator Validator"
echo "============================================"
echo ""

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "Docker is not running. Attempting to start Docker..."

    if [[ "$(uname)" == "Darwin" ]]; then
        open -a Docker
    else
        sudo systemctl start docker 2>/dev/null || sudo service docker start 2>/dev/null || {
            echo "ERROR: Could not start Docker. Please start it manually."
            exit 1
        }
    fi

    echo "Waiting for Docker to start..."
    while ! docker info >/dev/null 2>&1; do
        sleep 3
        echo "  Still waiting..."
    done
    echo "Docker is ready!"
    echo ""
fi

# Open browser in background once frontend responds on port 80
(
    until curl -sf http://localhost:80 >/dev/null 2>&1; do sleep 2; done
    if [[ "$(uname)" == "Darwin" ]]; then
        open http://localhost:80
    else
        xdg-open http://localhost:80 2>/dev/null || true
    fi
) &
BROWSER_PID=$!

echo "Building and starting services (closing this window will stop all containers)..."
echo ""
echo "============================================"
echo " Frontend:      http://localhost:80"
echo " MinIO Console: http://localhost:9001"
echo "============================================"
echo ""

# Run in FOREGROUND — when this terminal window is closed, the shell receives
# SIGHUP which propagates to docker compose, stopping all containers automatically
docker compose up --build

# Cleanup browser waiter if still running
kill $BROWSER_PID 2>/dev/null || true
