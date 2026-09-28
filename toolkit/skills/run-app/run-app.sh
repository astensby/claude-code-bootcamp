#!/usr/bin/env bash
# run-app.sh — start the app on a free port (or $2), wait until it answers, print the URL.
#   run-app.sh start [port]   → prints http://localhost:<port>
#   run-app.sh stop           → stops what start launched
#   run-app.sh status         → prints the URL if it is up, else exit 1
set -u
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" || exit 1
mkdir -p .tmp

case "${1:-start}" in
  start)
    if [ -f .tmp/run-app.pid ] && kill -0 "$(cat .tmp/run-app.pid)" 2>/dev/null; then
      echo "http://localhost:$(cat .tmp/run-app.port)"; exit 0
    fi
    PORT="${2:-$(node -e 'const s=require("net").createServer().listen(0,()=>{console.log(s.address().port);s.close()})')}"
    export PORT
    npm run dev --silent >.tmp/run-app.log 2>&1 &
    echo $! >.tmp/run-app.pid
    echo "$PORT" >.tmp/run-app.port
    for _ in $(seq 1 50); do
      curl -fs "http://localhost:$PORT/" >/dev/null 2>&1 && { echo "http://localhost:$PORT"; exit 0; }
      sleep 0.1
    done
    echo "app did not answer on port $PORT within 5 s; last log lines:" >&2
    tail -5 .tmp/run-app.log >&2
    exit 1 ;;
  stop)
    [ -f .tmp/run-app.pid ] || { echo "not running"; exit 0; }
    PID=$(cat .tmp/run-app.pid); PORT=$(cat .tmp/run-app.port 2>/dev/null || true)
    pkill -P "$PID" 2>/dev/null; kill "$PID" 2>/dev/null
    [ -n "$PORT" ] && lsof -ti tcp:"$PORT" -sTCP:LISTEN 2>/dev/null | xargs kill 2>/dev/null
    rm -f .tmp/run-app.pid .tmp/run-app.port
    echo "stopped" ;;
  status)
    if [ -f .tmp/run-app.port ] && curl -fs "http://localhost:$(cat .tmp/run-app.port)/" >/dev/null 2>&1; then
      echo "http://localhost:$(cat .tmp/run-app.port)"
    else
      echo "not running"; exit 1
    fi ;;
  *) echo "usage: run-app.sh [start [port]|stop|status]" >&2; exit 2 ;;
esac
