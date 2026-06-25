defmodule OperatelyWeb.Mcp.Tools.Projects.GetDiscussion do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.Discussions.Get, as: ProjectDiscussionGet
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "get_project_discussion",
      title: "Get Project Discussion",
      description: "Returns one project discussion by identifier.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 48,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [%{"title" => "Open a project discussion by ID", "arguments" => %{"discussion_id" => "comment_thread_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "discussion_id" => JsonSchema.string("The project discussion identifier.")
          },
          required: ["discussion_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "discussion" => JsonSchema.any_object("The matching project discussion.")
          },
          required: ["discussion"]
        )
    )
  end

  @impl true
  def call(conn, %{"discussion_id" => discussion_id}) do
    with {:ok, discussion_id} <- Helpers.decode_id(discussion_id),
         {:ok, %{discussion: discussion}} <- ProjectDiscussionGet.call(conn, %{id: discussion_id}) do
      {:ok, %{discussion: Map.put(discussion, :comments, Helpers.load_comments(conn, discussion_id, :project_discussion))}}
    end
  end
end
