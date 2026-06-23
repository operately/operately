#!/usr/bin/env bash
set -euo pipefail

report_path="${1:-app/testreports/retries.md}"

if [ ! -f "$report_path" ]; then
  exit 0
fi

if grep -q "No tests were retried in this job." "$report_path"; then
  exit 0
fi

artifact push job -d .semaphore/REPORT.md "$report_path"

job_name="${SEMAPHORE_JOB_NAME:-unknown}"
job_index="${SEMAPHORE_JOB_INDEX:-0}"
job_slug="$(printf '%s-%s' "$job_name" "$job_index" | tr -cs 'A-Za-z0-9._-' '_')"

artifact push workflow -d "retries-md/${job_slug}.md" "$report_path"
