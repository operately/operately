defmodule OperatelyWeb.Mcp.Tools.Projects.Resume do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.Resume, as: ProjectResume
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "resume_project",
      title: "Resume Project",
      description: "Resumes one paused project and posts a resume message.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 130,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [%{"title" => "Resume a project", "arguments" => %{"project_id" => "project_123", "message" => "We can continue now."}}],
      input_schema:
        JsonSchema.object(
          %{
            "project_id" => JsonSchema.string("The project identifier."),
            "message" => JsonSchema.string("The resume message in plain text or markdown.")
          },
          required: ["project_id", "message"]
        ),
      output_schema:
        JsonSchema.object(
          %{"project" => JsonSchema.any_object("The resumed project.")},
          required: ["project"]
        )
    )
  end

  @impl true
  def call(conn, %{"project_id" => project_id, "message" => message}) do
    with {:ok, project_id} <- Helpers.decode_id(project_id),
         {:ok, message} <- Helpers.markdown_to_rich_text(message) do
      ProjectResume.call(conn, %{project_id: project_id, message: message, subscriber_ids: []})
    end
  end
end
