defmodule OperatelyWeb.Mcp.Tools.Projects.Get do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Helpers
  alias OperatelyWeb.Api.Projects.Get, as: ProjectGet

  @impl true
  def definition do
    Definition.new!(
      name: "get_project",
      title: "Get Project",
      description: "Returns one project by identifier.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 40,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [%{"title" => "Open a project by ID", "arguments" => %{"project_id" => "project_123"}}],
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
            "project" => JsonSchema.any_object("The matching project.")
          },
          required: ["project"]
        )
    )
  end

  @impl true
  def call(conn, %{"project_id" => project_id}) do
    with {:ok, project_id} <- decode_project_id(project_id) do
      ProjectGet.call(conn, %{id: project_id, include_markdown: false})
    end
  end

  defp decode_project_id(project_id) do
    case Helpers.decode_id(project_id) do
      {:ok, decoded_project_id} -> {:ok, decoded_project_id}
      {:error, _reason} -> {:error, :invalid_arguments}
    end
  end
end
