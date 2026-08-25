defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.Archive do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.Archive
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "archive_project_template",
      title: "Archive Project Template",
      description: "Archives an active project template.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :destructive,
      sort_order: 235,
      annotations: destructive_annotations(),
      security_schemes: destructive_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [%{"title" => "Archive Project Template", "arguments" => %{"template_id" => "project_template_123"}}],
      input_schema:
        JsonSchema.object(
          %{"template_id" => JsonSchema.string("The project template identifier.")},
          required: ["template_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"success" => JsonSchema.boolean("Whether the template was archived.")},
          required: ["success"]
        )
    )
  end

  @impl true
  def call(conn, %{"template_id" => template_id}) do
    with {:ok, id} <- Helpers.decode_id(template_id), do: Archive.call(conn, %{id: id})
  end
end
