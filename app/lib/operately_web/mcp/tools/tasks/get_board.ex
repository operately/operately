defmodule OperatelyWeb.Mcp.Tools.Tasks.GetBoard do
  use OperatelyWeb.Mcp.Tool
  alias OperatelyWeb.Api.Tasks.GetBoard, as: Endpoint
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "get_task_board",
      title: "Get Task Board",
      description: "Returns a task board's name, archive state, statuses, and kanban ordering. Archived boards remain readable. Use list_task_boards to discover board IDs.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 82,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "tasks"},
      examples: [%{"title" => "Inspect a task board", "arguments" => %{"space_id" => "space_123", "board_id" => "board_123"}}],
      input_schema: JsonSchema.object(%{
        "space_id" => JsonSchema.string("The space identifier."),
        "board_id" => JsonSchema.string("The task board identifier within that space.")
      }, required: ["space_id", "board_id"]),
      output_schema: JsonSchema.object(%{"board" => JsonSchema.any_object("The matching task board.")}, required: ["board"])
    )
  end

  @impl true
  def call(conn, %{"space_id" => space_id, "board_id" => board_id}) when is_binary(space_id) and is_binary(board_id) do
    with {:ok, space_id} <- Helpers.decode_id(space_id),
         {:ok, board_id} <- Helpers.decode_id(board_id) do
      Endpoint.call(conn, %{space_id: space_id, board_id: board_id})
    end
  end

  def call(_conn, _arguments), do: {:error, :invalid_arguments}
end
