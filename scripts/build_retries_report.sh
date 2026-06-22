#!/usr/bin/env bash
set -euo pipefail

input_dir="${1:-}"

if [ -z "$input_dir" ] || [ ! -d "$input_dir" ]; then
  exit 0
fi

shopt -s nullglob
files=("$input_dir"/*.md)

if [ ${#files[@]} -eq 0 ]; then
  exit 0
fi

echo "# Test retries"
echo ""

for file in $(printf '%s\n' "${files[@]}" | sort); do
  # Skip the title from per-job files; keep their section content.
  awk 'NR == 1 && $0 == "# Test retries" { next } { print }' "$file"
  echo ""
done
