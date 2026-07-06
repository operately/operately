defmodule OperatelyWeb.Mcp.Tools.Spaces.ArchiveDiscussion do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Spaces.ArchiveDiscussion, as: SpaceArchiveDiscussion
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "archive_space_discussion",
      title: "Archive Space Discussion",
      description: "Archives one space discussion and removes it from active discussion lists.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :destructive,
      sort_order: 214,
      annotations: destructive_annotations(),
      security_schemes: destructive_security_schemes(),
      discovery_metadata: %{"category" => "spaces"},
      examples: [%{"title" => "Archive a discussion", "arguments" => %{"discussion_id" => "discussion_123"}}],
      input_schema:
        JsonSchema.object(
          %{"discussion_id" => JsonSchema.string("The space discussion identifier.")},
          required: ["discussion_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"success" => JsonSchema.boolean("True when the discussion is archived.")},
          required: ["success"]
        )
    )
  end

  @impl true
  def call(conn, %{"discussion_id" => discussion_id}) do
    with {:ok, discussion_id} <- Helpers.decode_id(discussion_id),
         {:ok, _result} <- SpaceArchiveDiscussion.call(conn, %{id: discussion_id}) do
      {:ok, %{success: true}}
    end
  end
end
