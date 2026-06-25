defmodule OperatelyWeb.Mcp.Tools.Goals.CreateCheckIn do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.CreateCheckIn, as: GoalCreateCheckIn
  alias Operately.RichContent.FromMarkdown
  alias OperatelyWeb.Mcp.Helpers

  @valid_statuses ["on_track", "caution", "off_track"]

  @impl true
  def definition do
    Definition.new!(
      name: "create_goal_check_in",
      title: "Create Goal Check-In",
      description: "Creates a new goal check-in for one goal.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 112,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [%{"title" => "Create a goal check-in", "arguments" => %{"goal_id" => "growth-goal--abc123", "status" => "caution", "content" => "We are blocked on external dependencies."}}],
      input_schema:
        JsonSchema.object(
          %{
            "goal_id" => JsonSchema.string("The goal identifier."),
            "status" => JsonSchema.string("The goal status for this check-in.", enum: @valid_statuses),
            "content" => JsonSchema.string("Plain text or simple markdown content for the check-in.")
          },
          required: ["goal_id", "status", "content"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "check_in" => JsonSchema.any_object("The created goal check-in.")
          },
          required: ["check_in"]
        )
    )
  end

  @impl true
  def call(conn, %{"goal_id" => goal_id, "status" => status, "content" => content}) do
    with {:ok, goal_id} <- Helpers.decode_id(goal_id),
         {:ok, rich_content} <- FromMarkdown.to_rich_text(content),
         {:ok, %{update: check_in}} <-
           GoalCreateCheckIn.call(conn, %{
             goal_id: goal_id,
             status: status,
             content: rich_content,
             subscriber_ids: []
           }) do
      {:ok, %{check_in: check_in}}
    end
  end
end
