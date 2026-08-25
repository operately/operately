defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.CreateFolder do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.CreateFolder
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "create_project_template_folder",
      title: "Create Project Template Folder",
      description: "Creates a folder in a project template's Docs & Files tree.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 254,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [
        %{
          "title" => "Create Project Template Folder",
          "arguments" => %{"template_id" => "project_template_123", "name" => "Launch docs"}
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "template_id" => JsonSchema.string("The project template identifier."),
            "parent_folder_id" => JsonSchema.nullable(JsonSchema.string("Optional parent folder identifier.")),
            "name" => JsonSchema.string("The folder name.")
          },
          required: ["template_id", "name"]
        ),
      output_schema:
        JsonSchema.object(
          %{"folder" => JsonSchema.any_object()},
          required: ["folder"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, template_id} <- Helpers.decode_id(arguments["template_id"]), {:ok, parent_folder_id} <- Helpers.decode_optional_id(arguments["parent_folder_id"]) do
      CreateFolder.call(conn, %{template_id: template_id, parent_folder_id: parent_folder_id, name: arguments["name"]})
    end
  end
end
