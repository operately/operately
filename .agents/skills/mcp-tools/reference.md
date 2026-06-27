# MCP Tools Reference

Expands on [SKILL.md](SKILL.md). Read this when implementing a new MCP tool,
adding a missing API endpoint, or writing tests.

## ListTaskStatuses Walkthrough

This is the canonical API-first example. The API was created before the MCP
tool because no existing endpoint listed task statuses for one task.

### Files (in creation order)

| Step | Layer | Path |
| ---- | ----- | ---- |
| 1 | API handler | `app/lib/operately_web/api/tasks/list_task_statuses.ex` |
| 2 | API registration | `app/lib/operately_web/api.ex` → `query(:list_task_statuses, …)` |
| 3 | API tests | `app/test/operately_web/api/tasks/list_task_statuses_test.exs` |
| 4 | MCP wrapper | `app/lib/operately_web/mcp/tools/tasks/list_task_statuses.ex` |
| 5 | MCP tests | `app/test/operately_web/mcp/tools/tasks/list_task_statuses_test.exs` |
| 6 | Catalog | `@expected_tool_names` in `app/test/operately/mcp/tools_test.exs` |

### What each layer does

**API** loads the task, checks permissions, returns serialized statuses:

```elixir
def call(conn, inputs) do
  with {:ok, task} <- Task.get(me(conn), id: inputs.task_id, opts: [preload: [:project, :space]]),
       {:ok, :allowed} <- Permissions.check(...) do
    {:ok, %{task_statuses: Serializer.serialize(Task.available_statuses(task))}}
  else
    {:error, :forbidden} -> {:error, :forbidden}
    {:error, _} -> {:error, :not_found}
  end
end
```

**MCP wrapper** only decodes the external ID and forwards:

```elixir
def call(conn, %{"task_id" => task_id}) do
  with {:ok, task_id} <- Helpers.decode_id(task_id) do
    TaskStatusesList.call(conn, %{task_id: task_id})
  end
end
```

**MCP tests** call the wrapper directly — they do not hit HTTP:

```elixir
ListTaskStatuses.call(ToolConnHelper.conn(ctx), %{"task_id" => Paths.task_id(ctx.task)})
```

**API tests** use TurboCase and cover auth, validation, and permissions exhaustively.

---

## API Query Template

Use for read operations. Based on `ListTaskStatuses`.

```elixir
defmodule OperatelyWeb.Api.Tasks.ExampleQuery do
  @moduledoc """
  Short description of what this query returns.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Tasks.Task
  alias Operately.Projects.Permissions
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :task_id, :id, null: false
  end

  outputs do
    field :task_statuses, list_of(:task_status), null: false
  end

  def call(conn, inputs) do
    with {:ok, task} <- Task.get(me(conn), id: inputs.task_id, opts: [preload: [:project, :space]]),
         {:ok, :allowed} <- Permissions.check(task.request_info.access_level, :can_view, company_read_only: company_read_only(conn)) do
      {:ok, %{task_statuses: Serializer.serialize(Task.available_statuses(task))}}
    else
      {:error, :forbidden} -> {:error, :forbidden}
      {:error, _} -> {:error, :not_found}
    end
  end
end
```

Register in `app/lib/operately_web/api.ex`:

```elixir
namespace :tasks do
  # ...
  query(:list_task_statuses, OperatelyWeb.Api.Tasks.ListTaskStatuses)
end
```

---

## API Mutation Template

Use for write operations. Based on `UpdateName`.

```elixir
defmodule OperatelyWeb.Api.Projects.ExampleMutation do
  @moduledoc """
  Short description of what this mutation does.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects
  alias Operately.Projects.Permissions

  inputs do
    field :project_id, :id, null: false
    field :name, :string, null: false
  end

  outputs do
    field :project, :project, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:project, fn ctx -> Projects.get_project_with_access_level(inputs.project_id, ctx.me.id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.project.requester_access_level, :can_edit, company_read_only: company_read_only(conn)) end)
    |> run(:operation, fn ctx -> Projects.rename_project(ctx.me, ctx.project, inputs.name) end)
    |> run(:serialized, fn ctx -> {:ok, %{project: Serializer.serialize(ctx.operation)}} end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :project, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end
end
```

Register in `app/lib/operately_web/api.ex`:

```elixir
namespace :projects do
  # ...
  mutation(:update_name, OperatelyWeb.Api.Projects.UpdateName)
end
```

---

## MCP Read Tool Template

```elixir
defmodule OperatelyWeb.Mcp.Tools.Tasks.ExampleRead do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Tasks.ExampleQuery, as: ExampleQuery
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "example_read",
      title: "Example Read",
      description: "What this tool returns and when to use it.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 81,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "tasks"},
      examples: [%{"title" => "Example", "arguments" => %{"task_id" => "task_123"}}],
      input_schema:
        JsonSchema.object(
          %{"task_id" => JsonSchema.string("The task identifier.")},
          required: ["task_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"task_statuses" => JsonSchema.array(JsonSchema.any_object(), description: "The result.")},
          required: ["task_statuses"]
        )
    )
  end

  @impl true
  def call(conn, %{"task_id" => task_id}) do
    with {:ok, task_id} <- Helpers.decode_id(task_id) do
      ExampleQuery.call(conn, %{task_id: task_id})
    end
  end
end
```

---

## MCP Write Tool Template

```elixir
defmodule OperatelyWeb.Mcp.Tools.Projects.ExampleWrite do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.ExampleMutation, as: ExampleMutation
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "example_write",
      title: "Example Write",
      description: "What this tool changes.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 124,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [%{"title" => "Example", "arguments" => %{"project_id" => "project_123", "name" => "New Name"}}],
      input_schema:
        JsonSchema.object(
          %{
            "project_id" => JsonSchema.string("The project identifier."),
            "name" => JsonSchema.string("The new name.")
          },
          required: ["project_id", "name"]
        ),
      output_schema:
        JsonSchema.object(
          %{"project" => JsonSchema.any_object("The updated project.")},
          required: ["project"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, project_id} <- Helpers.decode_id(arguments["project_id"]) do
      ExampleMutation.call(conn, %{project_id: project_id, name: arguments["name"]})
    end
  end
end
```

---

## MCP Write Tool with Optional Clear

When omitting an optional field should clear it (check sibling tools in the
domain first):

```elixir
def call(conn, arguments) do
  with {:ok, project_id} <- Helpers.decode_id(arguments["project_id"]),
       {:ok, due_date} <- Helpers.parse_day_date(arguments["due_date"]) do
    ProjectUpdateDueDate.call(conn, %{project_id: project_id, due_date: due_date})
  end
end
```

Document in the schema description: `"Omit it to clear the due date."`

Test both set and clear:

```elixir
test "call/2 clears the project due date when due_date is omitted" do
  # set a date first, then call without due_date key
  assert {:ok, %{success: true}} =
           UpdateDueDate.call(ToolConnHelper.conn(ctx), %{"project_id" => Paths.project_id(ctx.project)})

  assert ToolConnHelper.reload(ctx.project).timeframe.contextual_end_date == nil
end
```

---

## Hub Scope + Wrapper Pattern

When MCP exposes `space_id` / `project_id` / `goal_id` instead of
`resource_hub_id`:

**MCP tool** validates scope and calls wrapper:

```elixir
def call(conn, arguments) do
  with {:ok, scope_inputs} <- Helpers.decode_hub_scope(arguments),
       {:ok, folder_id} <- Helpers.decode_optional_id(arguments["folder_id"]),
       {:ok, type} <- decode_link_type(arguments["type"]) do
    LinkCreate.call(conn, Map.merge(scope_inputs, %{
      folder_id: folder_id,
      name: arguments["name"],
      url: arguments["url"],
      type: type,
      description: description,
      subscriber_ids: []
    }))
  end
end
```

**Wrapper** resolves hub and delegates to low-level API:

```elixir
def call(conn, inputs) do
  with {:ok, internal_inputs} <- to_internal_inputs(conn, inputs) do
    LinkCreate.call(conn, internal_inputs)
  end
end
```

Study: `app/lib/operately_web/mcp/tools/docs_and_files/create_link.ex` and
`app/lib/operately_web/api/wrappers/docs_and_files/create_link.ex`.

---

## Enum Decoding

Never call `String.to_existing_atom/1` on unchecked user input.

**Explicit decode clauses** (preferred for small enums):

```elixir
defp decode_success_status("achieved"), do: {:ok, :achieved}
defp decode_success_status("missed"), do: {:ok, :missed}
defp decode_success_status(_), do: {:error, :invalid_arguments}
```

**Whitelist + existing atom** (for domain enums):

```elixir
@valid_link_types Enum.map(Link.valid_types(), &Atom.to_string/1)

defp decode_link_type(type) when type in @valid_link_types, do: {:ok, String.to_existing_atom(type)}
defp decode_link_type(_), do: {:error, :invalid_arguments}
```

Also declare the enum in `input_schema` via `JsonSchema.string(..., enum: @valid_link_types)`.

---

## MCP Unit Test Template

```elixir
defmodule OperatelyWeb.Mcp.Tools.Tasks.ExampleReadTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Tasks.ExampleRead
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 returns expected result" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone)

    assert {:ok, %{task_statuses: task_statuses}} =
             ExampleRead.call(ToolConnHelper.conn(ctx), %{
               "task_id" => Paths.task_id(ctx.task)
             })

    assert length(task_statuses) > 0
  end

  test "returns not_found for a resource outside the authenticated company" do
    # create resource in another company, call with ToolConnHelper.conn_with_assigns/4
    assert {:error, :not_found} = ExampleRead.call(conn, %{"task_id" => Paths.task_id(other_task)})
  end

  test "returns invalid_arguments for malformed identifiers" do
    ctx = Factory.setup(%{})

    assert {:error, :invalid_arguments} =
             ExampleRead.call(ToolConnHelper.conn(ctx), %{"task_id" => "not-a-valid-id"})
  end
end
```

Use `ToolConnHelper.conn(ctx)` for read+write scopes, or
`ToolConnHelper.conn_with_assigns(account, company, person, ["mcp:read"])` for
scope-specific tests.

---

## API TurboCase Test Skeleton

```elixir
defmodule OperatelyWeb.Api.Tasks.ExampleQueryTest do
  use OperatelyWeb.TurboCase

  alias OperatelyWeb.Paths

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:tasks, :list_task_statuses], %{})
    end
  end

  describe "validation" do
    setup ctx do
      register_and_log_in_account(ctx)
    end

    test "it requires a task_id", ctx do
      assert {400, res} = query(ctx.conn, [:tasks, :list_task_statuses], %{})
      assert res.message == "Missing required fields: task_id"
    end

    test "returns not found for unknown task", ctx do
      assert {404, _} = query(ctx.conn, [:tasks, :list_task_statuses], %{task_id: Ecto.UUID.generate()})
    end
  end

  describe "permissions" do
    setup ctx do
      register_and_log_in_account(ctx)
    end

    test "returns data when the requester has access", ctx do
      task = create_task(ctx, company_access: Binding.view_access())
      assert {200, res} = query(ctx.conn, [:tasks, :list_task_statuses], %{task_id: Paths.task_id(task)})
      assert length(res.task_statuses) > 0
    end
  end
end
```

---

## sort_order Bands

Pick a value in the right band. When two tools share the same `sort_order`,
catalog order uses alphabetical `name` as tiebreaker.

| Range | Category | Examples |
| ----- | -------- | -------- |
| 10–22 | Company, people | `get_current_company`, `get_me`, `list_people` |
| 23–30 | Spaces, project lists | `list_spaces`, `list_projects` |
| 40–70 | Gets, lists | `get_project`, `list_tasks`, `list_goals` |
| 80–95 | Task/space getters, docs getters | `list_task_statuses`, `get_space_discussion` |
| 90–100 | Search, fetch, docs list | `search`, `fetch`, `list_docs_and_files` |
| 110–134 | Comments, check-ins, project writes | `create_comment`, `update_project_due_date` |
| 140–153 | Goal writes | `create_goal`, `close_goal` |
| 160–166 | Task writes | `create_task`, `update_task_status` |
| 170–175 | Milestone writes | `create_milestone`, `complete_milestone` |
| 180–184 | Space writes | `create_space`, `update_space` |
| 190–200 | Docs & files writes | `create_link`, `create_document` |

After choosing `sort_order`, insert the tool name into `@expected_tool_names`
at the position that matches the sorted catalog (`sort_order`, then `name`).

---

## Common Pitfalls

### No `company_id` in MCP inputs

Company context comes from the OAuth grant via `conn.assigns.current_company`.
Catalog tests forbid `company_id` in input schemas.

### sort_order collisions

Duplicate `sort_order` values sort alphabetically by `name`. Either pick a
unique value or accept tie-breaking when updating `@expected_tool_names`.

### InputValidator limitations

Pre-flight validation only checks required keys, unexpected keys (when
`additionalProperties: false`), string/boolean/array types, enum, and URI
format. No nested object validation. Complex logic belongs in `call/2`.

### Scope/annotation mismatch

Catalog tests enforce alignment:

- Read-only → `["mcp:read"]` + `read_annotations()` (`readOnlyHint: true`)
- Write → `["mcp:write"]` + `write_annotations()` (`readOnlyHint: false`)

### Do not bypass API

MCP tools must call `OperatelyWeb.Api.*` or `OperatelyWeb.Api.Wrappers.*`.
Never call `Operately.*` context modules directly from MCP tools.

### Error mapping

| Return from `call/2` | Meaning |
| -------------------- | ------- |
| `{:error, :invalid_arguments}` | Bad client input — malformed IDs, conflicting scopes, invalid enums |
| `{:error, :not_found}` | Resource missing or not accessible in this company |
| `{:error, :forbidden}` | Authenticated but not permitted |

Use `:invalid_arguments` for client mistakes, not `:not_found`.

### Output shape

Return atom-key maps matching `output_schema` top-level keys. The Executor
stringifies keys for MCP clients.

---

## Study These Files

| Scenario | MCP tool | API / wrapper |
| -------- | -------- | ------------- |
| Simple read wrapper | `app/lib/operately_web/mcp/tools/tasks/list_task_statuses.ex` | `app/lib/operately_web/api/tasks/list_task_statuses.ex` |
| Write with optional clear | `app/lib/operately_web/mcp/tools/projects/update_due_date.ex` | sibling project update APIs |
| Hub scope + wrapper | `app/lib/operately_web/mcp/tools/docs_and_files/create_link.ex` | `app/lib/operately_web/api/wrappers/docs_and_files/create_link.ex` |
| Explicit enum decode | `app/lib/operately_web/mcp/tools/projects/close.ex` | `app/lib/operately_web/api/projects/close.ex` |
| Whitelist + existing atom | `app/lib/operately_web/mcp/tools/docs_and_files/create_link.ex` | — |

Supporting infrastructure:

- `app/lib/operately_web/mcp/tool.ex` — behaviour
- `app/lib/operately_web/mcp/helpers.ex` — shared decoding
- `app/lib/operately_web/mcp/catalog/registry.ex` — auto-discovery
- `app/lib/operately_web/mcp/executor.ex` — dispatch + result normalization
- `app/test/support/mcp_tool_conn_helper.ex` — test conn builder
- `app/test/operately/mcp/tools_test.exs` — catalog invariants
- `specs/0012-operately-mcp.md` — product spec

---

## Test Commands

```bash
# API tests for a new endpoint
make test FILE=app/test/operately_web/api/tasks/list_task_statuses_test.exs

# MCP unit tests for a new tool
make test FILE=app/test/operately_web/mcp/tools/tasks/list_task_statuses_test.exs

# Catalog invariants (always run after adding a tool)
make test FILE=app/test/operately/mcp/tools_test.exs

# Optional end-to-end MCP HTTP
make test FILE=app/test/operately_web/controllers/mcp_controller_test.exs
```
