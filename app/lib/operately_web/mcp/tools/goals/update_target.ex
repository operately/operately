defmodule OperatelyWeb.Mcp.Tools.Goals.UpdateTarget do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.UpdateTarget, as: GoalUpdateTarget
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_goal_target",
      title: "Update Goal Target",
      description: "Updates the name, bounds, or unit of one goal target. Omitted fields stay unchanged.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 155,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [
        %{
          "title" => "Rename a target and change its unit",
          "arguments" => %{
            "goal_id" => "goal_123",
            "target_id" => "target_123",
            "name" => "Monthly revenue",
            "unit" => "USD"
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "goal_id" => JsonSchema.string("The goal identifier."),
            "target_id" => JsonSchema.string("The target identifier."),
            "name" => JsonSchema.string("The new target name. Omit it to leave the name unchanged."),
            "start_value" => JsonSchema.number("The new starting value. Omit it to leave the starting value unchanged."),
            "target_value" => JsonSchema.number("The new target value. Omit it to leave the target value unchanged."),
            "unit" => JsonSchema.string("The new unit. Omit it to leave the unit unchanged.")
          },
          required: ["goal_id", "target_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"success" => JsonSchema.boolean("True when the update succeeds.")},
          required: ["success"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, goal_id} <- Helpers.decode_id(arguments["goal_id"]),
         {:ok, target_id} <- Helpers.decode_id(arguments["target_id"]) do
      inputs =
        %{goal_id: goal_id, target_id: target_id}
        |> Helpers.put_optional(:name, arguments["name"])
        |> Helpers.put_optional(:start_value, arguments["start_value"])
        |> Helpers.put_optional(:target_value, arguments["target_value"])
        |> Helpers.put_optional(:unit, arguments["unit"])

      GoalUpdateTarget.call(conn, inputs)
    end
  end
end
