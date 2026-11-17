defmodule OperatelyWeb.Mcp.Tools.Tasks.RenameBoard do
  use OperatelyWeb.Mcp.Tool
  alias OperatelyWeb.Api.Tasks.RenameBoard, as: Endpoint
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "rename_task_board",
      title: "Rename Task Board",
      description: "Rename a space-owned Task Board. Requires space edit access.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 169,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "tasks"},
      examples: [%{"title" => "Rename a Task Board", "arguments" => %{"board_id" => "board_123", "new_name" => "Design"}}],
      input_schema:
        JsonSchema.object(
          %{
            "board_id" => JsonSchema.string("Task Board identifier."),
            "new_name" => JsonSchema.string("New name of the Task Board.")
          },
          required: ["board_id", "new_name"]
        ),
      output_schema: JsonSchema.object(%{"success" => JsonSchema.boolean("Whether the operation succeeded.")}, required: ["success"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, board_id} <- Helpers.decode_id(arguments["board_id"]) do
      Endpoint.call(conn, %{board_id: board_id, new_name: arguments["new_name"]})
    end
  end
end
