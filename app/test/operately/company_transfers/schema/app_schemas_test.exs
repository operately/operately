defmodule Operately.CompanyTransfers.Schema.AppSchemasTest do
  use ExUnit.Case, async: true

  alias Operately.CompanyTransfers.Schema.AppSchemas

  test "schema_for_table/1 resolves task_assignees in release-safe discovery" do
    assert AppSchemas.schema_for_table("task_assignees") == Operately.Tasks.Assignee
  end

  test "persisted_fields_for_table/1 exposes task assignee columns" do
    assert AppSchemas.persisted_fields_for_table("task_assignees") == %{
             "id" => :id,
             "inserted_at" => :inserted_at,
             "person_id" => :person_id,
             "task_id" => :task_id,
             "updated_at" => :updated_at
           }
  end
end
