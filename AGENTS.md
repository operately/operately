# Repository Guidelines

## Project Structure & Module Organization

- Backend (Elixir/Phoenix): `app/` with `lib/` (Elixir code), `config/`, `priv/`, and `test/` (plus `ee/` enterprise code and tests).
- Frontend (TypeScript/React): `app/assets/js/` built with Vite; shared UI library in `turboui/`.
- Tooling: `Makefile` (common tasks), `scripts/` (CI helpers), `docker/`, `docs/`.
- Tests and artifacts: `app/test/`, `app/ee/test/`, reports in `app/testreports/`, screenshots in `app/screenshots/`.

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
- Docker image: `make docker.build` (see `Dockerfile.prod`).

## Coding Style & Naming Conventions

- Elixir: `mix format` with `app/.formatter.exs` (line_length 200). Modules under `Operately.*`. Tests end with `_test.exs`.
- TypeScript/JS: Prettier (`printWidth: 120`, `trailingComma: all`). Check: `npm --prefix app run prettier:check`; fix: `make js.fmt.fix`.
- Components and pages: PascalCase for React components; filenames `ComponentName.tsx`. Tests: `*.spec.ts(x)`.
- TurboUI component architecture and patterns: `turboui/AGENTS.md`.

## Testing Guidelines

Read the testing guide at app/test/AGENTS.md.

## Commit & Pull Request Guidelines

- DCO required: sign off every commit. Example: `git commit -s -m "feat: add goal editor"` (see `docs/commit_sign-off.md`).
- PR title format enforced: `feat: ...`, `fix: ...`, `chore: ...`, or `docs: ...` (checked by `scripts/pr-name-check`).
- PRs should include: clear description, screenshots for UI changes, migration notes if DB changes, and linked issues.

## Security & Configuration Tips

- Local env: run `make dev.seed.env` to scaffold `.env` and certs. Never commit secrets.
- Use `./devenv` wrapper (Docker-based) for consistent tooling and DB.
