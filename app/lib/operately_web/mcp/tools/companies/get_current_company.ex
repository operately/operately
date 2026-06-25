defmodule OperatelyWeb.Mcp.Tools.Companies.GetCurrentCompany do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Companies.Get, as: CompanyGet

  @impl true
  def definition do
    Definition.new!(
      name: "get_current_company",
      title: "Get Current Company",
      description: "Returns the company selected during MCP authorization.",
      company_mode: :authenticated,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 10,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "company"},
      examples: [%{"title" => "Show the connected company", "arguments" => %{}}],
      input_schema: JsonSchema.object(%{}),
      output_schema:
        JsonSchema.object(
          %{
            "company" => JsonSchema.any_object("The connected company.")
          },
          required: ["company"]
        )
    )
  end

  @impl true
  def call(conn, _arguments), do: CompanyGet.call(conn, %{})
end
