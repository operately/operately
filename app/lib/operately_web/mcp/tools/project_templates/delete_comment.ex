defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.DeleteComment do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.DeleteComment
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "delete_project_template_comment",
      title: "Delete Project Template Comment",
      description: "Deletes a comment from a project template. Applies only to project templates / reusable blueprint content. For comments on live Operately resources, use delete_comment (see also create_comment and update_comment).",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :destructive,
      sort_order: 253,
      annotations: destructive_annotations(),
      security_schemes: destructive_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [
        %{
          "title" => "Delete Project Template Comment",
          "arguments" => %{"template_id" => "project_template_123", "comment_id" => "template_comment_123"}
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "template_id" => JsonSchema.string("The project template identifier."),
            "comment_id" => JsonSchema.string("The template comment identifier.")
          },
          required: ["template_id", "comment_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"success" => JsonSchema.boolean("Whether the comment was deleted.")},
          required: ["success"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, template_id} <- Helpers.decode_id(arguments["template_id"]), {:ok, comment_id} <- Helpers.decode_id(arguments["comment_id"]) do
      DeleteComment.call(conn, %{template_id: template_id, comment_id: comment_id})
    end
  end
end
