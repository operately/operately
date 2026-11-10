defmodule OperatelyWeb.Mcp.Tools.Tasks.CreateBoard do
  use OperatelyWeb.Mcp.Tool
  alias OperatelyWeb.Api.Tasks.CreateBoard, as: Endpoint
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "create_task_board",
      title: "Create Task Board",
      description: "Create a space-owned Task Board at the end of the list. Preserves the space's default Task Board. Requires space edit access.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 169,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "tasks"},
      examples: [%{"title" => "Create a Task Board", "arguments" => %{"space_id" => "space_123", "name" => "Design"}}],
      input_schema:
        JsonSchema.object(
          %{
            "space_id" => JsonSchema.string("Space identifier."),
            "name" => JsonSchema.string("Name of the Task Board.")
          },
          required: ["space_id", "name"]
        ),
      output_schema: JsonSchema.object(%{"board" => JsonSchema.any_object()}, required: ["board"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, space_id} <- Helpers.decode_id(arguments["space_id"]) do
      Endpoint.call(conn, %{space_id: space_id, name: arguments["name"]})
    end
  end
end
