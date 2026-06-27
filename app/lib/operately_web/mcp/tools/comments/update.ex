defmodule OperatelyWeb.Mcp.Tools.Comments.Update do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Comments.Update, as: CommentUpdate
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_comment",
      title: "Update Comment",
      description: "Updates one existing comment on a supported Operately resource.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 200,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "comments"},
      examples: [
        %{
          "title" => "Edit a project discussion comment",
          "arguments" => %{
            "comment_id" => "comment_123",
            "parent_type" => "project_discussion",
            "content" => "Updated comment text."
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "comment_id" => JsonSchema.string("The comment identifier."),
            "parent_type" => JsonSchema.string("The type of resource that owns the comment.", enum: Helpers.comment_parent_type_values()),
            "content" => JsonSchema.string("The updated comment text in plain text or markdown.")
          },
          required: ["comment_id", "parent_type", "content"]
        ),
      output_schema:
        JsonSchema.object(
          %{"comment" => JsonSchema.any_object("The updated comment.")},
          required: ["comment"]
        )
    )
  end

  @impl true
  def call(conn, %{"comment_id" => comment_id, "parent_type" => parent_type, "content" => content}) do
    with {:ok, comment_id} <- Helpers.decode_id(comment_id),
         {:ok, parent_type} <- Helpers.decode_comment_parent_type(parent_type),
         {:ok, content} <- Helpers.markdown_to_rich_text(content) do
      CommentUpdate.call(conn, %{comment_id: comment_id, parent_type: parent_type, content: content})
    end
  end
end
