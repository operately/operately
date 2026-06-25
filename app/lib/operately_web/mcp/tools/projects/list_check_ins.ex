defmodule OperatelyWeb.Mcp.Tools.Projects.ListCheckIns do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.ListCheckIns, as: ProjectCheckInsList
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "list_project_check_ins",
      title: "List Project Check-Ins",
      description: "Lists check-ins for one project.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 49,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [%{"title" => "List check-ins for a project", "arguments" => %{"project_id" => "project_123"}}],
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
            "check_ins" => JsonSchema.array(JsonSchema.any_object(), description: "The project check-ins.")
          },
          required: ["check_ins"]
        )
    )
  end

  @impl true
  def call(conn, %{"project_id" => project_id}) do
    with {:ok, project_id} <- Helpers.decode_id(project_id),
         {:ok, %{project_check_ins: check_ins}} <- ProjectCheckInsList.call(conn, %{project_id: project_id}) do
      {:ok, %{check_ins: check_ins}}
    end
  end
end
