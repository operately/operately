defmodule OperatelyWeb.Mcp.Tools.Milestones.List do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.ListMilestones, as: Api
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "list_project_milestones",
      title: "List Project Milestones",
      description: "Lists milestones in a project, including their identifiers and task ordering.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 42,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "milestones"},
      examples: [%{"title" => "List project milestones", "arguments" => %{"project_id" => "project_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "project_id" => JsonSchema.string("The project id.")
          },
          required: ["project_id"]
        ),
      output_schema: JsonSchema.object(%{"milestones" => JsonSchema.array(JsonSchema.any_object())}, required: ["milestones"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, project_id} <- Helpers.decode_id(arguments["project_id"]) do
      Api.call(conn, %{project_id: project_id})
    end
  end
end
