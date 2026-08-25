defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.GetDiscussion do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.GetDiscussion, as: DiscussionGet
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "get_project_template_discussion",
      title: "Get Project Template Discussion",
      description: "Gets one discussion stored in a project template.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 103,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [
        %{
          "title" => "Get Project Template Discussion",
          "arguments" => %{"template_id" => "project_template_123", "discussion_id" => "template_discussion_123"}
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "template_id" => JsonSchema.string("The project template identifier."),
            "discussion_id" => JsonSchema.string("The template discussion identifier.")
          },
          required: ["template_id", "discussion_id"]
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
         {:ok, discussion_id} <- Helpers.decode_id(arguments["discussion_id"]) do
      DiscussionGet.call(conn, %{template_id: template_id, discussion_id: discussion_id})
    end
  end
end
