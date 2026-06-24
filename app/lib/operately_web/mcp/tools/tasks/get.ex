defmodule OperatelyWeb.Mcp.Tools.Tasks.Get do
  use OperatelyWeb.Mcp.Tool

  @impl true
  def definition do
    Definition.new!(
      name: "get_task",
      title: "Get Task",
      description: "Returns one task by identifier.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 80,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "tasks"},
      examples: [%{"title" => "Open a task by ID", "arguments" => %{"task_id" => "task_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "task_id" => JsonSchema.string("The task identifier.")
          },
          required: ["task_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "task" => JsonSchema.any_object("The matching task.")
          },
          required: ["task"]
        )
    )
  end

  @impl true
  def call(_context, _arguments), do: not_implemented()
end
