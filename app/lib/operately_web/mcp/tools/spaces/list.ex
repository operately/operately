defmodule OperatelyWeb.Mcp.Tools.Spaces.List do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Spaces.List, as: SpacesList

  @impl true
  def definition do
    Definition.new!(
      name: "list_spaces",
      title: "List Spaces",
      description: "Lists spaces visible in the authenticated company.",
      company_mode: :authenticated,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 23,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "spaces"},
      examples: [%{"title" => "List spaces in the company", "arguments" => %{}}],
      input_schema: JsonSchema.object(%{}),
      output_schema:
        JsonSchema.object(
          %{
            "spaces" => JsonSchema.array(JsonSchema.any_object(), description: "The matching spaces.")
          },
          required: ["spaces"]
        )
    )
  end

  @impl true
  def call(conn, _arguments), do: SpacesList.call(conn, %{})
end
