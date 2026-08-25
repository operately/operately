defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.CreateLink do
  use OperatelyWeb.Mcp.Tool

  alias Operately.ResourceHubs.Link
  alias OperatelyWeb.Api.ProjectTemplates.CreateLink
  alias OperatelyWeb.Mcp.Helpers

  @link_types Enum.map(Link.valid_types(), &Atom.to_string/1)

  @impl true
  def definition do
    Definition.new!(
      name: "create_project_template_link",
      title: "Create Project Template Link",
      description: "Creates a typed external link in a project template.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 259,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [
        %{
          "title" => "Create Project Template Link",
          "arguments" => %{
            "template_id" => "project_template_123",
            "name" => "Design",
            "url" => "https://figma.com/file/123",
            "type" => "figma"
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "template_id" => JsonSchema.string("The project template identifier."),
            "parent_folder_id" => JsonSchema.nullable(JsonSchema.string("Optional parent folder identifier.")),
            "name" => JsonSchema.string("The link name."),
            "url" => JsonSchema.string("The external URL.", format: "uri"),
            "description" => JsonSchema.nullable(JsonSchema.string("Optional Markdown description.")),
            "type" => JsonSchema.string("The link provider type.", enum: @link_types)
          },
          required: ["template_id", "name", "url", "type"]
        ),
      output_schema: JsonSchema.object(%{"link" => JsonSchema.any_object()}, required: ["link"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, template_id} <- Helpers.decode_id(arguments["template_id"]),
         {:ok, parent_folder_id} <- Helpers.decode_optional_id(arguments["parent_folder_id"]),
         {:ok, description} <- Helpers.markdown_to_rich_text_nullable(arguments["description"]),
         {:ok, type} <- Helpers.decode_enum(arguments["type"], @link_types) do
      CreateLink.call(conn, %{template_id: template_id, parent_folder_id: parent_folder_id, name: arguments["name"], url: arguments["url"], description: description, type: type})
    end
  end
end
