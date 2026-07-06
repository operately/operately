defmodule OperatelyWeb.Mcp.Tools.Comments.Delete do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Comments.Delete, as: CommentDelete
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "delete_comment",
      title: "Delete Comment",
      description: "Permanently deletes one comment on a supported Operately resource.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :destructive,
      sort_order: 210,
      annotations: destructive_annotations(),
      security_schemes: destructive_security_schemes(),
      discovery_metadata: %{"category" => "comments"},
      examples: [
        %{
          "title" => "Delete a project discussion comment",
          "arguments" => %{
            "comment_id" => "comment_123",
            "parent_type" => "project_discussion"
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "comment_id" => JsonSchema.string("The comment identifier."),
            "parent_type" => JsonSchema.string("The type of resource that owns the comment.", enum: Helpers.comment_parent_type_values())
          },
          required: ["comment_id", "parent_type"]
        ),
      output_schema:
        JsonSchema.object(
          %{"comment" => JsonSchema.any_object("The deleted comment.")},
          required: ["comment"]
        )
    )
  end

  @impl true
  def call(conn, %{"comment_id" => comment_id, "parent_type" => parent_type}) do
    with {:ok, comment_id} <- Helpers.decode_id(comment_id),
         {:ok, parent_type} <- Helpers.decode_comment_parent_type(parent_type) do
      CommentDelete.call(conn, %{comment_id: comment_id, parent_type: parent_type})
    end
  end
end
