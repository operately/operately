defmodule Operately.Activities.Notifications.ResourceHubDocumentEdited do
  alias Operately.Activities.Notifications.MentionedPeople
  alias Operately.ResourceHubs.{Document, Notifications}

  def dispatch(activity) do
    document_id = activity.content["document_id"]
    {:ok, document} = Document.get(:system, id: document_id)
    content = activity.content["content"] || document.content

    Notifications.get_document_subscribers(document_id, ignore: [activity.author_id])
    |> MentionedPeople.only_current_mentions(content)
    |> Enum.map(fn person_id ->
      %{
        person_id: person_id,
        activity_id: activity.id,
        should_send_email: true
      }
    end)
    |> Operately.Notifications.bulk_create()
  end
end
