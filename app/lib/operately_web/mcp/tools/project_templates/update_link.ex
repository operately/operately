defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.UpdateLink do
  use OperatelyWeb.Mcp.Tool

  alias Operately.ResourceHubs.Link
  alias OperatelyWeb.Api.ProjectTemplates.UpdateLink, as: LinkUpdate
  alias OperatelyWeb.Mcp.Helpers

  @link_types Enum.map(Link.valid_types(), &Atom.to_string/1)

  @impl true
  def definition do
    Definition.new!(
      name: "update_project_template_link",
      title: "Update Project Template Link",
      description: "Replaces a project-template link's name, URL, description, and provider type. For live hub links, use update_link.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 260,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [
        %{
          "title" => "Update Project Template Link",
          "arguments" => %{
            "template_id" => "project_template_123",
            "link_id" => "template_link_123",
            "name" => "Design",
            "url" => "https://figma.com/file/456",
            "type" => "figma"
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "template_id" => JsonSchema.string("The project template identifier."),
            "link_id" => JsonSchema.string("The template link identifier."),
            "name" => JsonSchema.string("The replacement name."),
            "url" => JsonSchema.string("The replacement URL.", format: "uri"),
            "description" => JsonSchema.nullable(JsonSchema.string("Markdown description; null clears it.")),
            "type" => JsonSchema.string("The link provider type.", enum: @link_types)
          },
          required: ["template_id", "link_id", "name", "url", "type"]
        ),
      output_schema: JsonSchema.object(%{"link" => JsonSchema.any_object()}, required: ["link"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, template_id} <- Helpers.decode_id(arguments["template_id"]),
         {:ok, link_id} <- Helpers.decode_id(arguments["link_id"]),
         {:ok, description} <- Helpers.markdown_to_rich_text_nullable(arguments["description"]),
         {:ok, type} <- Helpers.decode_enum(arguments["type"], @link_types) do
      LinkUpdate.call(conn, %{template_id: template_id, link_id: link_id, name: arguments["name"], url: arguments["url"], description: description, type: type})
    end
  end
end
