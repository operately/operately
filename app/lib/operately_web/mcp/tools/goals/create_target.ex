defmodule OperatelyWeb.Mcp.Tools.Goals.CreateTarget do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.CreateTarget, as: GoalCreateTarget
  alias OperatelyWeb.Mcp.Helpers
  alias OperatelyWeb.Paths

  @impl true
  def definition do
    Definition.new!(
      name: "create_goal_target",
      title: "Create Goal Target",
      description: "Adds a numeric target to one goal.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 154,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [
        %{
          "title" => "Add a revenue target",
          "arguments" => %{
            "goal_id" => "goal_123",
            "name" => "Monthly revenue",
            "start_value" => 10,
            "target_value" => 50,
            "unit" => "USD"
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "goal_id" => JsonSchema.string("The goal identifier."),
            "name" => JsonSchema.string("The target name. Maximum 255 characters.") |> Map.put("maxLength", 255),
            "start_value" => JsonSchema.number("The starting value of the target."),
            "target_value" => JsonSchema.number("The value the target is aiming for."),
            "unit" => JsonSchema.string("The unit for the target values, for example USD or percent. Maximum 255 characters.") |> Map.put("maxLength", 255)
          },
          required: ["goal_id", "name", "start_value", "target_value", "unit"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "success" => JsonSchema.boolean("True when the target is created."),
            "target_id" => JsonSchema.string("The created target identifier.")
          },
          required: ["success", "target_id"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, goal_id} <- Helpers.decode_id(arguments["goal_id"]),
         {:ok, %{success: true, target_id: target_id}} <-
           GoalCreateTarget.call(conn, %{
             goal_id: goal_id,
             name: arguments["name"],
             start_value: arguments["start_value"],
             target_value: arguments["target_value"],
             unit: arguments["unit"]
           }) do
      {:ok, %{success: true, target_id: Paths.target_id(target_id)}}
    end
  end
end
