defmodule OperatelyWeb.Mcp.Tools.Tasks.GetBoard do
  use OperatelyWeb.Mcp.Tool
  alias OperatelyWeb.Api.Tasks.GetBoard, as: Endpoint
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "get_task_board",
      title: "Get Task Board",
      description: "Returns a task board's name, archive state, statuses, and kanban ordering. Supply board_id, or project_id alone for a project's sole board. Archived boards remain readable.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 82,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "tasks"},
      examples: [
        %{"title" => "Inspect a space board", "arguments" => %{"space_id" => "space_123", "board_id" => "board_123"}},
        %{"title" => "Inspect a project board", "arguments" => %{"project_id" => "project_123"}}
      ],
      input_schema: JsonSchema.object(%{
        "space_id" => JsonSchema.string("Optional direct space owner identifier."),
        "project_id" => JsonSchema.string("Optional project owner identifier."),
        "board_id" => JsonSchema.string("The task board identifier. May be omitted when project_id is supplied.")
      }),
      output_schema: JsonSchema.object(%{"board" => JsonSchema.any_object("The matching task board.")}, required: ["board"])
    )
  end

  @impl true
  def call(conn, arguments) when is_map(arguments) do
    with true <- is_binary(arguments["board_id"]) or is_binary(arguments["project_id"]),
         {:ok, board_id} <- Helpers.decode_optional_id(arguments["board_id"]),
         {:ok, space_id} <- Helpers.decode_optional_id(arguments["space_id"]),
         {:ok, project_id} <- Helpers.decode_optional_id(arguments["project_id"]) do
      Endpoint.call(conn, %{space_id: space_id, project_id: project_id, board_id: board_id})
    else
      false -> {:error, :invalid_arguments}
      error -> error
    end
  end

  def call(_conn, _arguments), do: {:error, :invalid_arguments}
end
