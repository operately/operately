defmodule OperatelyWeb.Mcp.Tools.Projects.UpdateName do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.UpdateName, as: ProjectUpdateName
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_project_name",
      title: "Update Project Name",
      description: "Updates the name of one project.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 121,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [%{"title" => "Rename a project", "arguments" => %{"project_id" => "project_123", "name" => "New name"}}],
      input_schema:
        JsonSchema.object(
          %{
            "project_id" => JsonSchema.string("The project identifier."),
            "name" => JsonSchema.string("The new project name.")
          },
          required: ["project_id", "name"]
        ),
      output_schema:
        JsonSchema.object(
          %{"project" => JsonSchema.any_object("The updated project.")},
          required: ["project"]
        )
    )
  end

  @impl true
  def call(conn, %{"project_id" => project_id, "name" => name}) do
    with {:ok, project_id} <- Helpers.decode_id(project_id) do
      ProjectUpdateName.call(conn, %{project_id: project_id, name: name})
    end
  end
end
