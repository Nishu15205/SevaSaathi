#!/bin/bash
# Independent health checker - pings server every 3s, forces restart if dead
cd /home/z/my-project
while true; do
  STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/ 2>/dev/null)
  if [ "$STATUS" != "200" ]; then
    echo "[$(date)] Health check FAILED (HTTP $STATUS) - killing stale processes" >> health-watch.log
    pkill -9 -f 'next-server' 2>/dev/null
    pkill -9 -f 'postcss' 2>/dev/null
    # keep-alive.sh will restart it
  fi
  sleep 3
done
