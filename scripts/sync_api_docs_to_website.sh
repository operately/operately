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
SSH_KEY_PATH="${DOCS_DEPLOY_KEY_PATH:-${HOME}/.ssh/docs-deploy-key}"

require_env "DOCS_WEBSITE_REPO"

if [[ -n "${DOCS_DEPLOY_KEY:-}" ]]; then
  mkdir -p "$(dirname "${SSH_KEY_PATH}")"
  printf "%s\n" "${DOCS_DEPLOY_KEY}" > "${SSH_KEY_PATH}"
fi

if [[ ! -f "${SSH_KEY_PATH}" ]]; then
  echo "SSH key not found at ${SSH_KEY_PATH}. Set DOCS_DEPLOY_KEY or DOCS_DEPLOY_KEY_PATH."
  exit 1
fi

chmod 600 "${SSH_KEY_PATH}"
mkdir -p "${HOME}/.ssh"
touch "${HOME}/.ssh/known_hosts"
KNOWN_HOSTS_FILE="${HOME}/.ssh/known_hosts"

if ! ssh-keygen -F github.com -f "${KNOWN_HOSTS_FILE}" >/dev/null; then
  echo "Adding github.com SSH host keys"
  ssh-keyscan -t rsa,ecdsa,ed25519 github.com >> "${KNOWN_HOSTS_FILE}" 2>/dev/null
fi

if ! ssh-keygen -F github.com -f "${KNOWN_HOSTS_FILE}" >/dev/null; then
  echo "Failed to add github.com to known_hosts"
  exit 1
fi

export GIT_SSH_COMMAND="ssh -i ${SSH_KEY_PATH} -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=${KNOWN_HOSTS_FILE}"

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
