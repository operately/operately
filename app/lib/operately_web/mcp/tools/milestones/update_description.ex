defmodule OperatelyWeb.Mcp.Tools.Milestones.UpdateDescription do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.Milestones.UpdateDescription, as: MilestoneUpdateDescription
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_milestone_description",
      title: "Update Milestone Description",
      description: "Updates the markdown description of one milestone.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 172,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "milestones"},
      examples: [%{"title" => "Change a milestone description", "arguments" => %{"milestone_id" => "milestone_123", "description" => "Updated milestone description"}}],
      input_schema:
        JsonSchema.object(
          %{
            "milestone_id" => JsonSchema.string("The milestone identifier."),
            "description" => JsonSchema.string("The new plain text or markdown description. Use an empty string to clear it.")
          },
          required: ["milestone_id", "description"]
        ),
      output_schema:
        JsonSchema.object(
          %{"milestone" => JsonSchema.any_object("The updated milestone.")},
          required: ["milestone"]
        )
    )
  end

  @impl true
  def call(conn, %{"milestone_id" => milestone_id, "description" => description}) do
    with {:ok, milestone_id} <- Helpers.decode_id(milestone_id),
         {:ok, description} <- Helpers.markdown_to_rich_text_allow_blank(description) do
      MilestoneUpdateDescription.call(conn, %{milestone_id: milestone_id, description: description})
    end
  end
end
