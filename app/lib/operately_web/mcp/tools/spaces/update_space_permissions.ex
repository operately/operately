defmodule OperatelyWeb.Mcp.Tools.Spaces.UpdateSpacePermissions do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Spaces.UpdatePermissions, as: Api
  alias OperatelyWeb.Mcp.Helpers
  alias OperatelyWeb.Mcp.CollaborationInputs, as: Inputs

  @impl true
  def definition do
    Definition.new!(
      name: "update_space_permissions",
      title: "Update Space Permissions",
      description: "Replaces resource access levels. Requires full access. Supply every level; use no_access to remove access.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 210,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "spaces"},
      examples: [%{"title" => "Update space permissions", "arguments" => %{"space_id" => "space_123", "access_levels" => %{"public" => "no_access", "company" => "comment_access"}}}],
      input_schema:
        JsonSchema.object(
          %{
            "space_id" => JsonSchema.string("Space id."),
            "access_levels" => Inputs.levels_schema(false)
          },
          required: ["space_id", "access_levels"]
        ),
      output_schema: JsonSchema.object(%{"success" => JsonSchema.boolean("Operation result.")}, required: ["success"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, inputs} <- decode_inputs(arguments), do: Api.call(conn, inputs)
  end

  defp decode_inputs(arguments) do
    with {:ok, space_id} <- Helpers.decode_id(arguments["space_id"]),
         {:ok, access_levels} <- Inputs.levels(arguments["access_levels"], false) do
      {:ok, %{space_id: space_id, access_levels: access_levels}}
    end
  end
end
