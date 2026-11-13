defmodule OperatelyWeb.Mcp.Tools.Projects.GetRetrospective do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.GetRetrospective, as: Api
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "get_project_retrospective",
      title: "Get Project Retrospective",
      description: "Returns a project retrospective.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 52,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [%{"title" => "Get project retrospective", "arguments" => %{"project_id" => "project_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "project_id" => JsonSchema.string("The project id.")
          },
          required: ["project_id"]
        ),
      output_schema: JsonSchema.object(%{"retrospective" => JsonSchema.any_object()}, required: ["retrospective"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, project_id} <- Helpers.decode_id(arguments["project_id"]) do
      Api.call(conn, %{project_id: project_id})
    end
  end
end
