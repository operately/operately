defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.DeleteResource do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.DeleteResource
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "delete_project_template_resource",
      title: "Delete Project Template Resource",
      description: "Deletes a folder, document, file, or link node from a project template.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :destructive,
      sort_order: 261,
      annotations: destructive_annotations(),
      security_schemes: destructive_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [
        %{
          "title" => "Delete Project Template Resource",
          "arguments" => %{"template_id" => "project_template_123", "node_id" => "template_resource_node_123"}
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "template_id" => JsonSchema.string("The project template identifier."),
            "node_id" => JsonSchema.string("The template resource-node identifier.")
          },
          required: ["template_id", "node_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"success" => JsonSchema.boolean("Whether the resource was deleted.")},
          required: ["success"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, template_id} <- Helpers.decode_id(arguments["template_id"]), {:ok, node_id} <- Helpers.decode_id(arguments["node_id"]) do
      DeleteResource.call(conn, %{template_id: template_id, node_id: node_id})
    end
  end
end
