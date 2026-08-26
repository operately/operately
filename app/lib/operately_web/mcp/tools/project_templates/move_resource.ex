defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.MoveResource do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.MoveResource
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "move_project_template_resource",
      title: "Move Project Template Resource",
      description: "Moves a project-template Docs & Files node into a folder or to the root. For live hub resources, use move_resource_hub_item.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 262,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [
        %{
          "title" => "Move Project Template Resource",
          "arguments" => %{"template_id" => "project_template_123", "node_id" => "template_resource_node_123", "parent_folder_id" => nil}
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "template_id" => JsonSchema.string("The project template identifier."),
            "node_id" => JsonSchema.string("The template resource-node identifier."),
            "parent_folder_id" => JsonSchema.nullable(JsonSchema.string("Destination folder identifier; null moves to root."))
          },
          required: ["template_id", "node_id", "parent_folder_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"success" => JsonSchema.boolean("Whether the resource was moved.")},
          required: ["success"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, template_id} <- Helpers.decode_id(arguments["template_id"]),
         {:ok, node_id} <- Helpers.decode_id(arguments["node_id"]),
         {:ok, parent_folder_id} <- Helpers.decode_optional_id(arguments["parent_folder_id"]) do
      MoveResource.call(conn, %{template_id: template_id, node_id: node_id, parent_folder_id: parent_folder_id})
    end
  end
end
