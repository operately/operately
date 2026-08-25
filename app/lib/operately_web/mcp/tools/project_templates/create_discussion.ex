defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.CreateDiscussion do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.CreateDiscussion
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "create_project_template_discussion",
      title: "Create Project Template Discussion",
      description: "Adds a reusable discussion to a project template.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 249,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [
        %{
          "title" => "Create Project Template Discussion",
          "arguments" => %{"template_id" => "project_template_123", "title" => "Kickoff", "body" => "Discuss the **launch plan**."}
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "template_id" => JsonSchema.string("The project template identifier."),
            "title" => JsonSchema.string("The discussion title."),
            "body" => JsonSchema.string("The discussion body in Markdown.")
          },
          required: ["template_id", "title", "body"]
        ),
      output_schema:
        JsonSchema.object(
          %{"discussion" => JsonSchema.any_object()},
          required: ["discussion"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, template_id} <- Helpers.decode_id(arguments["template_id"]), {:ok, body} <- Helpers.markdown_to_rich_text_allow_blank(arguments["body"]) do
      CreateDiscussion.call(conn, %{template_id: template_id, title: arguments["title"], body: body})
    end
  end
end
