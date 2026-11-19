defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.List do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Wrappers.DocsAndFiles.ListContents, as: DocsAndFilesList
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "list_docs_and_files",
      title: "List Docs and Files",
      description: "Lists documents, files, links, and folders in a hub or folder. Parent identifiers must match the selected hub; space-only requests use the default hub.",
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
          "resource_hub_id" => JsonSchema.string("Explicit hub identifier. Without it or a folder, space_id selects the default resource hub."),
          "space_id" => JsonSchema.string("Optional space identifier."),
          "project_id" => JsonSchema.string("Optional project identifier."),
          "goal_id" => JsonSchema.string("Optional goal identifier."),
          "folder_id" => JsonSchema.string("Optional folder identifier.")
        }),
      output_schema:
        JsonSchema.object(
          %{
            "resource_hub_id" => JsonSchema.string("The resolved resource hub identifier."),
            "nodes" => JsonSchema.array(JsonSchema.any_object(), description: "Published docs-and-files nodes."),
            "draft_nodes" => JsonSchema.array(JsonSchema.any_object(), description: "Draft docs-and-files nodes.")
          },
          required: ["resource_hub_id", "nodes", "draft_nodes"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, inputs} <- Helpers.decode_hub_scope(arguments) do
      DocsAndFilesList.call(conn, inputs)
    end
  end
end
