defmodule Operately.Activities.Notifications.ResourceHubDocumentCommented do
  alias Operately.ResourceHubs.Notifications

  def dispatch(activity) do
    recipients(activity)
    |> Enum.map(fn person_id ->
      %{
        person_id: person_id,
        activity_id: activity.id,
        should_send_email: true,
      }
    end)
    |> Operately.Notifications.bulk_create()
  end

  defp recipients(%{content: %{"inline_thread_id" => id}} = activity) when is_binary(id) do
    Operately.Comments.InlineThreadNotifications.recipients(activity)
  end

  defp recipients(activity) do
    Notifications.get_document_subscribers(activity.content["document_id"], ignore: [activity.author_id])
  end
end
