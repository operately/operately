defmodule OperatelyWeb.Mcp.Tools.Goals.UpdateCheckIn do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.UpdateCheckIn, as: Api
  alias OperatelyWeb.Mcp.Tools.Goals.CheckInInputs
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_goal_check_in",
      title: "Update Goal Check In",
      description: """
      Edits goal check-in content, progress, and publication settings. Published status, due_date,
      target_values, and checklist changes require the latest check-in and less than three days since
      published_at (fallback: inserted_at). Content has no time limit; drafts and scheduled check-ins
      are exempt from this window. Omitted fields are preserved. Restricted changes are silently
      ignored: verify returned values before reporting success.
      """,
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 141,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [%{"title" => "Update goal check in", "arguments" => %{"check_in_id" => "check_in_123", "status" => "on_track", "content" => "Progress update"}}],
      input_schema:
        JsonSchema.object(
          %{
            "check_in_id" => JsonSchema.string("The check in id."),
            "status" => JsonSchema.string("Check-in status, subject to the latest-check-in and three-day edit window. Omit to preserve.", enum: ["on_track", "caution", "off_track"]),
            "content" => JsonSchema.string("Check-in content in Markdown."),
            "state" => JsonSchema.string("Use draft to cancel a schedule or published to publish.", enum: ["draft", "published"]),
            "scheduled_at" => JsonSchema.string("Publication instant with an explicit timezone offset. Omit to preserve.", format: "date-time")
          }
          |> Map.merge(CheckInInputs.schema_properties()),
          required: ["check_in_id", "content"]
        ),
      output_schema: JsonSchema.object(%{"check_in" => JsonSchema.any_object()}, required: ["check_in"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, id} <- Helpers.decode_id(arguments["check_in_id"]),
         {:ok, content} <- Helpers.markdown_to_rich_text(arguments["content"]),
         {:ok, status} <- Helpers.decode_optional_enum(arguments["status"], ["on_track", "caution", "off_track"]),
         {:ok, progress} <- CheckInInputs.decode(arguments),
         {:ok, publishing} <- Helpers.decode_update_publishing_inputs(arguments),
         {:ok, %{update: check_in}} <- Api.call(conn, %{id: id, content: content} |> Helpers.put_optional(:status, status) |> Map.merge(publishing) |> Map.merge(progress)) do
      {:ok, %{check_in: check_in}}
    end
  end
end
