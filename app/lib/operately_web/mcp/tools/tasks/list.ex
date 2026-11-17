defmodule OperatelyWeb.Mcp.Tools.Tasks.List do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Mcp.Helpers
  alias OperatelyWeb.Api.Tasks.List, as: TasksList

  @impl true
  def definition do
    Definition.new!(
      name: "list_tasks",
      title: "List Tasks",
      description: "Lists tasks for a project, space, or board. Optional owner and board selectors must match. Space-only requests include direct tasks across all its boards.",
      company_mode: :authenticated,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 70,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "tasks"},
      examples: [
        %{"title" => "List tasks for a project", "arguments" => %{"project_id" => "project_123"}},
        %{"title" => "List tasks for a space", "arguments" => %{"space_id" => "space_123"}},
        %{"title" => "List tasks for a board", "arguments" => %{"board_id" => "board_123"}}
      ],
      input_schema:
        JsonSchema.object(%{
          "board_id" => JsonSchema.string("Optional project or space board identifier. Can be supplied without an owner identifier."),
          "space_id" => JsonSchema.string("Optional space identifier used to filter tasks."),
          "project_id" => JsonSchema.string("Optional project identifier used to filter tasks.")
        }),
      output_schema:
        JsonSchema.object(
          %{
            "tasks" => JsonSchema.array(JsonSchema.any_object(), description: "The matching tasks.")
          },
          required: ["tasks"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, project_id} <- Helpers.decode_optional_id(arguments["project_id"]),
         {:ok, space_id} <- Helpers.decode_optional_id(arguments["space_id"]),
         {:ok, board_id} <- Helpers.decode_optional_id(arguments["board_id"]) do
      case TasksList.call(conn, %{project_id: project_id, space_id: space_id, board_id: board_id}) do
        {:error, :bad_request} -> {:error, :invalid_arguments}
        result -> result
      end
    end
  end
end
