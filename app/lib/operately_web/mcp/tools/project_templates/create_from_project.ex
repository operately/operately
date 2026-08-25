defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.CreateFromProject do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.CreateFromProject
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "create_project_template_from_project",
      title: "Create Project Template from Project",
      description: "Creates a reusable template from an existing project and selected related content.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 231,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [
        %{
          "title" => "Create Project Template from Project",
          "arguments" => %{"project_id" => "project_123", "name" => "Launch template"}
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "project_id" => JsonSchema.string("The source project identifier."),
            "name" => JsonSchema.string("The template name."),
            "description" => JsonSchema.nullable(JsonSchema.string("Optional Markdown description.")),
            "include_contributors_and_assignments" => JsonSchema.boolean("Include contributors and assignments.", default: false),
            "include_discussions" => JsonSchema.boolean("Include discussions.", default: true),
            "include_docs_and_files" => JsonSchema.boolean("Include Docs & Files.", default: true),
            "include_comments" => JsonSchema.boolean("Include comments.", default: false)
          },
          required: ["project_id", "name"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "template" => JsonSchema.nullable(JsonSchema.any_object()),
            "schedule_issues" => JsonSchema.array(JsonSchema.any_object())
          },
          required: ["schedule_issues"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, project_id} <- Helpers.decode_id(arguments["project_id"]),
         {:ok, description} <- Helpers.markdown_to_rich_text_nullable(arguments["description"]) do
      conn
      |> CreateFromProject.call(%{
        project_id: project_id,
        name: arguments["name"],
        description: description,
        include_people_and_assignments: Map.get(arguments, "include_contributors_and_assignments", false),
        include_discussions: Map.get(arguments, "include_discussions", true),
        include_docs_and_files: Map.get(arguments, "include_docs_and_files", true),
        include_comments: Map.get(arguments, "include_comments", false)
      })
      |> Helpers.present_project_template_result()
    end
  end
end
