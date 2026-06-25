defmodule OperatelyWeb.Mcp.Tools.People.List do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.People.List, as: PeopleList

  @impl true
  def definition do
    Definition.new!(
      name: "list_people",
      title: "List People",
      description: "Lists people in the authenticated company.",
      company_mode: :authenticated,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 21,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "people"},
      examples: [%{"title" => "List people in the company", "arguments" => %{}}],
      input_schema: JsonSchema.object(%{}),
      output_schema:
        JsonSchema.object(
          %{
            "people" => JsonSchema.array(JsonSchema.any_object(), description: "The matching people.")
          },
          required: ["people"]
        )
    )
  end

  @impl true
  def call(conn, _arguments), do: PeopleList.call(conn, %{})
end
