---
name: ecto-migrations
description: >-
  Rules for Operately schema migrations (app/priv/repo/migrations/) and data
  migrations (app/lib/operately/data/change_*.ex). Use when adding, renaming,
  reviewing, or generating database migrations, ecto.gen.migration,
  Operately.Data.Change* modules, backfills, schema_migrations version
  collisions, mix ecto.migrate, or make gen.migration.
---

# Ecto Migrations

Two layers work together:

| Layer | Location | Role |
| ----- | -------- | ---- |
| Schema migration | `app/priv/repo/migrations/*.exs` | DDL and/or calls a data change; tracked in `schema_migrations` |
| Data migration | `app/lib/operately/data/change_NNN_*.ex` | Backfills and data fixes; invoked from a thin schema migration |

## Creating schema migration files

**Always** create files in `app/priv/repo/migrations/` with:

```bash
make gen.migration NAME=add_foo_to_bars
```

That runs `mix ecto.gen.migration` inside devenv (see root `Makefile` `gen.migration` target) and assigns a unique timestamp version.

**Never** create or copy migration files by hand (including inventing a
`YYYYMMDDHHMMSS_*.exs` name). Manual timestamps collide across PRs that land
close together. Ecto keys migrations by the numeric prefix only, so duplicates
cause skipped migrations, re-runs, and production failures (e.g. `duplicate_column`
or missing columns after a rename).

After generating, edit only the body of the generated file. Do not rename the
file to “fix” a conflict with another branch — coordinate timestamps via
`make gen.migration` on an up-to-date main instead.

## Data migrations

Backfills and one-off data fixes live under `app/lib/operately/data/` as
`Operately.Data.ChangeNNN…` modules. A thin schema migration (created with
`make gen.migration`) calls them:

```elixir
defmodule Operately.Repo.Migrations.BaselineDocumentVersions do
  use Ecto.Migration

  def up do
    Operately.Data.Change110BaselineDocumentVersions.run()
  end

  def down do
    :ok
  end
end
```

**Examples:** `change_110_baseline_document_versions.ex` ←
`20260720190200_baseline_document_versions.exs`;
`change_106_backfill_document_names_from_nodes.ex` ←
`20260720120100_backfill_document_names_from_nodes.exs`.

### Naming

- Next unused number: look at the highest `change_NNN_*.ex` under
  `app/lib/operately/data/` (currently in the 110s).
- Module: `Operately.Data.ChangeNNNDescriptiveName`
- File: `change_NNN_descriptive_name.ex`
- Prefer a `run/0` entry point (some older modules use `up/0`).

### Do not depend on application modules

Data migrations must **not** alias live app schemas such as
`Operately.Goals.Goal` or `Operately.Activities.Activity`. Those modules change
over time; a migration that imports them can break on fresh installs months
later.

Define **minimal inline** structs/modules inside the change module with only the
fields and helpers the migration needs.

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

  def run do
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

**References:**
`change_082_populate_goal_description_changed_activity_goal_name.ex`,
`change_080_create_subscriptions_list_for_tasks.ex`,
`change_110_baseline_document_versions.ex`.

(Same rule is summarized in root `AGENTS.md` under Data Migration Guidelines.)

### Idempotency and tests

- Prefer idempotent `run/0` (safe if re-run or if some rows already match the
  target state).
- Add tests under `app/test/operately/data/change_NNN_*_test.exs` (see
  `change_110_baseline_document_versions_test.exs`).

## Checklist

- [ ] Schema migration created via `make gen.migration NAME=...`
- [ ] No hand-written or hand-copied `app/priv/repo/migrations/*.exs` filenames
- [ ] Version prefix is unique among existing migrations before opening the PR
- [ ] Data backfill lives in `Operately.Data.ChangeNNN…` with inline schemas only
- [ ] Schema migration’s `up/0` only delegates to `ChangeNNN.run()` (plus any DDL)
- [ ] Data change is idempotent where practical and covered by a unit test
