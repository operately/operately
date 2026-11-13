defmodule OperatelyWeb.Mcp.Tools.Goals.UpdateGoalAccessMember do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.UpdateAccessMember, as: Api
  alias OperatelyWeb.Mcp.Helpers
  alias OperatelyWeb.Mcp.CollaborationInputs, as: Inputs

  @impl true
  def definition do
    Definition.new!(
      name: "update_goal_access_member",
      title: "Update Goal Access Member",
      description: "Updates a goal member access level. Requires full access.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 210,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [%{"title" => "Update goal access member", "arguments" => %{"goal_id" => "goal_123", "person_id" => "person_123", "access_level" => "comment_access"}}],
      input_schema:
        JsonSchema.object(
          %{
            "goal_id" => JsonSchema.string("Goal id."),
            "person_id" => JsonSchema.string("Person id."),
            "access_level" => Inputs.level_schema()
          },
          required: ["goal_id", "person_id", "access_level"]
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
         {:ok, person_id} <- Helpers.decode_id(arguments["person_id"]),
         {:ok, access_level} <- Inputs.level(arguments["access_level"]) do
      {:ok, %{goal_id: goal_id, person_id: person_id, access_level: access_level}}
    end
  end
end
