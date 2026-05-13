defmodule Operately.CompanyTransfers.Schema.AppSchemasTest do
  use ExUnit.Case, async: true

  alias Operately.CompanyTransfers.Schema.AppSchemas

  test "unknown_table_diagnostics/1 reports schema candidates for task_assignees" do
    diagnostics = AppSchemas.unknown_table_diagnostics("task_assignees")

    assert diagnostics.cached_schema_module == Operately.Tasks.Assignee
    assert diagnostics.cached_map_contains_table == true

    assert Enum.any?(diagnostics.application_schema_candidates, fn candidate ->
             candidate.module == Operately.Tasks.Assignee
           end)
  end
end
