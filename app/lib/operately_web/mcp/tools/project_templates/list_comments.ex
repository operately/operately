defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.ListComments do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.ListComments, as: CommentList
  alias OperatelyWeb.Mcp.Helpers

  @comment_parent_types ~w(discussion document file link)

  @impl true
  def definition do
    Definition.new!(
      name: "list_project_template_comments",
      title: "List Project Template Comments",
      description: "Lists comments attached to one project template discussion or resource. Applies only to project templates / reusable blueprint content. For comments on live Operately resources, use create_comment, update_comment, or delete_comment.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 104,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [
        %{
          "title" => "List Project Template Comments",
          "arguments" => %{
            "template_id" => "project_template_123",
            "parent_type" => "discussion",
            "parent_id" => "template_discussion_123"
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "template_id" => JsonSchema.string("The project template identifier."),
            "parent_type" => JsonSchema.string("The parent resource type.", enum: @comment_parent_types),
            "parent_id" => JsonSchema.string("The parent identifier.")
          },
          required: ["template_id", "parent_type", "parent_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"comments" => JsonSchema.array(JsonSchema.any_object())},
          required: ["comments"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, template_id} <- Helpers.decode_id(arguments["template_id"]),
         {:ok, parent_id} <- Helpers.decode_id(arguments["parent_id"]),
         {:ok, parent_type} <- Helpers.decode_enum(arguments["parent_type"], @comment_parent_types) do
      CommentList.call(conn, %{template_id: template_id, parent_type: parent_type, parent_id: parent_id})
    end
  end
end
