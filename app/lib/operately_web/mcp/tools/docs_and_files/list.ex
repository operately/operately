defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.List do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Wrappers.DocsAndFiles.ListContents, as: DocsAndFilesList
  alias OperatelyWeb.Mcp.Helpers

  @scope_keys ~w(space_id project_id goal_id folder_id)

  @impl true
  def definition do
    Definition.new!(
      name: "list_docs_and_files",
      title: "List Docs and Files",
      description: "Lists documents, files, links, and folders for exactly one space, project, goal, or folder.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 92,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "docs_and_files"},
      examples: [
        %{"title" => "List docs and files for a project", "arguments" => %{"project_id" => "project_123"}},
        %{"title" => "List docs and files inside a folder", "arguments" => %{"folder_id" => "folder_123"}}
      ],
      input_schema:
        JsonSchema.object(%{
          "space_id" => JsonSchema.string("Optional space identifier."),
          "project_id" => JsonSchema.string("Optional project identifier."),
          "goal_id" => JsonSchema.string("Optional goal identifier."),
          "folder_id" => JsonSchema.string("Optional folder identifier.")
        }),
      output_schema:
        JsonSchema.object(
          %{
            "nodes" => JsonSchema.array(JsonSchema.any_object(), description: "Published docs-and-files nodes."),
            "draft_nodes" => JsonSchema.array(JsonSchema.any_object(), description: "Draft docs-and-files nodes.")
          },
          required: ["nodes", "draft_nodes"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with :ok <- validate_scope(arguments),
         {:ok, space_id} <- Helpers.decode_optional_id(arguments["space_id"]),
         {:ok, project_id} <- Helpers.decode_optional_id(arguments["project_id"]),
         {:ok, goal_id} <- Helpers.decode_optional_id(arguments["goal_id"]),
         {:ok, folder_id} <- Helpers.decode_optional_id(arguments["folder_id"]) do
      DocsAndFilesList.call(
        conn,
        %{}
        |> Helpers.put_optional(:space_id, space_id)
        |> Helpers.put_optional(:project_id, project_id)
        |> Helpers.put_optional(:goal_id, goal_id)
        |> Helpers.put_optional(:folder_id, folder_id)
      )
    end
  end

  defp validate_scope(arguments) do
    case Enum.count(@scope_keys, &Map.get(arguments, &1)) do
      1 -> :ok
      _ -> {:error, :invalid_arguments}
    end
  end
end
