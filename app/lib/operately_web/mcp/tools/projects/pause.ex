defmodule OperatelyWeb.Mcp.Tools.Projects.Pause do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.Pause, as: ProjectPause
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "pause_project",
      title: "Pause Project",
      description: "Pauses one project.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 129,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [%{"title" => "Pause a project", "arguments" => %{"project_id" => "project_123"}}],
      input_schema:
        JsonSchema.object(
          %{"project_id" => JsonSchema.string("The project identifier.")},
          required: ["project_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"project" => JsonSchema.any_object("The paused project.")},
          required: ["project"]
        )
    )
  end

  @impl true
  def call(conn, %{"project_id" => project_id}) do
    with {:ok, project_id} <- Helpers.decode_id(project_id) do
      ProjectPause.call(conn, %{project_id: project_id})
    end
  end
end
