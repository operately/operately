defmodule OperatelyWeb.Mcp.Tools.Tasks.ArchiveBoard do
  use OperatelyWeb.Mcp.Tool
  alias OperatelyWeb.Api.Tasks.ArchiveBoard, as: Endpoint
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "archive_task_board",
      title: "Archive Task Board",
      description: "Archives a non-default task board without deleting its tasks. To archive the current default, first select another default with set_default_task_board.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 169,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "tasks"},
      examples: [%{"title" => "Archive a Task Board", "arguments" => %{"board_id" => "board_123", "space_id" => "space_123"}}],
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
