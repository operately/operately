defmodule OperatelyWeb.Mcp.Tools.Milestones.Reopen do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.CreateMilestoneComment, as: MilestoneCommentCreate
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "reopen_milestone",
      title: "Reopen Milestone",
      description: "Reopens one milestone.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 175,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "milestones"},
      examples: [%{"title" => "Reopen a milestone", "arguments" => %{"milestone_id" => "milestone_123"}}],
      input_schema:
        JsonSchema.object(
          %{"milestone_id" => JsonSchema.string("The milestone identifier.")},
          required: ["milestone_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"comment" => JsonSchema.any_object("The milestone comment created for the action.")},
          required: ["comment"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, milestone_id} <- Helpers.decode_id(arguments["milestone_id"]) do
      MilestoneCommentCreate.call(conn, %{milestone_id: milestone_id, action: "reopen", content: nil})
    end
  end
end
