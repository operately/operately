#!/usr/bin/env bash
set -euo pipefail

kill_pattern() {
  local description="$1"
  local pattern="$2"

  if pgrep -f "$pattern" >/dev/null 2>&1; then
    echo "Stopping ${description}..."
    pkill -f "$pattern" || true
    sleep 1
    if pgrep -f "$pattern" >/dev/null 2>&1; then
      echo "Force stopping remaining ${description} processes..."
      pkill -9 -f "$pattern" || true
    fi
  fi
}

kill_pattern "leftover Vite dev servers" "[n]ode .*vite"
