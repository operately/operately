defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.UpdateDiscussion do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.UpdateDiscussion, as: DiscussionUpdate
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_project_template_discussion",
      title: "Update Project Template Discussion",
      description: "Replaces a template discussion's title and Markdown body.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 250,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [
        %{
          "title" => "Update Project Template Discussion",
          "arguments" => %{
            "template_id" => "project_template_123",
            "discussion_id" => "template_discussion_123",
            "title" => "Updated kickoff",
            "body" => "Review the plan."
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "template_id" => JsonSchema.string("The project template identifier."),
            "discussion_id" => JsonSchema.string("The template discussion identifier."),
            "title" => JsonSchema.string("The replacement title."),
            "body" => JsonSchema.string("The replacement body in Markdown.")
          },
          required: ["template_id", "discussion_id", "title", "body"]
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
    with {:ok, template_id} <- Helpers.decode_id(arguments["template_id"]),
         {:ok, discussion_id} <- Helpers.decode_id(arguments["discussion_id"]),
         {:ok, body} <- Helpers.markdown_to_rich_text_allow_blank(arguments["body"]) do
      DiscussionUpdate.call(conn, %{template_id: template_id, discussion_id: discussion_id, title: arguments["title"], body: body})
    end
  end
end
