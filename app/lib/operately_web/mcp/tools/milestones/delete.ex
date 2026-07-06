defmodule OperatelyWeb.Mcp.Tools.Milestones.Delete do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.Milestones.Delete, as: MilestoneDelete
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "delete_milestone",
      title: "Delete Milestone",
      description: "Permanently deletes one project milestone.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :destructive,
      sort_order: 215,
      annotations: destructive_annotations(),
      security_schemes: destructive_security_schemes(),
      discovery_metadata: %{"category" => "milestones"},
      examples: [%{"title" => "Delete a milestone", "arguments" => %{"milestone_id" => "milestone_123"}}],
      input_schema:
        JsonSchema.object(
          %{"milestone_id" => JsonSchema.string("The milestone identifier.")},
          required: ["milestone_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"success" => JsonSchema.boolean("True when the milestone is deleted.")},
          required: ["success"]
        )
    )
  end

  @impl true
  def call(conn, %{"milestone_id" => milestone_id}) do
    with {:ok, milestone_id} <- Helpers.decode_id(milestone_id),
         {:ok, %{success: true}} <- MilestoneDelete.call(conn, %{milestone_id: milestone_id}) do
      {:ok, %{success: true}}
    end
  end
end
