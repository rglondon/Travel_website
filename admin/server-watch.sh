#!/bin/bash
# Auto-restart script for Henry Travel Admin Server

cd /root/clawd/travel-website/admin-dashboard

while true; do
    echo "[$(date)] Starting server..."
    npm run dev -- --host 0.0.0.0 --port 5180
    EXIT_CODE=$?
    echo "[$(date)] Server exited with code $EXIT_CODE"
    
    if [ $EXIT_CODE -ne 0 ]; then
        echo "Server crashed, restarting in 5 seconds..."
        sleep 5
    else
        echo "Server exited cleanly"
        break
    fi
done
