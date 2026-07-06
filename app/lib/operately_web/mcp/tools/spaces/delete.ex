defmodule OperatelyWeb.Mcp.Tools.Spaces.Delete do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Spaces.Delete, as: SpaceDelete
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "delete_space",
      title: "Delete Space",
      description: "Permanently deletes one space.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :destructive,
      sort_order: 222,
      annotations: destructive_annotations(),
      security_schemes: destructive_security_schemes(),
      discovery_metadata: %{"category" => "spaces"},
      examples: [%{"title" => "Delete a space", "arguments" => %{"space_id" => "space_123"}}],
      input_schema:
        JsonSchema.object(
          %{"space_id" => JsonSchema.string("The space identifier.")},
          required: ["space_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"space" => JsonSchema.any_object("The deleted space.")},
          required: ["space"]
        )
    )
  end

  @impl true
  def call(conn, %{"space_id" => space_id}) do
    with {:ok, space_id} <- Helpers.decode_id(space_id) do
      SpaceDelete.call(conn, %{space_id: space_id})
    end
  end
end
