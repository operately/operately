defmodule OperatelyWeb.Mcp.Tools.Goals.AddGoalAccessMembers do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.CreateAccessMembers, as: Api
  alias OperatelyWeb.Mcp.Helpers
  alias OperatelyWeb.Mcp.CollaborationInputs, as: Inputs

  @impl true
  def definition do
    Definition.new!(
      name: "add_goal_access_members",
      title: "Add Goal Access Members",
      description: "Adds company members or guests with explicit resource access. Requires full access.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 210,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [%{"title" => "Add goal access members", "arguments" => %{"goal_id" => "goal_123", "members" => [%{"id" => "person_123", "access_level" => "comment_access"}]}}],
      input_schema:
        JsonSchema.object(
          %{
            "goal_id" => JsonSchema.string("Goal id."),
            "members" => Inputs.members_schema()
          },
          required: ["goal_id", "members"]
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
         {:ok, members} <- Inputs.members(arguments["members"]) do
      {:ok, %{goal_id: goal_id, members: members}}
    end
  end
end
