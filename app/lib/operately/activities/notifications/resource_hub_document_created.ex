defmodule Operately.Activities.Notifications.ResourceHubDocumentCreated do
  alias Operately.ResourceHubs.Notifications

  def dispatch(activity) do
    Notifications.get_document_subscribers(activity.content["document_id"], ignore: [activity.author_id])
    |> Enum.map(fn person_id ->
      %{
        person_id: person_id,
        activity_id: activity.id,
        should_send_email: true,
      }
    end)
    |> Operately.Notifications.bulk_create()
  end
end
