defmodule OperatelyWeb.Mcp.Tools.People.Get do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.People.Get, as: PersonGet
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "get_person",
      title: "Get Person",
      description: "Returns one person by identifier.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 22,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "people"},
      examples: [%{"title" => "Open a person by ID", "arguments" => %{"person_id" => "person_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "person_id" => JsonSchema.string("The person identifier.")
          },
          required: ["person_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "person" => JsonSchema.any_object("The matching person.")
          },
          required: ["person"]
        )
    )
  end

  @impl true
  def call(conn, %{"person_id" => person_id}) do
    with {:ok, person_id} <- Helpers.decode_id(person_id) do
      PersonGet.call(conn, %{id: person_id})
    end
  end
end
