defmodule OperatelyWeb.Mcp.Tools.Spaces.GetDiscussion do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Spaces.GetDiscussion, as: SpaceDiscussionGet
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "get_space_discussion",
      title: "Get Space Discussion",
      description: "Returns one space discussion by identifier.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 82,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "spaces"},
      examples: [%{"title" => "Open a space discussion by ID", "arguments" => %{"discussion_id" => "message_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "discussion_id" => JsonSchema.string("The space discussion identifier.")
          },
          required: ["discussion_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "discussion" => JsonSchema.any_object("The matching space discussion.")
          },
          required: ["discussion"]
        )
    )
  end

  @impl true
  def call(conn, %{"discussion_id" => discussion_id}) do
    with {:ok, discussion_id} <- Helpers.decode_id(discussion_id),
         {:ok, %{discussion: discussion}} <- SpaceDiscussionGet.call(conn, %{id: discussion_id}) do
      {:ok, %{discussion: Map.put(discussion, :comments, Helpers.load_comments(conn, discussion_id, :message))}}
    end
  end
end
