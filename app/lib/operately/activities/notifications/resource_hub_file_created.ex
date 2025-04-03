defmodule Operately.Activities.Notifications.ResourceHubFileCreated do
  alias Operately.ResourceHubs.Notifications

  def dispatch(activity) do
    # When several files are created in a single operation, their
    # subscriptions are the same, that's why a single file can be
    # used for querying the subscribers
    file_id = hd(activity.content["files"])["file_id"]

    Notifications.get_file_subscribers(file_id, ignore: [activity.author_id])
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
