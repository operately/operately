defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.Restore do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.Restore
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "restore_project_template",
      title: "Restore Project Template",
      description: "Restores an archived project template.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 236,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [%{"title" => "Restore Project Template", "arguments" => %{"template_id" => "project_template_123"}}],
      input_schema:
        JsonSchema.object(
          %{"template_id" => JsonSchema.string("The project template identifier.")},
          required: ["template_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"success" => JsonSchema.boolean("Whether the template was restored.")},
          required: ["success"]
        )
    )
  end

  @impl true
  def call(conn, %{"template_id" => template_id}) do
    with {:ok, id} <- Helpers.decode_id(template_id), do: Restore.call(conn, %{id: id})
  end
end
