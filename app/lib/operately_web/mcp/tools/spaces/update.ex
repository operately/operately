defmodule OperatelyWeb.Mcp.Tools.Spaces.Update do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Spaces.Update, as: SpaceUpdate
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_space",
      title: "Update Space",
      description: "Updates the name and mission of one space.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 181,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "spaces"},
      examples: [%{"title" => "Update a space", "arguments" => %{"space_id" => "space_123", "name" => "Marketing", "mission" => "Own demand generation"}}],
      input_schema:
        JsonSchema.object(
          %{
            "space_id" => JsonSchema.string("The space identifier."),
            "name" => JsonSchema.string("The new space name."),
            "mission" => JsonSchema.string("The new space mission.")
          },
          required: ["space_id", "name", "mission"]
        ),
      output_schema:
        JsonSchema.object(
          %{"space" => JsonSchema.any_object("The updated space.")},
          required: ["space"]
        )
    )
  end

  @impl true
  def call(conn, %{"space_id" => space_id, "name" => name, "mission" => mission}) do
    with {:ok, space_id} <- Helpers.decode_id(space_id) do
      SpaceUpdate.call(conn, %{id: space_id, name: name, mission: mission})
    end
  end
end
