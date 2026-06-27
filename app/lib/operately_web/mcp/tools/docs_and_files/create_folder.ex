defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.CreateFolder do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Wrappers.DocsAndFiles.CreateFolder, as: FolderCreate
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "create_folder",
      title: "Create Folder",
      description: "Creates a new folder in exactly one space, project, or goal resource hub.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 197,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "docs_and_files"},
      examples: [%{"title" => "Create a project folder", "arguments" => %{"project_id" => "project_123", "name" => "Design"}}],
      input_schema:
        JsonSchema.object(
          %{
            "space_id" => JsonSchema.string("The parent space identifier."),
            "project_id" => JsonSchema.string("The parent project identifier."),
            "goal_id" => JsonSchema.string("The parent goal identifier."),
            "folder_id" => JsonSchema.string("An optional parent folder identifier."),
            "name" => JsonSchema.string("The new folder name.")
          },
          required: ["name"]
        ),
      output_schema:
        JsonSchema.object(
          %{"folder" => JsonSchema.any_object("The created folder.")},
          required: ["folder"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, scope_inputs} <- Helpers.decode_hub_scope(arguments),
         {:ok, folder_id} <- Helpers.decode_optional_id(arguments["folder_id"]) do
      FolderCreate.call(conn, Map.merge(scope_inputs, %{folder_id: folder_id, name: arguments["name"]}))
    end
  end
end
