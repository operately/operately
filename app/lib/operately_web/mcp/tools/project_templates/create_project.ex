defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.CreateProject do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.CreateProject
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "create_project_from_template",
      title: "Create Project from Template",
      description: "Creates a project from a template using the destination space's standard access defaults.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 232,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [
        %{
          "title" => "Create Project from Template",
          "arguments" => %{
            "template_id" => "project_template_123",
            "space_id" => "space_123",
            "start_date" => "2026-09-01",
            "name" => "Q4 launch"
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "template_id" => JsonSchema.string("The project template identifier."),
            "space_id" => JsonSchema.string("The destination space identifier."),
            "start_date" => JsonSchema.string("The project start date in ISO YYYY-MM-DD format."),
            "name" => JsonSchema.string("The project name."),
            "goal_id" => JsonSchema.nullable(JsonSchema.string("Optional parent goal identifier."))
          },
          required: ["template_id", "space_id", "start_date", "name"]
        ),
      output_schema: JsonSchema.object(%{"project" => JsonSchema.any_object()}, required: ["project"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, template_id} <- Helpers.decode_id(arguments["template_id"]),
         {:ok, space_id} <- Helpers.decode_id(arguments["space_id"]),
         {:ok, goal_id} <- Helpers.decode_optional_id(arguments["goal_id"]),
         {:ok, start_date} <- Helpers.parse_iso_date(arguments["start_date"]),
         {:ok, space} <- Helpers.load_space_with_access_levels(conn.assigns.current_person, space_id) do
      defaults = Helpers.default_nested_access_levels(space)

      CreateProject.call(conn, %{
        template_id: template_id,
        space_id: space_id,
        start_date: start_date,
        name: arguments["name"],
        goal_id: goal_id,
        anonymous_access_level: defaults.anonymous,
        company_access_level: defaults.company,
        space_access_level: defaults.space
      })
    end
  end
end
