defmodule OperatelyWeb.Mcp.Tools.Projects.ListDiscussions do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.Discussions.List, as: ProjectDiscussionsList
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "list_project_discussions",
      title: "List Project Discussions",
      description: "Lists discussions for one project.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 47,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [%{"title" => "List discussions for a project", "arguments" => %{"project_id" => "project_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "project_id" => JsonSchema.string("The project identifier.")
          },
          required: ["project_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "discussions" => JsonSchema.array(JsonSchema.any_object(), description: "The project discussions.")
          },
          required: ["discussions"]
        )
    )
  end

  @impl true
  def call(conn, %{"project_id" => project_id}) do
    with {:ok, project_id} <- Helpers.decode_id(project_id) do
      ProjectDiscussionsList.call(conn, %{project_id: project_id})
    end
  end
end
