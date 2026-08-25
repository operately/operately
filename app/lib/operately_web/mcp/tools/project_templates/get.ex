defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.Get do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.Get, as: TemplateGet
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "get_project_template",
      title: "Get Project Template",
      description: "Gets a complete project template including its planning, contributors, discussions, resources, and task statuses.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 102,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [%{"title" => "Get Project Template", "arguments" => %{"template_id" => "project_template_123"}}],
      input_schema:
        JsonSchema.object(
          %{"template_id" => JsonSchema.string("The project template identifier.")},
          required: ["template_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"template" => JsonSchema.any_object()},
          required: ["template"]
        )
    )
  end

  @impl true
  def call(conn, %{"template_id" => template_id}) do
    with {:ok, id} <- Helpers.decode_id(template_id) do
      conn
      |> TemplateGet.call(%{id: id})
      |> Helpers.present_project_template_result()
    end
  end
end
