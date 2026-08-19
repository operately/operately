# Repository Guidelines

## Project Structure & Module Organization

- Backend (Elixir/Phoenix): `app/` with `lib/` (Elixir code), `config/`, `priv/`, and `test/` (plus `ee/` enterprise code and tests). App-level manifests: `app/mix.exs`, `app/package.json`, `app/vite.config.mjs`.
- Frontend (TypeScript/React): `app/assets/js/` built with Vite; shared UI library in `turboui/` (its own `package.json`, Storybook, and `turboui/AGENTS.md`).
- CLI (TypeScript): `cli/` — the `@operately/operately-cli` package for the external API, with `src/`, `docs/`, and its own `package.json`/`tsconfig.json`. Command catalog is generated from the API (see `make gen.cli.catalog`).
- Docs: `docs/` (developer docs like `dev-env.md`, `architecture.md`, `pull-request-guidelines.md`). Feature specs: `specs/` (numbered design docs, e.g. `0012-operately-mcp.md`) — check here for the intent behind larger features before implementing.
- Tooling: `Makefile` (common tasks), `scripts/` (CI/build helpers), `docker/`, `.agents/skills/` (agent skills).
- Tests and artifacts: `app/test/`, `app/ee/test/`, reports in `app/testreports/`, screenshots in `app/screenshots/`.

## Agent Skills

`.agents/skills/*/SKILL.md` holds detailed, task-specific guidance (testing, Ecto migrations, component architecture, clean code, activity system, UI copy, and more) and is auto-discovered from each skill's `name`/`description` front-matter. Consult the relevant skill before duplicating detailed guidance in this file — this file should stay short and point to skills rather than repeat them.

## Build, Test, and Development Commands

- Setup dev environment: `make dev.build` (deps, compile, DB create/migrate, build UI).
- Run server: `make dev.server` (Phoenix at http://localhost:4000).
- One-shot tests: `make test` (Elixir + Jest). Targeted: `make test FILE=app/test/some_test.exs` or `make test FILE=assets/js/path.spec.ts`.
- Separate suites: `make test.mix` (Elixir), `make test.npm` (Jest), `make test.dialyzer` (types), `make test.tsc.lint` (TS checks).
- Unit tests: `make test.mix.unit` (Elixir unit tests with retry logic).
- Feature tests: `make test.mix.features` (Elixir feature tests with parallel splitting).
- Enterprise tests: `make test.ee` (Enterprise edition tests with retry logic).
- UI lib: `make turboui.build`, `make turboui.test`, `make turboui.storybook`.
- For component workflow, see `turboui/AGENTS.md`.
- CLI: `make cli.build` (compile `cli/`), `make cli.test` (unit tests, alias for `make cli.test.unit`), `make cli.test.e2e` (end-to-end against the app). Keep the CLI command catalog in sync with the API using `make gen.cli.catalog`; `make test.cli.catalog.sync` verifies it.
- Docker image: `make docker.build` (see `Dockerfile.prod`).

## Coding Style & Naming Conventions 

- Elixir: `mix format` with `app/.formatter.exs` (line_length 200). Modules under `Operately.*`. Tests end with `_test.exs`.
- Clean code (naming, test-first, focused functions, error handling): follow the **clean-code** skill (`.agents/skills/clean-code/SKILL.md`), applied by default.
- Agents should not wrap Elixir macros with parentheses unless explicitly requested. Keep keyword-style macro calls such as `field`, `field?`, `object`, `enum`, `plug`, etc. in their existing form (e.g., `field :company, :company`) across schemas, API modules, and similar contexts. Example of what not to do: do not rewrite `field :company, :company` to `field(:company, :company)` or `object :task` to `object(:task), do: ...`.
- Agents should not format Elixir code beyond the scope of the requested change or bug fix; only format the lines directly related to the current work.
- TypeScript/JS: Prettier (`printWidth: 120`, `trailingComma: all`). Check: `npm --prefix app run prettier:check`; fix: `make js.fmt.fix`.
- Locale-aware formatting: never hard-code `"en-US"` or hand-format dates/times/numbers; use TurboUI `FormattedTime` and `useFormattedTimePreferences()`. See the **activity-system** skill (`.agents/skills/activity-system/SKILL.md`) for the related null-guard rule in activity feed handlers.
- Components and pages: PascalCase for React components; filenames `ComponentName.tsx`. Tests: `*.spec.ts(x)`.
- TurboUI component architecture and patterns: `turboui/AGENTS.md` and the **components-architecture** skill (`.agents/skills/components-architecture/SKILL.md`).

## UI Pattern Checklist

- When a request references an existing screen, component, or screenshot, inspect that source in the repo before coding and mirror its structure, typography, and spacing unless told otherwise.
- Reuse TurboUI primitives; do not hand-roll inputs, buttons, selects, modals, or validation markup unless no suitable primitive exists. For the full reuse-gate workflow and review checklist, use the **components-architecture** skill (`.agents/skills/components-architecture/SKILL.md`).

## Activity System Guidelines

Activities are the event log of the application (project/goal changes, etc.), powering the activity feed, notifications, and audit logs. Creating a new activity type touches five components across backend and frontend (content handler, notification handler, GraphQL type, serializer, feed handler). See the **activity-system** skill (`.agents/skills/activity-system/SKILL.md`) for the full component breakdown and reference examples.

## Data Migration Guidelines

Data migrations in `app/lib/operately/data` must not depend on live application modules such as `Operately.Goals.Goal` or `Operately.Activities.Activity`; define minimal inline structs with only the fields/helpers needed, so the migration stays stable if the real modules change later. See the **ecto-migrations** skill (`.agents/skills/ecto-migrations/SKILL.md`) for the full rule, DO/DON'T example, and migration checklist.

## Testing Guidelines

For writing, organizing, and running tests, use the **writing-tests** skill
(`.agents/skills/writing-tests/SKILL.md`).

### Feature Test Notes

- Default targeted run: `make test FILE=app/test/features/some_test.exs`.
- For CI-equivalent feature debugging: `make test.build`, then
  `./devenv bash -c 'cd app && CI=true mix test test/features/some_test.exs'`
  (pass `CI=true` explicitly; empty `CI=` in `.env` is not enough). Without
  Vite on `:4005`, non-CI Wallaby runs can load a blank page.
- Screenshots: host `screenshots/` → container `/tmp/screenshots`.
- Port 4002 stuck after a killed run: find/kill leftover `beam`/`mix test` in
  the container via `./devenv bash -c "ps -ef | grep ..."`.

## Commit & Pull Request Guidelines

- DCO required: all commits must be signed off. Agents should always use `git commit -s` or `git commit --signoff` when committing. Example: `git commit -s -m "feat: add goal editor"` (see `docs/commit_sign-off.md`).
- PR title format enforced: `feat: ...`, `fix: ...`, `chore: ...`, or `docs: ...` (checked by `scripts/pr-name-check`).
- PRs should include: clear description, screenshots for UI changes, migration notes if DB changes, and linked issues.

## Security & Configuration Tips

- Local env: run `make dev.seed.env` to scaffold `.env` and certs. Never commit secrets.
- Use `./devenv` wrapper (Docker-based) for consistent tooling and DB.

## Cursor Cloud-specific instructions

The entire dev environment runs inside Docker via the `./devenv` wrapper (docker-in-docker). Standard build/run/test commands live in the `Makefile` and `docs/dev-env.md`; the notes below only cover non-obvious caveats for this environment.

- **Docker daemon**: the VM has no systemd, so `dockerd` is launched directly (the startup/update script starts it in the background and `chmod 666 /var/run/docker.sock`). If `docker ps` fails with a socket/permission error, run `sudo chmod 666 /var/run/docker.sock`; if the daemon is not running, start it with `sudo bash -c 'nohup dockerd >/tmp/dockerd.log 2>&1 &'`.
- **Bring up containers**: only `db` and `pgweb` have `restart: always`, so they auto-start when `dockerd` starts. The `app`, `mailhog`, and `s3mock` containers do NOT auto-restart — run `./devenv up` to (re)create them before doing anything. Compose project name is `workspace` (containers like `workspace-app-1`, `workspace-db-1`).
- **Refresh deps after pulling**: `make dev.build` is idempotent (deps.get/compile, lockfile-hash-guarded `npm ci`, turboui build, DB create/migrate); rerun it if `mix.lock` / `package-lock.json` / migrations changed. It requires the containers to be up.
- **Run the app**: `make dev.server` (Phoenix at http://localhost:4000, Vite watcher at :4005). It runs `iex -S mix phx.server`, so run it in a background/tmux session.
- **First-run onboarding (fastest hello-world)**: visit `http://localhost:4000/setup` to create the first company + admin account in one form (company name, full name, title, email, password ≥12 chars with upper/lower/number). No email code is needed for this path.
- **Email signup/login code**: `ALLOW_LOGIN_WITH_EMAIL`/`ALLOW_SIGNUP_WITH_EMAIL` are enabled by `dev.seed.env`. In dev, email delivery is always treated as "configured", and the 6-character activation code is stored in the DB rather than shown in the UI. MailHog's UI is NOT published to the host (the `mailhog` service defines no host ports), so fetch codes from Postgres: `docker exec workspace-db-1 psql -U postgres -d operately_dev -c "SELECT email, code FROM email_activation_codes ORDER BY inserted_at DESC LIMIT 5;"`.
- **Inspect dev data**: `docker exec workspace-db-1 psql -U postgres -d operately_dev -c '<SQL>'` (dev DB is `operately_dev`, test DB is `operately_test`; password `keyboard-cat`).
