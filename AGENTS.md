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
- Agents should not wrap Elixir macros with parentheses unless explicitly requested. Keep keyword-style macro calls such as `field`, `field?`, `object`, `enum`, `plug`, etc. in their existing form (e.g., `field :company, :company`) across schemas, API modules, and similar contexts. Example of what not to do: do not rewrite `field :company, :company` to `field(:company, :company)` or `object :task` to `object(:task), do: ...`.
- Agents should not format Elixir code beyond the scope of the requested change or bug fix; only format the lines directly related to the current work.
- TypeScript/JS: Prettier (`printWidth: 120`, `trailingComma: all`). Check: `npm --prefix app run prettier:check`; fix: `make js.fmt.fix`.
- When TypeScript warns that a value may be `null` or `undefined` (common in activity handlers under `app/assets/js/features/activities`), do not silence the warning with the non-null assertion operator (`!`) or with helpers like `assertPresent`. Add the guards or type refinements needed so the compiler is satisfied without risking runtime errors.
- Components and pages: PascalCase for React components; filenames `ComponentName.tsx`. Tests: `*.spec.ts(x)`.
- TurboUI component architecture and patterns: `turboui/AGENTS.md`.

## UI Pattern Checklist

- When a request references an existing screen, component, or screenshot, inspect that source in the repo before coding. Reuse its structure, typography, and spacing verbatim unless the user explicitly requests something different.
- Treat screenshots as canonical references: find the implementation they depict (e.g., ProjectPage headers, Milestone cards) and mirror that implementation rather than improvising.
- Prefer existing TurboUI components over hand-rolled versions. If you cannot reuse an existing piece, call it out in the summary with a brief reason.

## Activity System Guidelines

Activities are the event log of the application. When significant actions happen (e.g., creating a project, updating a goal), an activity record is created. Activities power the activity feed, notifications, and audit logs. Creating a new activity requires implementing five components across backend and frontend.

### Activity Components

1. **Content Handler** (`app/lib/operately/activities/content/[action_name].ex`): Embedded Ecto schema defining activity data structure
2. **Notification Handler** (`app/lib/operately/activities/notifications/[action_name].ex`): Determines who receives notifications
3. **Type Definition** (`app/lib/operately_web/api/types.ex`): GraphQL type for the activity content
4. **Serializer** (`app/lib/operately_web/api/serializers/activity_content/[action_name].ex`): Converts content to API format
5. **Feed Handler** (`app/assets/js/features/activities/[ActionName]/index.tsx`): Renders the activity in UI

**Examples:** See `project_created`, `goal_created`, `project_champion_updating` for reference implementations of all components.

### Creating Activities

Activities are inserted in operations using `Activities.insert_sync/4` within an `Ecto.Multi` transaction.

**Example:** `app/lib/operately/operations/project_creation.ex:171-177`

### Content Handler

Embedded Ecto schema with `use Operately.Activities.Content`. Module name is PascalCase (e.g., `project_created` → `ProjectCreated`). Use `belongs_to` with `type: :string` for IDs. Implement `changeset/1` and `build/1`.

**Examples:** `app/lib/operately/activities/content/{project_created,goal_created,space_added}.ex`

### Type Definition

Add `object :activity_content_[action_name]` to `app/lib/operately_web/api/types.ex`. Use `field` for required, `field?` for optional. Keep macro style without parentheses.

**Examples:** Search for `activity_content_` in `app/lib/operately_web/api/types.ex`

### Serializer

Implement `OperatelyWeb.Api.Serializable` protocol. Access content with string keys, use `Serializer.serialize/2` for nested objects with `level`, return map with atom keys.

**Examples:** `app/lib/operately_web/api/serializers/activity_content/{project_created,goal_closing}.ex`

### Feed Handler

Implement `ActivityHandler` interface in `app/assets/js/features/activities/[ActionName]/index.tsx`. Import type from `@/api`, add proper null guards (never use `!`), check `page` parameter for context-aware rendering. Register in `index.tsx`: import, add to `DISPLAYED_IN_FEED`, add `.with()` clause.

**Examples:** `app/assets/js/features/activities/{ProjectCreated,GoalCreated,ProjectChampionUpdating}/index.tsx`

## Data Migration Guidelines

- Data migrations in `app/lib/operately/data` should not depend on application modules such as `Operately.Goals.Goal` or `Operately.Activities.Activity`. Define minimal inline module structs/functions within the migration that include only the fields and helpers required; this keeps the migration stable even if the real modules change later (see `app/lib/operately/data/change_082_populate_goal_description_changed_activity_goal_name.ex` and `app/lib/operately/data/change_080_create_subscriptions_list_for_tasks.ex` for reference).

```elixir
# ❌ DON'T: referencing application modules directly inside migrations
defmodule Operately.Data.Change155MyMigration do
  alias Operately.Repo
  alias Operately.Activities.Activity

  def run do
    from(a in Activity, where: a.action == "task_description_change")
    |> Repo.update_all(set: [content: %{}])
  end
end

# ✅ DO: declare minimal inline structs/modules needed by the migration
defmodule Operately.Data.Change155MyMigration do
  alias Operately.Repo
  alias __MODULE__.Activity

  def up do
    from(a in Activity, where: a.action == "task_description_change")
    |> Repo.update_all(set: [content: %{}])
  end

  defmodule Activity do
    use Operately.Schema

    schema "activities" do
      field :action, :string
      field :content, :map
    end
  end
end
```

## Testing Guidelines

Read the testing guide at app/test/AGENTS.md.

## Commit & Pull Request Guidelines

- DCO required: sign off every commit. Example: `git commit -s -m "feat: add goal editor"` (see `docs/commit_sign-off.md`).
- PR title format enforced: `feat: ...`, `fix: ...`, `chore: ...`, or `docs: ...` (checked by `scripts/pr-name-check`).
- PRs should include: clear description, screenshots for UI changes, migration notes if DB changes, and linked issues.

## Security & Configuration Tips

- Local env: run `make dev.seed.env` to scaffold `.env` and certs. Never commit secrets.
- Use `./devenv` wrapper (Docker-based) for consistent tooling and DB.
