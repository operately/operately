defmodule OperatelyWeb.Mcp.Tools.Comments.Create do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Comments.Create, as: CommentCreate
  alias Operately.RichContent.FromMarkdown
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "create_comment",
      title: "Create Comment",
      description: "Creates a comment on a live Operately resource using its existing MCP resource ID and parent type. Applies only to live resources (projects, goals, spaces, hub docs/files/links, tasks, check-ins, etc.). For reusable blueprint comments inside a project template, use create_project_template_comment, update_project_template_comment, delete_project_template_comment, or list_project_template_comments.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 110,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "comments"},
      examples: [
        %{
          "title" => "Comment on a project discussion",
          "arguments" => %{
            "resource_id" => "roadmap-discussion--abc123",
            "parent_type" => "project_discussion",
            "content" => "Looks good to me."
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "resource_id" => JsonSchema.string("The existing MCP resource identifier to comment on."),
            "parent_type" =>
              JsonSchema.string(
                "The type of resource identified by resource_id.",
                enum: Helpers.comment_parent_type_values()
              ),
            "content" => JsonSchema.string("Plain text or simple markdown content for the comment.")
          },
          required: ["resource_id", "parent_type", "content"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "comment" => JsonSchema.any_object("The created comment.")
          },
          required: ["comment"]
        )
    )
  end

  @impl true
  def call(conn, %{"resource_id" => resource_id, "parent_type" => parent_type, "content" => content}) do
    with {:ok, rich_content} <- FromMarkdown.to_rich_text(content),
         {:ok, entity_type} <- Helpers.decode_comment_parent_type(parent_type),
         {:ok, entity_id} <- Helpers.decode_id(resource_id) do
      case CommentCreate.call(conn, %{
             entity_id: entity_id,
             entity_type: entity_type,
             content: rich_content
           }) do
        {:ok, %{comment: %{comment: comment}}} -> {:ok, %{comment: comment}}
        result -> result
      end
    end
  end
end
