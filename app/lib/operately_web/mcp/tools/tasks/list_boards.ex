defmodule OperatelyWeb.Mcp.Tools.Tasks.ListBoards do
  use OperatelyWeb.Mcp.Tool
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "list_task_boards",
      title: "List Task Boards",
      description: "Lists task boards for exactly one project or space with owner IDs, names, order, archive state, and default designation. Use board_id to select a board explicitly.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 82,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "tasks"},
      examples: [
        %{"title" => "Discover space boards", "arguments" => %{"space_id" => "space_123"}},
        %{"title" => "Discover a project board", "arguments" => %{"project_id" => "project_123"}}
      ],
      input_schema: JsonSchema.object(%{
        "space_id" => JsonSchema.string("The space identifier; omit when project_id is supplied."),
        "project_id" => JsonSchema.string("The project identifier; omit when space_id is supplied."),
        "archive_status" => JsonSchema.string("Which boards to include; defaults to active.", enum: ["active", "archived", "all"])
      }),
      output_schema: JsonSchema.object(%{"boards" => JsonSchema.array(JsonSchema.any_object())}, required: ["boards"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, space_id} <- Helpers.decode_optional_id(arguments["space_id"]),
         {:ok, project_id} <- Helpers.decode_optional_id(arguments["project_id"]),
         {:ok, archive_status} <- archive_status(arguments["archive_status"]) do
      case OperatelyWeb.Api.Tasks.ListBoards.call(conn, %{space_id: space_id, project_id: project_id, archive_status: archive_status}) do
        {:error, :bad_request} -> {:error, :invalid_arguments}
        result -> result
      end
    end
  end

  defp archive_status(nil), do: {:ok, :active}
  defp archive_status("active"), do: {:ok, :active}
  defp archive_status("archived"), do: {:ok, :archived}
  defp archive_status("all"), do: {:ok, :all}
  defp archive_status(_), do: {:error, :invalid_arguments}
end
