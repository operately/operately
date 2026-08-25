defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.UpdateComment do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.UpdateComment, as: CommentUpdate
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_project_template_comment",
      title: "Update Project Template Comment",
      description: "Replaces a project-template comment with Markdown content.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 252,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [
        %{
          "title" => "Update Project Template Comment",
          "arguments" => %{"template_id" => "project_template_123", "comment_id" => "template_comment_123", "content" => "Updated decision."}
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "template_id" => JsonSchema.string("The project template identifier."),
            "comment_id" => JsonSchema.string("The template comment identifier."),
            "content" => JsonSchema.string("The replacement comment in Markdown.")
          },
          required: ["template_id", "comment_id", "content"]
        ),
      output_schema:
        JsonSchema.object(
          %{"comment" => JsonSchema.any_object()},
          required: ["comment"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, template_id} <- Helpers.decode_id(arguments["template_id"]),
         {:ok, comment_id} <- Helpers.decode_id(arguments["comment_id"]),
         {:ok, content} <- Helpers.markdown_to_rich_text_allow_blank(arguments["content"]) do
      CommentUpdate.call(conn, %{template_id: template_id, comment_id: comment_id, content: content})
    end
  end
end
