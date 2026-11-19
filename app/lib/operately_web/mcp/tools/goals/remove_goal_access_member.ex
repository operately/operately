defmodule OperatelyWeb.Mcp.Tools.Goals.RemoveGoalAccessMember do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.DeleteAccessMember, as: Api
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "remove_goal_access_member",
      title: "Remove Goal Access Member",
      description: "Removes direct resource membership. Inherited access may remain. Requires full access.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :destructive,
      sort_order: 210,
      annotations: destructive_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [%{"title" => "Remove goal access member", "arguments" => %{"goal_id" => "goal_123", "person_id" => "person_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "goal_id" => JsonSchema.string("Goal id."),
            "person_id" => JsonSchema.string("Person id.")
          },
          required: ["goal_id", "person_id"]
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
         {:ok, person_id} <- Helpers.decode_id(arguments["person_id"]) do
      {:ok, %{goal_id: goal_id, person_id: person_id}}
    end
  end
end
