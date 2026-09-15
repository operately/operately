# Preview environments

Every open pull request can get its own running Operately instance:

```
https://pr-123.preview.oprtl.morningcoffee.io
```

A bot comment on the pull request links to it. The environment is updated on
every push and destroyed when the pull request closes.

## How it works

The `Preview environment` GitHub Actions workflow calls the preview host with
nothing but the pull request number. The host resolves the PR head itself,
builds the production image from source, and creates or updates an isolated
stack (app plus its own Postgres). Nothing is built or pushed by this
repository's CI, and no image is published for preview commits.

```
.github/workflows/preview.yml  →  scripts/preview_ci.sh  →  preview host API
```

Because the host compiles Operately, a preview takes roughly 20 minutes to come
up, and builds are serialized across pull requests. Pushing twice in quick
succession does not queue two builds; the host coalesces them and deploys the
newest commit. A push that does not change the head is a no-op.

The workflow polls until the environment reports `ready` or `failed`. On failure
it prints the tail of the host's build log into the job output.

## Logging in

Each environment is seeded with a demo company so `/setup` is skipped:

| | |
| --- | --- |
| Email | `demo@operately.dev` |
| Password | `preview-demo-1` |
| Company | Acme Inc. |

## Configuration

The workflow needs two repository secrets:

| Secret | Value |
| --- | --- |
| `PREVIEW_API_URL` | Base URL of the preview host API |
| `PREVIEW_API_TOKEN` | Bearer token from `/home/app/previews/.api-token.env` on the host |

`GITHUB_TOKEN` is provided by Actions and is only used to post the comment. If
it is missing the deploy still succeeds, without a comment.

## Running it by hand

```bash
export PREVIEW_API_URL=... PREVIEW_API_TOKEN=...

PR_NUMBER=123 bash scripts/preview_ci.sh upsert
PR_NUMBER=123 PREVIEW_FORCE=1 bash scripts/preview_ci.sh upsert   # force a rebuild
PR_NUMBER=123 bash scripts/preview_ci.sh destroy
```

The host, its API, and the build pipeline live in
[operately/preview](https://github.com/operately/preview); see
[docs/ci.md](https://github.com/operately/preview/blob/main/docs/ci.md) there
for the API contract and status values.
