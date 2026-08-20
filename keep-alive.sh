#!/bin/bash
# Keep-alive wrapper for Next.js dev server
cd /home/z/my-project
while true; do
  echo "[$(date)] Starting dev server..." >> /home/z/my-project/keep-alive.log
  bun run dev >> /home/z/my-project/dev.log 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 3s..." >> /home/z/my-project/keep-alive.log
  sleep 3
done
