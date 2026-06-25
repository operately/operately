defmodule OperatelyWeb.Mcp.Tools.Spaces.Get do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Spaces.Get, as: SpaceGet
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "get_space",
      title: "Get Space",
      description: "Returns one space by identifier.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 24,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "spaces"},
      examples: [%{"title" => "Open a space by ID", "arguments" => %{"space_id" => "space_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "space_id" => JsonSchema.string("The space identifier.")
          },
          required: ["space_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "space" => JsonSchema.any_object("The matching space.")
          },
          required: ["space"]
        )
    )
  end

  @impl true
  def call(conn, %{"space_id" => space_id}) do
    with {:ok, space_id} <- Helpers.decode_id(space_id) do
      SpaceGet.call(conn, %{id: space_id})
    end
  end
end
