defmodule Operately.Activities.Notifications.ProjectDiscussionSubmitted do
  @moduledoc """
  Notifies the following people:
  - Project subscribers: People subscribed to notifications for the project

  The person who authored the activity is excluded from notifications.
  """

  alias Operately.Projects.Notifications

  def dispatch(activity) do
    subscriber_ids = Notifications.get_discussion_subscribers(
      activity.content["discussion_id"],
      ignore: [activity.author_id]
    )

    subscriber_ids
    |> Enum.uniq_by(& &1)
    |> Enum.filter(fn id -> id != nil end)
    |> Enum.filter(fn id -> id != activity.author_id end)
    |> Enum.map(fn id ->
      %{
        person_id: id,
        activity_id: activity.id,
        should_send_email: true,
      }
    end)
    |> Operately.Notifications.bulk_create()
  end
end
