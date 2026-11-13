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
      examples: [
        %{"title" => "Inspect a space board", "arguments" => %{"space_id" => "space_123", "board_id" => "board_123"}},
        %{"title" => "Inspect a project board", "arguments" => %{"project_id" => "project_123", "board_id" => "board_123"}}
      ],
      input_schema: JsonSchema.object(%{
        "space_id" => JsonSchema.string("Optional direct space owner identifier."),
        "project_id" => JsonSchema.string("Optional project owner identifier."),
        "board_id" => JsonSchema.string("The task board identifier.")
      }, required: ["board_id"]),
      output_schema: JsonSchema.object(%{"board" => JsonSchema.any_object("The matching task board.")}, required: ["board"])
    )
  end

  @impl true
  def call(conn, %{"board_id" => board_id} = arguments) when is_binary(board_id) do
    with {:ok, board_id} <- Helpers.decode_id(arguments["board_id"]),
         {:ok, space_id} <- Helpers.decode_optional_id(arguments["space_id"]),
         {:ok, project_id} <- Helpers.decode_optional_id(arguments["project_id"]) do
      Endpoint.call(conn, %{space_id: space_id, project_id: project_id, board_id: board_id})
    end
  end

  def call(_conn, _arguments), do: {:error, :invalid_arguments}
end
