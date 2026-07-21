---
name: writing-tests
description: >-
  Operately test layout, naming (.projections.json), factories, feature/e2e
  steps, external query/mutation auth specs, and how to run Elixir/API/JS/EE
  tests. Use when adding, renaming, splitting, or reviewing tests; choosing
  where a test belongs; writing Factory/TurboCase/FeatureCase or
  ExternalApi QuerySpec/MutationSpec tests; or running make test / feature tests.
---

# Writing Tests

Canonical guide for **where tests live**, **how to write them**, and **how to
run them**. Pairing rules come from [`.projections.json`](../../../.projections.json).

## Projections rule (required)

Follow `.projections.json` when creating or renaming tests.

### App library code

| Source | Test |
| --- | --- |
| `app/lib/foo/bar.ex` | `app/test/foo/bar_test.exs` |

Path under `app/lib/` maps 1:1 under `app/test/`, with a `_test.exs` suffix.

**API endpoints:** one endpoint module → one test module. Do **not** bundle
several endpoints into a shared file (e.g. no `versions_test.exs` covering
`list_versions` and `get_version`).

```
app/lib/operately_web/api/documents/list_versions.ex
→ app/test/operately_web/api/documents/list_versions_test.exs

app/lib/operately_web/api/documents/get_version.ex
→ app/test/operately_web/api/documents/get_version_test.exs
```

Cross-cutting assertions for another endpoint belong in **that** endpoint’s
test file (e.g. `expected_version` on update → `update_test.exs`).

External (token) API coverage is a separate layer — see
[External queries and mutations](#external-queries-and-mutations).

### Feature / CLI / MCP e2e

| Test | Steps alternate |
| --- | --- |
| `app/test/features/foo_test.exs` | `app/test/support/features/foo_steps.ex` |
| `app/test/cli_e2e/foo_test.exs` | `app/test/support/cli_e2e/foo_steps.ex` |
| `app/test/mcp_e2e/.../foo_test.exs` | `app/test/support/mcp_e2e/.../foo_steps.ex` |

### Enterprise

| Source | Test |
| --- | --- |
| `app/ee/lib/foo.ex` | `app/ee/test/lib/foo_test.exs` |
| `app/ee/lib/admin_api/foo.ex` | `app/ee/test/operately_ee/admin_api/foo_test.exs` |

## Running tests

Prefer `make test FILE=...` from the repo root (runs inside `./devenv`).

```bash
# Elixir unit / API / feature (path may be app/test/... or test/...)
make test FILE=app/test/operately_web/api/documents/list_versions_test.exs
make test FILE=app/test/features/goal_creation_test.exs:21

# Jest
make test FILE=assets/js/path.spec.ts
```

**Always pass `FILE=`** for the specific test(s) under change. Do not run suite-wide
targets while iterating — they take too long:

- `make test` / `make test.mix` / `make test.mix.unit` / `make test.mix.features` /
  `make test.npm` / `make test.ee` without `FILE=` (full suite)
- `INDEX=… TOTAL=… make test.mix.features` (parallel CI shards; still a large slice)
- `make test.mix.features FILE=…` (`FILE` is ignored; runs the feature suite)
- bare `mix test` from the host with no path (use `make test FILE=…` or
  `./devenv … mix test <path>` as below)

### Feature tests in agent / CI mode

Local non-CI feature tests expect Vite on `localhost:4005`. Without it, Wallaby
can load a blank page. For CI-equivalent runs:

```bash
make test.build
./devenv bash -c 'cd app && CI=true mix test test/features/space_kanban_test.exs'
./devenv bash -c 'cd app && CI=true mix test test/features/project_tasks_test.exs:425'
```

Pass `CI=true` explicitly in the inner command (root `.env` may have empty `CI=`).

Screenshots: host `screenshots/` → container `/tmp/screenshots`. Clear with
`make test.screenshots.clear`.

If a killed feature run leaves port 4002 busy:

```bash
./devenv bash -c "ps -ef | grep 'beam\\|mix test' | grep -v grep"
./devenv bash -c "kill <pid>"
```

## Test types and case modules

| Kind | Location | Case | Notes |
| --- | --- | --- | --- |
| Unit / domain | `app/test/operately/`, … | `Operately.DataCase` | Fast; no Wallaby |
| API (TurboConnect) | `app/test/operately_web/api/` | `OperatelyWeb.TurboCase` | One `*_test.exs` per endpoint |
| External API auth | `app/test/operately_web/api/external_{queries,mutations}/` | specs + `auth_test.exs` | Token auth coverage (see below) |
| Controllers / plugs | `app/test/operately_web/controllers/`, … | `Operately.ConnCase` / relevant case | |
| Feature (browser) | `app/test/features/` | `Operately.FeatureCase` | Wallaby; step modules |
| CLI e2e | `app/test/cli_e2e/` | see existing tests | Steps under `support/cli_e2e/` |
| MCP e2e | `app/test/mcp_e2e/` | `Operately.McpE2eCase` etc. | Steps under `support/mcp_e2e/` |
| Enterprise | `app/ee/test/` | per projections | `make test.ee` |
| JS | `app/assets/js/**/*.spec.ts(x)` | Jest | `make test FILE=assets/js/...` |

DB tests clean up via transactions; no manual teardown.

## External queries and mutations

The **external API** (API tokens for CLI/integrations) is covered by a second
layer beside the normal per-endpoint `*_test.exs` files.

| Role | Queries | Mutations |
| --- | --- | --- |
| Spec module (`.ex`, not `_test.exs`) | `…/external_queries/queries/...` | `…/external_mutations/mutations/...` |
| Spec registry | `…/external_queries/queries.ex` → `__spec_modules__/0` | `…/external_mutations/mutations.ex` → `__spec_modules__/0` |
| Driver test | `…/external_queries/auth_test.exs` | `…/external_mutations/auth_test.exs` |
| Behaviour | `Operately.Support.ExternalApi.QuerySpec` | `Operately.Support.ExternalApi.MutationSpec` |

**When you add or expose an endpoint on `OperatelyWeb.Api.External`:**

1. Keep (or add) the normal TurboCase `*_test.exs` for behavior/permissions.
2. Add a QuerySpec / MutationSpec with `setup/1`, `inputs/1` (optional), and
   `assert/2`. Override `query_name/0` or `mutation_name/0` when the default
   (underscored last module segment) is wrong — names are usually
   `"resource/action"` (e.g. `"documents/list_versions"`).
3. Register the module in `__spec_modules__/0` in `queries.ex` or `mutations.ex`.
4. Run the matching `auth_test.exs` (targeted), not the whole suite.

```
app/lib/operately_web/api/documents/list_versions.ex
→ app/test/operately_web/api/documents/list_versions_test.exs          # behavior
→ app/test/operately_web/api/external_queries/queries/documents/list_versions.ex  # external auth spec
→ register in external_queries/queries.ex
```

Wrapper endpoints live under `queries/wrappers/` or `mutations/wrappers/`
(e.g. `documents/update_document`).

`auth_test.exs` checks every registered external endpoint for:

- coverage (no missing/extra/invalid specs vs `OperatelyWeb.Api.External`)
- no token → 401
- browser session on external → 401
- API token on **internal** API → rejected
- read-only token → queries succeed; mutations → 403
- full token → 200 and `assert/2` on the response

```bash
make test FILE=app/test/operately_web/api/external_queries/auth_test.exs
make test FILE=app/test/operately_web/api/external_mutations/auth_test.exs
```

Example query spec:

```elixir
defmodule OperatelyWeb.Api.ExternalQueries.Queries.Documents.ListVersions do
  use Operately.Support.ExternalApi.QuerySpec

  @impl true
  def query_name, do: "documents/list_versions"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_document(:document, :hub)
  end

  @impl true
  def inputs(ctx), do: %{document_id: Paths.document_id(ctx.document)}

  @impl true
  def assert(response, _ctx) do
    assert is_list(response.versions)
    assert length(response.versions) >= 1
  end
end
```

## Factory pattern (preferred for new tests)

Use `Operately.Support.Factory` (`app/test/support/factory.ex`) so entities are
related correctly. Prefer Factory over wiring `*_fixture` calls by hand in new
tests (older tests may still use fixtures).

```elixir
setup ctx do
  ctx
  |> Factory.setup()
  |> Factory.add_space(:marketing)
  |> Factory.add_project(:website, :marketing)
end
```

API example: `use OperatelyWeb.TurboCase`, then `Factory.setup()` / `Factory.log_in_person/2`
and `query/3` or `mutation/3`.

## Feature test step pattern

Feature tests chain steps from a support module. Steps modules typically
`use Operately.FeatureCase` (which `import`s `Operately.FeatureSteps` and aliases
`UI`, `Factory`, `Paths`).

```elixir
# app/test/features/goal_creation_test.exs
defmodule Operately.Features.GoalCreationTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.GoalCreationTestSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "create a new goal", ctx do
    ctx
    |> Steps.visit_new_goal_page()
    |> Steps.fill_in_goal_form("Example Goal")
    |> Steps.submit()
    |> Steps.assert_goal_added("Example Goal")
  end
end
```

```elixir
# app/test/support/features/goal_creation_steps.ex
defmodule Operately.Support.Features.GoalCreationTestSteps do
  use Operately.FeatureCase

  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.log_in_person(:creator)
  end

  step :visit_new_goal_page, ctx do
    ctx |> UI.visit(Paths.new_goal_path(ctx.company))
  end
end
```

### Email assertions

Unit/API: `assert_email_sent/1` (Swoosh). Feature: `UI.assert_email_sent/3` or
`Operately.Support.Features.EmailSteps`.

## Migration-related testing

Schema/data migration rules: `ecto-migrations` skill. After migration changes:

```bash
make test.db.reset
make test.db.migrate
make test.mix
```

Data changes: `app/test/operately/data/change_NNN_*_test.exs`.

## Common pitfalls

1. Running the full suite instead of `make test FILE=app/test/...` for the files under change
2. INDEX/TOTAL on a single-file run
3. New tests hand-rolling fixtures instead of Factory
4. Mixing conflicting sync/async DB tests
5. Hardcoding IDs instead of factory-built entities
6. Grab-bag `*_test.exs` covering multiple unrelated modules/endpoints
7. New external endpoint without a QuerySpec/MutationSpec + registry entry
8. Feature tests without `CI=true` / assets when Vite is not running

## Checklist

- [ ] New module/endpoint has a matching `*_test.exs` per projections
- [ ] Test module name mirrors the source (`ListVersions` → `ListVersionsTest`)
- [ ] No grab-bag test file for multiple unrelated modules
- [ ] New setup uses Factory where practical; API tests use `TurboCase`
- [ ] New external API endpoint has a QuerySpec/MutationSpec, is listed in
      `queries.ex` / `mutations.ex`, and `auth_test.exs` still passes
- [ ] Feature/CLI/MCP tests have a steps alternate when required by projections
- [ ] Run with `make test FILE=app/test/...` (feature CI: `CI=true` via devenv)
