defmodule OperatelyWeb.Mcp.Tools.Spaces.Create do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Spaces.Create, as: SpaceCreate
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "create_space",
      title: "Create Space",
      description: "Creates a new space using the standard Operately space-access defaults.",
      company_mode: :authenticated,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 180,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "spaces"},
      examples: [%{"title" => "Create a space", "arguments" => %{"name" => "Marketing", "mission" => "Create product awareness"}}],
      input_schema:
        JsonSchema.object(
          %{
            "name" => JsonSchema.string("The space name."),
            "mission" => JsonSchema.string("The purpose or mission of the space.")
          },
          required: ["name", "mission"]
        ),
      output_schema:
        JsonSchema.object(
          %{"space" => JsonSchema.any_object("The created space.")},
          required: ["space"]
        )
    )
  end

  @impl true
  def call(conn, %{"name" => name, "mission" => mission}) do
    defaults = Helpers.default_space_create_permissions()

    SpaceCreate.call(conn, %{
      name: name,
      mission: mission,
      company_permissions: defaults.company,
      public_permissions: defaults.anonymous
    })
  end
end
