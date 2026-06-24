defmodule OperatelyWeb.Mcp.Tools.Fetch do
  use OperatelyWeb.Mcp.Tool

  @impl true
  def definition do
    Definition.new!(
      name: "fetch",
      title: "Fetch Operately Resource",
      description: "Fetches a canonical Operately resource from its URL for citation-friendly reading.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 100,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "fetch"},
      examples: [%{"title" => "Fetch a project page URL", "arguments" => %{"url" => "https://app.operately.com/acme/projects/project_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "url" => JsonSchema.string("The canonical Operately URL to fetch.", format: "uri")
          },
          required: ["url"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "url" => JsonSchema.string("The canonical Operately URL.", format: "uri"),
            "resource" => JsonSchema.any_object("Structured resource data when available."),
            "content" => JsonSchema.array(JsonSchema.any_object(), description: "Citation-friendly content blocks.")
          },
          required: ["url"]
        )
    )
  end

  @impl true
  def call(_context, _arguments), do: not_implemented()
end
