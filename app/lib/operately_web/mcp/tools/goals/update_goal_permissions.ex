defmodule OperatelyWeb.Mcp.Tools.Goals.UpdateGoalPermissions do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.UpdateAccessLevels, as: Api
  alias OperatelyWeb.Mcp.Helpers
  alias OperatelyWeb.Mcp.CollaborationInputs, as: Inputs

  @impl true
  def definition do
    Definition.new!(
      name: "update_goal_permissions",
      title: "Update Goal Permissions",
      description: "Updates company and space access to a goal. Requires full access. Supply both levels; use no_access to remove access. Public access is not supported.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 210,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [
        %{"title" => "Update goal permissions", "arguments" => %{"goal_id" => "goal_123", "access_levels" => %{"company" => "comment_access", "space" => "edit_access"}}}
      ],
      input_schema:
        JsonSchema.object(
          %{
            "goal_id" => JsonSchema.string("Goal id."),
            "access_levels" => JsonSchema.object(%{"company" => Inputs.level_schema(), "space" => Inputs.level_schema()}, required: ["company", "space"])
          },
          required: ["goal_id", "access_levels"]
        ),
      output_schema: JsonSchema.object(%{"success" => JsonSchema.boolean("Operation result.")}, required: ["success"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, inputs} <- decode_inputs(arguments), do: Api.call(conn, inputs)
  end

  defp decode_inputs(arguments) do
    with {:ok, goal_id} <- Helpers.decode_id(arguments["goal_id"]),
         {:ok, access_levels} <- decode_access_levels(arguments["access_levels"]) do
      {:ok, %{goal_id: goal_id, access_levels: access_levels}}
    end
  end

  defp decode_access_levels(%{"company" => company, "space" => space} = levels) when map_size(levels) == 2 do
    with {:ok, company} <- Inputs.level(company),
         {:ok, space} <- Inputs.level(space) do
      {:ok, %{company: company, space: space}}
    end
  end

  defp decode_access_levels(_), do: {:error, :invalid_arguments}
end
