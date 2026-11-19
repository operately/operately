defmodule OperatelyWeb.Mcp.Tools.Goals.ListGoalAccessMembers do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.ListAccessMembers, as: Api
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "list_goal_access_members",
      title: "List Goal Access Members",
      description: "Lists people with direct goal access and their access levels. Requires full goal access.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 60,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [%{"title" => "List goal access members", "arguments" => %{"goal_id" => "goal_123"}}],
      input_schema: JsonSchema.object(%{"goal_id" => JsonSchema.string("The goal identifier.")}, required: ["goal_id"]),
      output_schema: JsonSchema.object(%{"people" => JsonSchema.array(JsonSchema.any_object())}, required: ["people"])
    )
  end

  @impl true
  def call(conn, %{"goal_id" => goal_id}) do
    with {:ok, goal_id} <- Helpers.decode_id(goal_id) do
      Api.call(conn, %{goal_id: goal_id})
    end
  end
end
