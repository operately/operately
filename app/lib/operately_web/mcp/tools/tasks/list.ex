defmodule OperatelyWeb.Mcp.Tools.Tasks.List do
  use OperatelyWeb.Mcp.Tool

  @impl true
  def definition do
    Definition.new!(
      name: "list_tasks",
      title: "List Tasks",
      description: "Lists tasks in the authenticated company with optional filters.",
      company_mode: :authenticated,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 70,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "tasks"},
      examples: [
        %{"title" => "List visible tasks", "arguments" => %{}},
        %{"title" => "List tasks related to a goal", "arguments" => %{"goal_id" => "goal_123"}}
      ],
      input_schema:
        JsonSchema.object(%{
          "space_id" => JsonSchema.string("Optional space identifier used to filter tasks."),
          "project_id" => JsonSchema.string("Optional project identifier used to filter tasks."),
          "goal_id" => JsonSchema.string("Optional goal identifier used to filter tasks."),
          "query" => JsonSchema.string("Optional text query used to narrow matching tasks."),
          "only_completed" => JsonSchema.boolean("When true, return only completed tasks.")
        }),
      output_schema:
        JsonSchema.object(
          %{
            "tasks" => JsonSchema.array(JsonSchema.any_object(), description: "The matching tasks.")
          },
          required: ["tasks"]
        )
    )
  end

  @impl true
  def call(_context, _arguments), do: not_implemented()
end
