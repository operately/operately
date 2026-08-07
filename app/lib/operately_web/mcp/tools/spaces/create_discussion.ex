defmodule OperatelyWeb.Mcp.Tools.Spaces.CreateDiscussion do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Spaces.CreateDiscussion, as: SpaceCreateDiscussion
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "create_space_discussion",
      title: "Create Space Discussion",
      description: "Creates a new discussion for one space.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 182,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "spaces"},
      examples: [
        %{
          "title" => "Start a space discussion",
          "arguments" => %{
            "space_id" => "space_123",
            "title" => "Planning",
            "content" => "Let us align on next quarter."
          }
        },
        %{
          "title" => "Start a discussion and notify everyone",
          "arguments" => %{
            "space_id" => "space_123",
            "title" => "Planning",
            "content" => "Let us align on next quarter.",
            "notify_everyone" => true
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "space_id" => JsonSchema.string("The space identifier."),
            "title" => JsonSchema.string("The discussion title."),
            "content" => JsonSchema.string("The discussion body in plain text or markdown."),
            "notify_person_ids" =>
              JsonSchema.array(
                JsonSchema.string("A person identifier."),
                description: "Optional people to notify about this discussion. Defaults to none beyond the author."
              ),
            "notify_everyone" =>
              JsonSchema.boolean(
                "When true, notify everyone eligible for this space. Defaults to false."
              )
          },
          required: ["space_id", "title", "content"]
        ),
      output_schema:
        JsonSchema.object(
          %{"discussion" => JsonSchema.any_object("The created discussion.")},
          required: ["discussion"]
        )
    )
  end

  @impl true
  def call(conn, %{"space_id" => space_id, "title" => title, "content" => content} = arguments) do
    with {:ok, space_id} <- Helpers.decode_id(space_id),
         {:ok, content} <- Helpers.markdown_to_rich_text(content),
         {:ok, notification_inputs} <- Helpers.decode_notification_inputs(arguments) do
      SpaceCreateDiscussion.call(
        conn,
        Map.merge(
          %{
            space_id: space_id,
            title: title,
            body: content,
            post_as_draft: false
          },
          notification_inputs
        )
      )
    end
  end
end
