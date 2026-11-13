defmodule OperatelyWeb.Mcp.Tools.Tasks.Move do
  use OperatelyWeb.Mcp.Tool
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "move_task",
      title: "Move Task",
      description: "Moves a task to a project or space. For projects, supply the project ID; its sole board is resolved automatically. For spaces, omit destination_board_id to use the default board or supply it to select another board. If explicit board statuses differ, supply destination_status_id from list_task_statuses.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 169,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "tasks"},
      examples: [
        %{"title" => "Move to a project", "arguments" => %{"task_id" => "task_123", "destination_type" => "project", "destination_id" => "project_123"}},
        %{"title" => "Move to another space board", "arguments" => %{"task_id" => "task_123", "destination_type" => "space", "destination_id" => "space_123", "destination_board_id" => "board_123"}}
      ],
      input_schema: JsonSchema.object(%{
        "task_id" => JsonSchema.string("The task identifier."),
        "destination_type" => JsonSchema.string("Destination parent type.", enum: ["space", "project"]),
        "destination_id" => JsonSchema.string("The destination space or project identifier."),
        "destination_board_id" => JsonSchema.string("Optional destination space board. Only valid when destination_type is space; omit for projects."),
        "destination_status_id" => JsonSchema.string("Optional status ID from the destination's statuses.")
      }, required: ["task_id", "destination_type", "destination_id"]),
      output_schema: JsonSchema.object(%{
        "task" => JsonSchema.any_object(),
        "destination_type" => JsonSchema.string("Destination parent type."),
        "destination_id" => JsonSchema.string("Destination parent identifier."),
        "board_id" => JsonSchema.nullable(JsonSchema.string("Resolved destination board identifier."))
      }, required: ["task", "destination_type", "destination_id", "board_id"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, task_id} <- Helpers.decode_id(arguments["task_id"]),
         {:ok, destination_id} <- Helpers.decode_id(arguments["destination_id"]),
         {:ok, board_id} <- Helpers.decode_optional_id(arguments["destination_board_id"]),
         {:ok, type} <- destination_type(arguments["destination_type"]) do
      OperatelyWeb.Api.Tasks.Move.call(conn, %{
        task_id: task_id, destination_type: type, destination_id: destination_id,
        destination_board_id: board_id, destination_status_id: arguments["destination_status_id"]
      })
    end
  end

  defp destination_type("space"), do: {:ok, :space}
  defp destination_type("project"), do: {:ok, :project}
  defp destination_type(_), do: {:error, :invalid_arguments}
end
