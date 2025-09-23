# Repository Guidelines

## Project Structure & Module Organization
- Backend (Elixir/Phoenix): `app/` with `lib/` (Elixir code), `config/`, `priv/`, and `test/` (plus `ee/` enterprise code and tests).
- Frontend (TypeScript/React): `app/assets/js/` built with Vite; shared UI library in `turboui/`.
- Tooling: `Makefile` (common tasks), `scripts/` (CI helpers), `docker/`, `docs/`.
- Tests and artifacts: `app/test/`, `app/ee/test/`, reports in `app/testreports/`, screenshots in `app/screenshots/`.

## Build, Test, and Development Commands
- Setup dev environment: `make dev.build` (deps, compile, DB create/migrate, build UI).
- Run server: `make dev.server` (Phoenix at http://localhost:4000).
- One-shot tests: `make test` (Elixir + Jest). **Targeted: `make test FILE=test/some_test.exs` or `make test FILE=assets/js/path.spec.ts` (note: no `app/` prefix for test files).**
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
- **For comprehensive test documentation, see `app/test/AGENTS.md`.**
- **Single test files: `make test FILE=test/path/to/test.exs` (NEVER use `mix test` directly or INDEX/TOTAL with FILE)**
- **❌ INCORRECT: `INDEX=1 TOTAL=1 make test.mix.features FILE=app/test/features/file_test.exs`**
- **❌ INCORRECT: `mix test test/path/to/test.exs`**
- Elixir: ExUnit for unit/integration; Wallaby for feature tests. **ALWAYS use `make test.mix` or other make targets, NEVER call `mix test` directly.**
- Frontend: Jest in `app/` and `turboui/`. Run with `make test.npm` or `npm test` in the respective package.
- CI emits JUnit/XML to `app/testreports/`. Prefer deterministic, isolated tests.

### Test Factories (PREFERRED) vs Fixtures
**ALWAYS use test factories instead of fixtures.** The factory system (`Operately.Support.Factory`) provides better test data management:

**✅ PREFERRED: Test Factory Pattern**
```elixir
defmodule MyTest do
  use Operately.DataCase, async: true
  alias Operately.Support.Factory

  setup do
    Factory.setup(%{})  # Creates account, company, creator
  end

  test "my feature", ctx do
    ctx
    |> Factory.add_space(:marketing)
    |> Factory.add_project(:website, :marketing)
    |> Factory.add_company_member(:john)
    |> Factory.add_project_contributor(:john_contrib, :website)

    # Test logic here - all entities are related and accessible via ctx
    assert ctx.website.name == "Project website"
    assert ctx.john.company_id == ctx.company.id
  end
end
```

**❌ DISCOURAGED: Direct Fixture Usage**
```elixir
# Avoid this pattern - requires manual relationship setup
company = company_fixture()
person = person_fixture(%{company_id: company.id})
space = group_fixture(person, %{company_id: company.id})
project = project_fixture(%{group_id: space.id, creator_id: person.id})
```

**Factory Benefits:**
- **Context Management**: Maintains relationships between entities automatically
- **Readable Tests**: Declarative syntax shows test intent clearly
- **Easier Refactoring**: Changes to factory methods update all tests
- **Consistent Setup**: `Factory.setup/1` provides standard test environment
- **Named References**: Access created entities by testid (e.g., `ctx.marketing`, `ctx.website`)

**Available Factory Methods:**
- Companies: `add_company_member/3`, `add_company_admin/3`, `add_company_agent/3`
- Spaces: `add_space/3`, `add_space_member/4`
- Projects: `add_project/4`, `add_project_contributor/4`, `add_project_milestone/4`
- Goals: `add_goal/4`, `add_goal_update/5`, `add_goal_target/4`
- Messages: `add_messages_board/4`, `add_message/4`
- Resources: `add_resource_hub/5`, `add_document/4`, `add_file/4`

**Feature Test Pattern (End-to-End):**
```elixir
feature "project creation workflow", ctx do
  ctx
  |> Factory.setup()
  |> Factory.log_in_person(:creator)
  |> Factory.add_space(:product)
  |> Steps.when_i_create_a_project_in_space(:product)
  |> Steps.then_project_appears_in_space(:product)
end
```

## Commit & Pull Request Guidelines
- DCO required: sign off every commit. Example: `git commit -s -m "feat: add goal editor"` (see `docs/commit_sign-off.md`).
- PR title format enforced: `feat: ...`, `fix: ...`, `chore: ...`, or `docs: ...` (checked by `scripts/pr-name-check`).
- PRs should include: clear description, screenshots for UI changes, migration notes if DB changes, and linked issues.

## Security & Configuration Tips
- Local env: run `make dev.seed.env` to scaffold `.env` and certs. Never commit secrets.
- Use `./devenv` wrapper (Docker-based) for consistent tooling and DB.

## Additional Documentation
- Testing guide: `app/test/AGENTS.md` - Comprehensive test documentation including factory usage and correct test execution commands
- Component library: `turboui/AGENTS.md` - TurboUI development and component patterns
