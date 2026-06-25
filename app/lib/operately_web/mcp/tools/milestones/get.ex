defmodule OperatelyWeb.Mcp.Tools.Milestones.Get do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.GetMilestone, as: MilestoneGet
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "get_milestone",
      title: "Get Milestone",
      description: "Returns one milestone by identifier.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 45,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "milestones"},
      examples: [%{"title" => "Open a milestone by ID", "arguments" => %{"milestone_id" => "milestone_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "milestone_id" => JsonSchema.string("The milestone identifier.")
          },
          required: ["milestone_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "milestone" => JsonSchema.any_object("The matching milestone.")
          },
          required: ["milestone"]
        )
    )
  end

  @impl true
  def call(conn, %{"milestone_id" => milestone_id}) do
    with {:ok, milestone_id} <- Helpers.decode_id(milestone_id) do
      MilestoneGet.call(conn, %{id: milestone_id, include_comments: true})
    end
  end
end
