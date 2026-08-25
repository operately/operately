defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.Create do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.Create, as: TemplateCreate
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "create_project_template",
      title: "Create Project Template",
      description: "Creates an empty project template in a space.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 230,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [%{"title" => "Create Project Template", "arguments" => %{"space_id" => "space_123", "name" => "Product launch"}}],
      input_schema:
        JsonSchema.object(
          %{
            "space_id" => JsonSchema.string("The destination space identifier."),
            "name" => JsonSchema.string("The template name."),
            "description" => JsonSchema.nullable(JsonSchema.string("Optional Markdown description; null clears it.")),
            "duration_days" => JsonSchema.nullable(JsonSchema.integer("Optional project duration in days.", minimum: 0))
          },
          required: ["space_id", "name"]
        ),
      output_schema:
        JsonSchema.object(
          %{"template" => JsonSchema.any_object()},
          required: ["template"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, space_id} <- Helpers.decode_id(arguments["space_id"]),
         {:ok, description} <- Helpers.markdown_to_rich_text_nullable(arguments["description"]) do
      conn
      |> TemplateCreate.call(%{space_id: space_id, name: arguments["name"], description: description, duration_days: arguments["duration_days"]})
      |> Helpers.present_project_template_result()
    end
  end
end
