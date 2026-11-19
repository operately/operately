defmodule OperatelyWeb.Mcp.Tools.Projects.UpdateCheckIn do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.UpdateCheckIn, as: Api
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_project_check_in",
      title: "Update Project Check In",
      description: """
      Edits project check-in content, status, and publication settings. Published status changes require
      the latest check-in and less than three days since published_at (fallback: inserted_at).
      Content has no time limit; drafts and scheduled check-ins are exempt from this window.
      Omitted scheduling fields are preserved. Restricted changes are silently ignored: verify the
      returned status before reporting success. For content-only edits, pass the current status.
      """,
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 113,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [%{"title" => "Update project check in", "arguments" => %{"check_in_id" => "check_in_123", "status" => "on_track", "content" => "Progress update"}}],
      input_schema:
        JsonSchema.object(
          %{
            "check_in_id" => JsonSchema.string("The check in id."),
            "status" =>
              JsonSchema.string("Check-in status, subject to the latest-check-in and three-day edit window. Pass the current status for content-only edits.",
                enum: ["on_track", "caution", "off_track"]
              ),
            "content" => JsonSchema.string("Check-in content in Markdown."),
            "state" => JsonSchema.string("Use draft to cancel a schedule or published to publish.", enum: ["draft", "published"]),
            "scheduled_at" => JsonSchema.string("Publication instant with an explicit timezone offset. Omit to preserve.", format: "date-time")
          },
          required: ["check_in_id", "status", "content"]
        ),
      output_schema: JsonSchema.object(%{"check_in" => JsonSchema.any_object()}, required: ["check_in"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, id} <- Helpers.decode_id(arguments["check_in_id"]),
         {:ok, content} <- Helpers.markdown_to_rich_text(arguments["content"]),
         {:ok, status} <- Helpers.decode_enum(arguments["status"], ["on_track", "caution", "off_track"]),
         {:ok, publishing} <- Helpers.decode_update_publishing_inputs(arguments) do
      Api.call(conn, Map.merge(%{check_in_id: id, status: status, description: content}, publishing))
    end
  end
end
