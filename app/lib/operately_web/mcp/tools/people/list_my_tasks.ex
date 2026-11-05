defmodule OperatelyWeb.Mcp.Tools.People.ListMyTasks do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.People.ListMyTasks, as: PeopleListMyTasks

  @impl true
  def definition do
    Definition.new!(
      name: "list_my_tasks",
      title: "List My Tasks",
      description: "Lists open tasks assigned to the authenticated person. Includes tasks on active projects and tasks with no project. Omits closed and archived tasks.",
      company_mode: :authenticated,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 22,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "people"},
      examples: [%{"title" => "List my open tasks", "arguments" => %{}}],
      input_schema: JsonSchema.object(%{}),
      output_schema:
        JsonSchema.object(
          %{
            "tasks" => JsonSchema.array(JsonSchema.any_object(), description: "Open tasks assigned to the authenticated person.")
          },
          required: ["tasks"]
        )
    )
  end

  @impl true
  def call(conn, _arguments), do: PeopleListMyTasks.call(conn, %{})
end
