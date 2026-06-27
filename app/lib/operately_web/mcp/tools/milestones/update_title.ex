defmodule OperatelyWeb.Mcp.Tools.Milestones.UpdateTitle do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.Milestones.UpdateTitle, as: MilestoneUpdateTitle
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_milestone_title",
      title: "Update Milestone Title",
      description: "Updates the title of one milestone.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 171,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "milestones"},
      examples: [%{"title" => "Rename a milestone", "arguments" => %{"milestone_id" => "milestone_123", "title" => "Updated milestone"}}],
      input_schema:
        JsonSchema.object(
          %{
            "milestone_id" => JsonSchema.string("The milestone identifier."),
            "title" => JsonSchema.string("The new milestone title.")
          },
          required: ["milestone_id", "title"]
        ),
      output_schema:
        JsonSchema.object(
          %{"milestone" => JsonSchema.any_object("The updated milestone.")},
          required: ["milestone"]
        )
    )
  end

  @impl true
  def call(conn, %{"milestone_id" => milestone_id, "title" => title}) do
    with {:ok, milestone_id} <- Helpers.decode_id(milestone_id) do
      MilestoneUpdateTitle.call(conn, %{milestone_id: milestone_id, title: title})
    end
  end
end
