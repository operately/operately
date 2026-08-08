defmodule OperatelyWeb.Mcp.Tools.Projects.UpdateDiscussion do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.Discussions.Update, as: ProjectUpdateDiscussion
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_project_discussion",
      title: "Update Project Discussion",
      description: "Updates the title and body of one existing project discussion.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 134,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [
        %{
          "title" => "Edit a project discussion",
          "arguments" => %{
            "discussion_id" => "discussion_123",
            "title" => "Updated title",
            "content" => "Updated body"
          }
        },
        %{
          "title" => "Edit a discussion and notify people",
          "arguments" => %{
            "discussion_id" => "discussion_123",
            "title" => "Updated title",
            "content" => "Updated body",
            "notify_person_ids" => ["person_123"]
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "discussion_id" => JsonSchema.string("The project discussion identifier."),
            "title" => JsonSchema.string("The updated discussion title."),
            "content" => JsonSchema.string("The updated discussion body in plain text or markdown."),
            "notify_person_ids" =>
              JsonSchema.array(
                JsonSchema.string("A person identifier."),
                description: "Optional people to notify about this update. Defaults to none beyond the author."
              ),
            "notify_everyone" =>
              JsonSchema.boolean(
                "When true, notify everyone eligible for this discussion. Defaults to false."
              )
          },
          required: ["discussion_id", "title", "content"]
        ),
      output_schema:
        JsonSchema.object(
          %{"discussion" => JsonSchema.any_object("The updated discussion.")},
          required: ["discussion"]
        )
    )
  end

  @impl true
  def call(conn, %{"discussion_id" => discussion_id, "title" => title, "content" => content} = arguments) do
    with {:ok, discussion_id} <- Helpers.decode_id(discussion_id),
         {:ok, content} <- Helpers.markdown_to_rich_text(content),
         {:ok, notification_inputs} <- Helpers.decode_notification_inputs(arguments) do
      # Project discussion updates only accept subscriber_ids (no everyone flag).
      ProjectUpdateDiscussion.call(conn, %{
        id: discussion_id,
        title: title,
        message: content,
        subscriber_ids: notification_inputs.subscriber_ids
      })
    end
  end
end
