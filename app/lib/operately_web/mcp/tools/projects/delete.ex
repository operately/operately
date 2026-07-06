defmodule OperatelyWeb.Mcp.Tools.Projects.Delete do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.DeleteProject, as: ProjectDelete
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "delete_project",
      title: "Delete Project",
      description: "Permanently deletes one project and its associated data.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :destructive,
      sort_order: 220,
      annotations: destructive_annotations(),
      security_schemes: destructive_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [%{"title" => "Delete a project", "arguments" => %{"project_id" => "project_123"}}],
      input_schema:
        JsonSchema.object(
          %{"project_id" => JsonSchema.string("The project identifier.")},
          required: ["project_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"project" => JsonSchema.any_object("The deleted project.")},
          required: ["project"]
        )
    )
  end

  @impl true
  def call(conn, %{"project_id" => project_id}) do
    with {:ok, project_id} <- Helpers.decode_id(project_id) do
      ProjectDelete.call(conn, %{project_id: project_id})
    end
  end
end
