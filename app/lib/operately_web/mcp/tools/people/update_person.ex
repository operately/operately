defmodule OperatelyWeb.Mcp.Tools.People.UpdatePerson do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.People.Update, as: Api
  alias OperatelyWeb.Mcp.Helpers
  alias OperatelyWeb.Mcp.CollaborationInputs, as: Inputs
  alias Operately.People.Preferences.Notifications, as: NotificationPreferences

  @email_windows NotificationPreferences.email_window_minutes()
  @delivery_times NotificationPreferences.daily_summary_delivery_times()

  @impl true
  def definition do
    Definition.new!(
      name: "update_person",
      title: "Update Person",
      description:
        "Updates basic profile information. Omitted fields are preserved. Notification preferences and description apply only to your own profile; other profiles require permission. Read get_me/get_person afterward to verify saved preferences.",
      company_mode: :authenticated,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 210,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "people"},
      examples: [%{"title" => "Update person", "arguments" => %{"person_id" => "person_123", "title" => "Product designer"}}],
      input_schema:
        JsonSchema.object(
          %{
            "person_id" => JsonSchema.string("Person id."),
            "full_name" => JsonSchema.string("Full name."),
            "title" => JsonSchema.string("Title."),
            "timezone" => JsonSchema.string("Timezone."),
            "manager_id" => JsonSchema.nullable(JsonSchema.string("Omit to preserve; null removes the manager.")),
            "description" => JsonSchema.nullable(JsonSchema.string("Profile description in Markdown. Null clears it; omit to preserve.")),
            "notify_about_assignments" => JsonSchema.boolean("Notify about assignments."),
            "notify_on_mention" => JsonSchema.boolean("Notify on mention."),
            "send_daily_summary" => JsonSchema.boolean("Send daily summary."),
            "email_window_minutes" => JsonSchema.integer("Email batching window in minutes: #{Enum.join(@email_windows, ", ")}.", enum: @email_windows),
            "daily_summary_delivery_time" => JsonSchema.string("Local daily-summary delivery time, on the hour from 00:00 through 23:00.", enum: @delivery_times)
          },
          required: ["person_id"]
        ),
      output_schema: JsonSchema.object(%{"person" => JsonSchema.any_object()}, required: ["person"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, inputs} <- decode_inputs(arguments), do: Api.call(conn, inputs)
  end

  defp decode_inputs(arguments) do
    with {:ok, person_id} <- Helpers.decode_id(arguments["person_id"]),
         inputs = %{id: person_id},
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "full_name", :full_name, &Inputs.string(&1)),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "title", :title, &Inputs.string(&1)),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "timezone", :timezone, &Inputs.string(&1)),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "manager_id", :manager_id, &Helpers.decode_optional_id(&1)),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "description", :description, &Helpers.markdown_to_rich_text_nullable(&1)),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "notify_about_assignments", :notify_about_assignments, &Inputs.boolean(&1)),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "notify_on_mention", :notify_on_mention, &Inputs.boolean(&1)),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "send_daily_summary", :send_daily_summary, &Inputs.boolean(&1)),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "email_window_minutes", :email_window_minutes, &decode_preference(&1, @email_windows)),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "daily_summary_delivery_time", :daily_summary_delivery_time, &decode_preference(&1, @delivery_times)) do
      {:ok, inputs}
    end
  end

  defp decode_preference(value, allowed) do
    if value in allowed, do: {:ok, value}, else: {:error, :invalid_arguments}
  end
end
