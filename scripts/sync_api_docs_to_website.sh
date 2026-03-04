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

ensure_env_file() {
  if [[ -f .env ]]; then
    return 0
  fi

  echo ".env not found, creating test env file"
  make test.seed.env
}

ensure_devenv_running() {
  for attempt in 1 2 3; do
    echo "Attempt ${attempt}: starting devenv"
    if ./devenv up; then
      echo "devenv is running"
      return 0
    fi

    if [[ "${attempt}" -lt 3 ]]; then
      echo "devenv start failed, retrying in 10s"
      sleep 10
    fi
  done

  echo "Failed to start devenv after 3 attempts"
  exit 1
}

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
ssh-keyscan -H github.com >> "${HOME}/.ssh/known_hosts" 2>/dev/null || true

export GIT_SSH_COMMAND="ssh -i ${SSH_KEY_PATH} -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes"

OPERATELY_SHA="${SEMAPHORE_GIT_SHA:-$(git rev-parse HEAD)}"
OPERATELY_SHORT_SHA="$(git rev-parse --short "${OPERATELY_SHA}")"

ensure_env_file
ensure_devenv_running

echo "Generating API docs from operately@${OPERATELY_SHORT_SHA}"
make gen.api.docs

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
