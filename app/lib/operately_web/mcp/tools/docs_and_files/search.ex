defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.Search do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Wrappers.DocsAndFiles.Search, as: DocsAndFilesSearch
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "search_docs_and_files",
      title: "Search Docs & Files",
      description: "Searches one Docs & Files hub. Parent identifiers must match an explicit hub; space-only requests use the default hub.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 96,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "docs_and_files"},
      examples: [%{"title" => "Search project documents", "arguments" => %{"project_id" => "project_123", "query" => "launch plan"}}],
      input_schema:
        JsonSchema.object(
          %{
            "resource_hub_id" => JsonSchema.string("Explicit hub identifier. Without it or a folder, space_id selects the default resource hub."),
            "space_id" => JsonSchema.string("The space identifier."),
            "project_id" => JsonSchema.string("The project identifier."),
            "goal_id" => JsonSchema.string("The goal identifier."),
            "query" => JsonSchema.string("The search query.")
          },
          required: ["query"]
        ),
      output_schema: JsonSchema.object(
        %{
          "resource_hub_id" => JsonSchema.string("The resolved resource hub identifier."),
          "nodes" => JsonSchema.array(JsonSchema.any_object())
        },
        required: ["resource_hub_id", "nodes"]
      )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, inputs} <- Helpers.decode_hub_scope(arguments) do
      DocsAndFilesSearch.call(conn, Map.put(inputs, :query, arguments["query"]))
    end
  end
end
