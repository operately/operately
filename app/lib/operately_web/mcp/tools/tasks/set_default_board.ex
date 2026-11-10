defmodule OperatelyWeb.Mcp.Tools.Tasks.SetDefaultBoard do
  use OperatelyWeb.Mcp.Tool
  alias OperatelyWeb.Api.Tasks.SetDefaultBoard, as: Endpoint
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "set_default_task_board",
      title: "Set Default Task Board",
      description: "Select the active Task Board used by space requests without a board selector.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 169,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "tasks"},
      examples: [%{"title" => "Change the default Task Board", "arguments" => %{"board_id" => "board_123", "space_id" => "space_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "board_id" => JsonSchema.string("Task Board identifier."),
            "space_id" => JsonSchema.string("Space identifier. The board must belong to this space.")
          },
          required: ["space_id", "board_id"]
        ),
      output_schema: JsonSchema.object(%{"success" => JsonSchema.boolean("Whether the operation succeeded.")}, required: ["success"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, space_id} <- Helpers.decode_id(arguments["space_id"]),
         {:ok, board_id} <- Helpers.decode_id(arguments["board_id"]) do
      Endpoint.call(conn, %{board_id: board_id, space_id: space_id})
    end
  end
end
