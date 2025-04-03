defmodule Operately.Activities.Notifications.ResourceHubLinkDeleted do
  alias Operately.ResourceHubs.Notifications

  def dispatch(activity) do
    Notifications.get_link_subscribers(activity.content["link_id"], ignore: [activity.author_id], with_deleted: true)
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
