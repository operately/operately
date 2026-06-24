#!/usr/bin/env bash
set -euo pipefail

input_dir="${1:-}"

echo "# Test retries"
echo ""

if [ -z "$input_dir" ] || [ ! -d "$input_dir" ]; then
  echo "No test jobs published retry reports for this workflow."
  echo ""
  exit 0
fi

mapfile -d '' files < <(find "$input_dir" -type f -name '*.md' -print0 2>/dev/null | sort -z)

if [ ${#files[@]} -eq 0 ]; then
  echo "No test jobs published retry reports for this workflow."
  echo ""
  exit 0
fi

jobs_with_retries=0

for file in "${files[@]}"; do
  if grep -q "No tests were retried in this job." "$file" 2>/dev/null; then
    continue
  fi

  if ! grep -qE "^## (Flaky|Failed)" "$file" 2>/dev/null; then
    continue
  fi

  jobs_with_retries=$((jobs_with_retries + 1))
  job_label="$(basename "$file" .md | sed 's/_/ /g')"

  echo "## ${job_label}"
  echo ""

  awk '
    NR == 1 && $0 == "# Test retries" { next }
    /^## Summary$/ { skip = 1; next }
    skip && /^## / { skip = 0 }
    skip { next }
    { print }
  ' "$file"

  echo ""
done

if [ "$jobs_with_retries" -eq 0 ]; then
  echo "No tests were retried in this workflow."
  echo ""
fi
