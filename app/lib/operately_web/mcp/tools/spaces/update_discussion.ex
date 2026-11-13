defmodule OperatelyWeb.Mcp.Tools.Spaces.UpdateDiscussion do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Spaces.UpdateDiscussion, as: SpaceUpdateDiscussion
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_space_discussion",
      title: "Update Space Discussion",
      description: "Updates a discussion or draft. Omitted fields remain unchanged. Supply scheduled_at to schedule or reschedule; state=draft cancels scheduling; state=published publishes immediately.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 183,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "spaces"},
      examples: [%{"title" => "Edit a space discussion", "arguments" => %{"discussion_id" => "discussion_123", "title" => "Updated title", "content" => "Updated body"}}],
      input_schema:
        JsonSchema.object(
          %{
            "discussion_id" => JsonSchema.string("The space discussion identifier."),
            "state" => JsonSchema.string("Use draft to cancel scheduling or published to publish immediately.", enum: ["draft", "published"]),
            "scheduled_at" => JsonSchema.string("Publication instant with an explicit timezone offset. Omit to preserve.", format: "date-time"),
            "title" => JsonSchema.string("The updated discussion title."),
            "content" => JsonSchema.string("The updated discussion body in plain text or markdown.")
          },
          required: ["discussion_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"discussion" => JsonSchema.any_object("The updated discussion.")},
          required: ["discussion"]
        )
    )
  end

  @impl true
  def call(conn, %{"discussion_id" => discussion_id} = arguments) do
    with {:ok, discussion_id} <- Helpers.decode_id(discussion_id),
         {:ok, inputs} <- Helpers.decode_update_publishing_inputs(arguments),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "title", :title),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "content", :body, &Helpers.markdown_to_rich_text/1) do
      SpaceUpdateDiscussion.call(conn, Map.put(inputs, :id, discussion_id))
    end
  end
end
