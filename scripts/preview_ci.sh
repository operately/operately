#!/usr/bin/env bash
set -euo pipefail

# Asks the preview host (operately/preview) to create, update, or destroy the
# environment for a pull request. The host resolves the PR head and builds the
# image itself, so nothing here builds or pushes anything.
#
# See https://github.com/operately/preview/blob/main/docs/ci.md

COMMENT_MARKER="<!-- operately-preview -->"
POLL_INTERVAL="${PREVIEW_POLL_INTERVAL:-20}"
POLL_TIMEOUT="${PREVIEW_POLL_TIMEOUT:-3600}"
LOG_TAIL="${PREVIEW_LOG_TAIL:-120}"

die() {
  echo "$*" >&2
  exit 1
}

require_env() {
  local name="$1"
  [[ -n "${!name:-}" ]] || die "Missing required environment variable: ${name}"
}

pr_number() {
  printf '%s' "${PR_NUMBER:-${SEMAPHORE_GIT_PR_NUMBER:-}}"
}

github_token() {
  printf '%s' "${GITHUB_TOKEN:-${GH_TOKEN:-}}"
}

github_repo() {
  printf '%s' "${GITHUB_REPOSITORY:-${SEMAPHORE_GIT_REPO_SLUG:-operately/operately}}"
}

# Reads JSON on stdin, prints one top-level field.
json_field() {
  python3 -c 'import json,sys; print(json.load(sys.stdin).get(sys.argv[1]) or "")' "$1"
}

# Calls the preview API and prints the response body. Fails on any non-2xx.
api() {
  local method="$1" path="$2" data="${3:-}"
  local body status tmp
  tmp="$(mktemp)"

  local args=(
    -sS -o "${tmp}" -w '%{http_code}'
    -X "${method}" --max-time 120
    -H "Authorization: Bearer ${PREVIEW_API_TOKEN}"
    -H "Accept: application/json"
  )
  [[ -z "${data}" ]] || args+=(-H "Content-Type: application/json" -d "${data}")

  status="$(curl "${args[@]}" "${PREVIEW_API_URL%/}${path}" || echo 000)"
  body="$(cat "${tmp}")"
  rm -f "${tmp}"

  if [[ "${status}" -lt 200 || "${status}" -ge 300 ]]; then
    die "Preview API ${method} ${path} failed (HTTP ${status}): ${body}"
  fi
  printf '%s' "${body}"
}

print_build_log() {
  local pr="$1"
  echo "--- last ${LOG_TAIL} lines of the preview build log ---"
  api GET "/v1/environments/${pr}/log?tail=${LOG_TAIL}" || true
  echo "--- end of log ---"
}

comment_on_pr() {
  local pr="$1" url="$2" sha="$3"
  local token
  token="$(github_token)"

  if [[ -z "${token}" ]]; then
    echo "No GitHub token available; skipping the PR comment for ${url}"
    return 0
  fi

  local api_base payload body comments existing
  api_base="${GITHUB_API_URL:-https://api.github.com}/repos/$(github_repo)"
  body="${COMMENT_MARKER}
Preview environment: ${url}

Built from \`${sha}\` on the preview host. Updated on every push; destroyed when this PR closes."
  payload="$(PR_COMMENT_BODY="${body}" python3 -c 'import json, os; print(json.dumps({"body": os.environ["PR_COMMENT_BODY"]}))')"

  comments="$(curl -sS \
    -H "Authorization: Bearer ${token}" \
    -H "Accept: application/vnd.github+json" \
    "${api_base}/issues/${pr}/comments?per_page=100")"

  existing="$(MARKER="${COMMENT_MARKER}" python3 -c '
import json, os, sys
marker = os.environ["MARKER"]
for comment in json.load(sys.stdin):
    if marker in (comment.get("body") or ""):
        print(comment["id"])
        break
' <<<"${comments}")"

  if [[ -n "${existing}" ]]; then
    curl -sS -X PATCH \
      -H "Authorization: Bearer ${token}" \
      -H "Accept: application/vnd.github+json" \
      -H "Content-Type: application/json" \
      -d "${payload}" \
      "${api_base}/issues/comments/${existing}" >/dev/null
    echo "Updated the preview comment on PR #${pr}"
  else
    curl -sS -X POST \
      -H "Authorization: Bearer ${token}" \
      -H "Accept: application/vnd.github+json" \
      -H "Content-Type: application/json" \
      -d "${payload}" \
      "${api_base}/issues/${pr}/comments" >/dev/null
    echo "Posted the preview comment on PR #${pr}"
  fi
}

upsert() {
  require_env "PREVIEW_API_URL"
  require_env "PREVIEW_API_TOKEN"

  local pr
  pr="$(pr_number)"
  [[ -n "${pr}" ]] || { echo "Not a pull request; nothing to preview"; return 0; }

  local payload
  payload="$(PR="${pr}" FORCE="${PREVIEW_FORCE:-}" python3 -c '
import json, os
body = {"pr": int(os.environ["PR"])}
if os.environ.get("FORCE"):
    body["force"] = True
print(json.dumps(body))')"

  echo "Requesting a preview for PR #${pr}"
  api POST "/v1/environments" "${payload}" | json_field status >/dev/null

  # The host builds Operately from source, so this waits minutes, not seconds.
  local deadline=$((SECONDS + POLL_TIMEOUT))
  local response status last_status="" url sha

  while ((SECONDS < deadline)); do
    response="$(api GET "/v1/environments/${pr}")"
    status="$(json_field status <<<"${response}")"

    if [[ "${status}" != "${last_status}" ]]; then
      echo "  status: ${status}"
      last_status="${status}"
    fi

    case "${status}" in
      ready)
        url="$(json_field url <<<"${response}")"
        sha="$(json_field sha <<<"${response}")"
        [[ -n "${url}" ]] || die "Preview reported ready without a url: ${response}"
        echo "Preview ready: ${url}"
        comment_on_pr "${pr}" "${url}" "${sha}" || echo "Warning: could not comment on PR #${pr}"
        return 0
        ;;
      failed)
        echo "Preview build failed: $(json_field error <<<"${response}")" >&2
        print_build_log "${pr}"
        return 1
        ;;
    esac

    sleep "${POLL_INTERVAL}"
  done

  echo "Preview for PR #${pr} did not become ready within ${POLL_TIMEOUT}s" >&2
  print_build_log "${pr}"
  return 1
}

destroy() {
  if [[ -z "${PREVIEW_API_URL:-}" || -z "${PREVIEW_API_TOKEN:-}" ]]; then
    echo "Preview API is not configured; skipping destroy"
    return 0
  fi

  local pr
  pr="$(pr_number)"
  [[ -n "${pr}" ]] || { echo "No pull request number; skipping destroy"; return 0; }

  echo "Destroying the preview for PR #${pr}"
  api DELETE "/v1/environments/${pr}" >/dev/null
  echo "Destroy accepted for PR #${pr}"
}

case "${1:-}" in
  upsert) upsert ;;
  destroy) destroy ;;
  *) die "Usage: $0 {upsert|destroy}" ;;
esac
