defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.CreateComment do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.CreateComment
  alias OperatelyWeb.Mcp.Helpers

  @comment_parent_types ~w(discussion document file link)

  @impl true
  def definition do
    Definition.new!(
      name: "create_project_template_comment",
      title: "Create Project Template Comment",
      description: "Adds a reusable Markdown comment to a project template discussion or resource. Applies only to project templates / reusable blueprint content. For comments on live Operately resources, use create_comment, update_comment, or delete_comment.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 251,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [
        %{
          "title" => "Create Project Template Comment",
          "arguments" => %{
            "template_id" => "project_template_123",
            "parent_type" => "discussion",
            "parent_id" => "template_discussion_123",
            "content" => "Capture the decision."
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "template_id" => JsonSchema.string("The project template identifier."),
            "parent_type" => JsonSchema.string("The parent type.", enum: @comment_parent_types),
            "parent_id" => JsonSchema.string("The parent identifier."),
            "content" => JsonSchema.string("The comment in Markdown.")
          },
          required: ["template_id", "parent_type", "parent_id", "content"]
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
         {:ok, parent_id} <- Helpers.decode_id(arguments["parent_id"]),
         {:ok, parent_type} <- Helpers.decode_enum(arguments["parent_type"], @comment_parent_types),
         {:ok, content} <- Helpers.markdown_to_rich_text_allow_blank(arguments["content"]) do
      CreateComment.call(conn, %{template_id: template_id, parent_type: parent_type, parent_id: parent_id, content: content})
    end
  end
end
