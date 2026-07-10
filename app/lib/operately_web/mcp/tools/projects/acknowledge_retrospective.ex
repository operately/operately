defmodule OperatelyWeb.Mcp.Tools.Projects.AcknowledgeRetrospective do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.AcknowledgeRetrospective, as: ProjectAcknowledgeRetrospective
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "acknowledge_project_retrospective",
      title: "Acknowledge Project Retrospective",
      description: "Acknowledges one project retrospective.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 133,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [%{"title" => "Acknowledge a project retrospective", "arguments" => %{"retrospective_id" => "retrospective_123"}}],
      input_schema:
        JsonSchema.object(
          %{"retrospective_id" => JsonSchema.string("The project retrospective identifier.")},
          required: ["retrospective_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"retrospective" => JsonSchema.any_object("The acknowledged retrospective.")},
          required: ["retrospective"]
        )
    )
  end

  @impl true
  def call(conn, %{"retrospective_id" => retrospective_id}) do
    with {:ok, retrospective_id} <- Helpers.decode_id(retrospective_id) do
      ProjectAcknowledgeRetrospective.call(conn, %{id: retrospective_id})
    end
  end
end
