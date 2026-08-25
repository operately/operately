defmodule OperatelyWeb.Mcp.Tools.Projects.ListContributors do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.Get
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "list_project_contributors",
      title: "List Project Contributors",
      description: "Lists project contributors and their access levels.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 51,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [%{"title" => "List contributors", "arguments" => %{"project_id" => "project_123"}}],
      input_schema: JsonSchema.object(%{"project_id" => JsonSchema.string("The project identifier.")}, required: ["project_id"]),
      output_schema: JsonSchema.object(%{"contributors" => JsonSchema.array(JsonSchema.any_object())}, required: ["contributors"])
    )
  end

  @impl true
  def call(conn, %{"project_id" => project_id}) do
    with {:ok, project_id} <- Helpers.decode_id(project_id),
         {:ok, %{project: project}} <- Get.call(conn, %{id: project_id, include_contributors: true, include_contributors_access_levels: true}) do
      {:ok, %{contributors: project.contributors || []}}
    end
  end
end
