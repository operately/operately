defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.Search do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ResourceHubs.Search, as: ResourceHubSearch
  alias OperatelyWeb.Api.Wrappers.DocsAndFiles.HubScope
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "search_docs_and_files",
      title: "Search Docs & Files",
      description: "Searches one space, project, or goal Docs & Files hub. Provide exactly one scope identifier.",
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
            "space_id" => JsonSchema.string("The space identifier."),
            "project_id" => JsonSchema.string("The project identifier."),
            "goal_id" => JsonSchema.string("The goal identifier."),
            "query" => JsonSchema.string("The search query.")
          },
          required: ["query"]
        ),
      output_schema: JsonSchema.object(%{"nodes" => JsonSchema.array(JsonSchema.any_object())}, required: ["nodes"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, scope_inputs} <- Helpers.decode_hub_scope(arguments),
         {:ok, resource_hub_id} <- HubScope.resolve_hub_id(conn.assigns.current_person, scope_inputs) do
      ResourceHubSearch.call(conn, %{resource_hub_id: resource_hub_id, query: arguments["query"]})
    else
      {:error, :bad_request} -> {:error, :invalid_arguments}
      error -> error
    end
  end
end
