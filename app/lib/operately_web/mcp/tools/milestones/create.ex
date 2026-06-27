defmodule OperatelyWeb.Mcp.Tools.Milestones.Create do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.CreateMilestone, as: MilestoneCreate
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "create_milestone",
      title: "Create Milestone",
      description: "Creates a new milestone for one project.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 170,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "milestones"},
      examples: [%{"title" => "Create a milestone", "arguments" => %{"project_id" => "project_123", "name" => "Launch beta", "due_date" => "2026-08-15"}}],
      input_schema:
        JsonSchema.object(
          %{
            "project_id" => JsonSchema.string("The project identifier."),
            "name" => JsonSchema.string("The milestone name."),
            "due_date" => JsonSchema.string("An optional ISO due date, for example 2026-08-15.")
          },
          required: ["project_id", "name"]
        ),
      output_schema:
        JsonSchema.object(
          %{"milestone" => JsonSchema.any_object("The created milestone.")},
          required: ["milestone"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, project_id} <- Helpers.decode_id(arguments["project_id"]),
         {:ok, due_date} <- Helpers.parse_day_date(arguments["due_date"]) do
      MilestoneCreate.call(conn, %{project_id: project_id, name: arguments["name"], due_date: due_date})
    end
  end
end
