#!/usr/bin/env bash
set -euo pipefail

require_env() {
  local var_name="$1"
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required environment variable: ${var_name}"
    exit 1
  fi
}

WEBSITE_REPO="${DOCS_WEBSITE_REPO:-}"
WEBSITE_BRANCH="main"
WEBSITE_TARGET_DIR="src/content/docs/help/api"
BOT_NAME="docs-robot"
BOT_EMAIL="docs-robot@operately.com"
SSH_KEY_PATH="/home/semaphore/docs-deploy-key"
SSH_HOST=""
SSH_PORT=""

require_env "DOCS_WEBSITE_REPO"

is_ssh_repo() {
  local repo="$1"

  # Only SSH remotes need deploy-key and known_hosts setup.
  [[ "${repo}" =~ ^ssh:// ]] || [[ "${repo}" =~ ^[^@/]+@[^:]+:.+$ ]]
}

extract_ssh_target() {
  local repo="$1"

  # Support both scp-style Git remotes and ssh:// URLs.
  if [[ "${repo}" =~ ^ssh://([^@/]+@)?(\[[^]]+\]|[^/:]+)(:([0-9]+))?/ ]]; then
    SSH_HOST="${BASH_REMATCH[2]}"
    SSH_PORT="${BASH_REMATCH[4]:-}"
  elif [[ "${repo}" =~ ^([^@/]+@)?(\[[^]]+\]|[^:]+):.+$ ]]; then
    SSH_HOST="${BASH_REMATCH[2]}"
    SSH_PORT=""
  else
    echo "Unsupported SSH repository format: ${repo}"
    exit 1
  fi

  SSH_HOST="${SSH_HOST#[}"
  SSH_HOST="${SSH_HOST%]}"
}

setup_ssh_access() {
  if [[ ! -f "${SSH_KEY_PATH}" ]]; then
    echo "SSH key not found at ${SSH_KEY_PATH}."
    exit 1
  fi

  if ! chmod 600 "${SSH_KEY_PATH}" 2>/dev/null; then
    sudo chmod 600 "${SSH_KEY_PATH}"
  fi

  if ! ssh-keygen -y -f "${SSH_KEY_PATH}" >/dev/null 2>&1; then
    echo "Invalid private key format at ${SSH_KEY_PATH}."
    exit 1
  fi

  mkdir -p "${HOME}/.ssh"
  touch "${HOME}/.ssh/known_hosts"
  KNOWN_HOSTS_FILE="${HOME}/.ssh/known_hosts"

  # Trust the exact SSH endpoint from DOCS_WEBSITE_REPO, not a hardcoded host.
  if ! ssh-keygen -F "${SSH_HOST}" -f "${KNOWN_HOSTS_FILE}" >/dev/null; then
    local ssh_keyscan_args=(-t rsa,ecdsa,ed25519)

    if [[ -n "${SSH_PORT}" ]]; then
      ssh_keyscan_args+=(-p "${SSH_PORT}")
    fi

    echo "Adding SSH host keys for ${SSH_HOST}"
    ssh-keyscan "${ssh_keyscan_args[@]}" "${SSH_HOST}" >> "${KNOWN_HOSTS_FILE}" 2>/dev/null
  fi

  if ! ssh-keygen -F "${SSH_HOST}" -f "${KNOWN_HOSTS_FILE}" >/dev/null; then
    echo "Failed to add ${SSH_HOST} to known_hosts"
    exit 1
  fi

  local git_ssh_command=(
    ssh
    -i "${SSH_KEY_PATH}"
    -o IdentitiesOnly=yes
    # GitHub may resolve through a different IP, but the host key must still match the repo host.
    -o CheckHostIP=no
    -o StrictHostKeyChecking=yes
    -o "UserKnownHostsFile=${KNOWN_HOSTS_FILE}"
  )

  if [[ -n "${SSH_PORT}" ]]; then
    git_ssh_command+=(-p "${SSH_PORT}")
  fi

  export GIT_SSH_COMMAND="${git_ssh_command[*]}"
}

if is_ssh_repo "${WEBSITE_REPO}"; then
  extract_ssh_target "${WEBSITE_REPO}"
  setup_ssh_access
fi

OPERATELY_SHA="${SEMAPHORE_GIT_SHA:-$(git rev-parse HEAD)}"
OPERATELY_SHORT_SHA="$(git rev-parse --short "${OPERATELY_SHA}")"

echo "Preparing environment and generating API docs from operately@${OPERATELY_SHORT_SHA}"
make gen.api.docs.ci

DOCS_SOURCE_DIR="$(pwd)/tmp/generated/api-docs/help/api"
if [[ ! -d "${DOCS_SOURCE_DIR}" ]]; then
  echo "Generated docs directory not found: ${DOCS_SOURCE_DIR}"
  exit 1
fi

WORKDIR="$(mktemp -d)"
cleanup() {
  rm -rf "${WORKDIR}"
}
trap cleanup EXIT

echo "Cloning website repository"
git clone "${WEBSITE_REPO}" "${WORKDIR}/operately-website"

cd "${WORKDIR}/operately-website"
git checkout "${WEBSITE_BRANCH}"

mkdir -p "${WEBSITE_TARGET_DIR}"
rsync -a --delete "${DOCS_SOURCE_DIR}/" "${WEBSITE_TARGET_DIR}/"

if [[ -z "$(git status --porcelain -- "${WEBSITE_TARGET_DIR}")" ]]; then
  echo "No API docs changes to publish."
  exit 0
fi

git config user.name "${BOT_NAME}"
git config user.email "${BOT_EMAIL}"

git add "${WEBSITE_TARGET_DIR}"
git commit -m "docs: sync API docs from operately@${OPERATELY_SHORT_SHA}"

if ! git push origin "${WEBSITE_BRANCH}"; then
  echo "Initial push failed, retrying with rebase."
  git pull --rebase origin "${WEBSITE_BRANCH}"
  git push origin "${WEBSITE_BRANCH}"
fi

echo "API docs sync completed."
