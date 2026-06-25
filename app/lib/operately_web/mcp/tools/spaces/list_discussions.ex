defmodule OperatelyWeb.Mcp.Tools.Spaces.ListDiscussions do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Spaces.ListDiscussions, as: SpaceDiscussionsList
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "list_space_discussions",
      title: "List Space Discussions",
      description: "Lists discussions for one space.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 81,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "spaces"},
      examples: [%{"title" => "List discussions for a space", "arguments" => %{"space_id" => "space_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "space_id" => JsonSchema.string("The space identifier.")
          },
          required: ["space_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "discussions" => JsonSchema.array(JsonSchema.any_object(), description: "The published discussions."),
            "my_drafts" => JsonSchema.array(JsonSchema.any_object(), description: "The caller's draft discussions.")
          },
          required: ["discussions", "my_drafts"]
        )
    )
  end

  @impl true
  def call(conn, %{"space_id" => space_id}) do
    with {:ok, space_id} <- Helpers.decode_id(space_id) do
      SpaceDiscussionsList.call(conn, %{space_id: space_id})
    end
  end
end
