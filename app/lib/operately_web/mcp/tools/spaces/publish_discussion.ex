defmodule OperatelyWeb.Mcp.Tools.Spaces.PublishDiscussion do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Spaces.PublishDiscussion, as: SpacePublishDiscussion
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "publish_space_discussion",
      title: "Publish Space Discussion",
      description: "Publishes one draft space discussion.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 184,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "spaces"},
      examples: [%{"title" => "Publish a draft discussion", "arguments" => %{"discussion_id" => "discussion_123"}}],
      input_schema:
        JsonSchema.object(
          %{"discussion_id" => JsonSchema.string("The draft discussion identifier.")},
          required: ["discussion_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"discussion" => JsonSchema.any_object("The published discussion.")},
          required: ["discussion"]
        )
    )
  end

  @impl true
  def call(conn, %{"discussion_id" => discussion_id}) do
    with {:ok, discussion_id} <- Helpers.decode_id(discussion_id) do
      SpacePublishDiscussion.call(conn, %{id: discussion_id})
    end
  end
end
