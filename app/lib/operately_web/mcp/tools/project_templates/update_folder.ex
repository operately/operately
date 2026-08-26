defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.UpdateFolder do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.UpdateFolder, as: FolderUpdate
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_project_template_folder",
      title: "Update Project Template Folder",
      description: "Renames a folder in a project template Docs & Files tree. For live hub folders, use rename_folder.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 255,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [
        %{
          "title" => "Update Project Template Folder",
          "arguments" => %{"template_id" => "project_template_123", "folder_id" => "template_folder_123", "name" => "Launch materials"}
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "template_id" => JsonSchema.string("The project template identifier."),
            "folder_id" => JsonSchema.string("The template folder identifier."),
            "name" => JsonSchema.string("The replacement folder name.")
          },
          required: ["template_id", "folder_id", "name"]
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
    with {:ok, template_id} <- Helpers.decode_id(arguments["template_id"]), {:ok, folder_id} <- Helpers.decode_id(arguments["folder_id"]) do
      FolderUpdate.call(conn, %{template_id: template_id, folder_id: folder_id, name: arguments["name"]})
    end
  end
end
