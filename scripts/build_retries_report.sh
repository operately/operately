#!/usr/bin/env bash
set -euo pipefail

input_dir="${1:-}"

echo "# Test retries"
echo ""

if [ -z "$input_dir" ] || [ ! -d "$input_dir" ]; then
  echo "## Summary"
  echo ""
  echo "No test jobs published retry reports for this workflow."
  echo ""
  exit 0
fi

mapfile -d '' files < <(find "$input_dir" -type f -name '*.md' -print0 2>/dev/null | sort -z)

if [ ${#files[@]} -eq 0 ]; then
  echo "## Summary"
  echo ""
  echo "No test jobs published retry reports for this workflow."
  echo ""
  exit 0
fi

echo "## Summary"
echo ""
echo "Collected retry reports from ${#files[@]} job(s)."
echo ""

for file in "${files[@]}"; do
  awk 'NR == 1 && $0 == "# Test retries" { next } { print }' "$file"
  echo ""
done
