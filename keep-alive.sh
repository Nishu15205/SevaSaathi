#!/bin/bash
# Bulletproof keep-alive — single script, no health-watch needed
cd /home/z/my-project

echo "[$(date)] keep-alive started" > /home/z/my-project/keep-alive.log

while true; do
  echo "[$(date)] Starting dev server..." >> /home/z/my-project/keep-alive.log
  
  # Start server with memory limit to prevent OOM kill
  NODE_OPTIONS="--max-old-space-size=768" bun run dev >> /home/z/my-project/dev.log 2>&1
  
  echo "[$(date)] Server exited, restarting in 2s..." >> /home/z/my-project/keep-alive.log
  
  # Clean up any zombie children before restart
  pkill -9 -f 'next-server' 2>/dev/null
  pkill -9 -f 'postcss' 2>/dev/null
  sleep 2
done
