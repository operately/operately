defmodule OperatelyWeb.Mcp.Tools.Spaces.UpdateSpaceMembersPermissions do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Spaces.UpdateMembersPermissions, as: Api
  alias OperatelyWeb.Mcp.Helpers
  alias OperatelyWeb.Mcp.CollaborationInputs, as: Inputs

  @impl true
  def definition do
    Definition.new!(
      name: "update_space_members_permissions",
      title: "Update Space Members Permissions",
      description: "Updates direct space-member access levels. Requires full access.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 210,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "spaces"},
      examples: [%{"title" => "Update space members permissions", "arguments" => %{"space_id" => "space_123", "members" => [%{"id" => "person_123", "access_level" => "comment_access"}]}}],
      input_schema:
        JsonSchema.object(
          %{
            "space_id" => JsonSchema.string("Space id."),
            "members" => Inputs.members_schema()
          },
          required: ["space_id", "members"]
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
         {:ok, members} <- Inputs.members(arguments["members"]) do
      {:ok, %{space_id: space_id, members: members}}
    end
  end
end
