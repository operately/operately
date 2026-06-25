defmodule OperatelyWeb.Mcp.Tools.People.GetMe do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.People.GetMe, as: PeopleGetMe

  @impl true
  def definition do
    Definition.new!(
      name: "get_me",
      title: "Get My Profile",
      description: "Returns the authenticated member profile for the selected company.",
      company_mode: :authenticated,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 20,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "people"},
      examples: [%{"title" => "Show my Operately profile", "arguments" => %{}}],
      input_schema: JsonSchema.object(%{}),
      output_schema:
        JsonSchema.object(
          %{
            "me" => JsonSchema.any_object("The authenticated member profile.")
          },
          required: ["me"]
        )
    )
  end

  @impl true
  def call(conn, _arguments), do: PeopleGetMe.call(conn, %{})
end
