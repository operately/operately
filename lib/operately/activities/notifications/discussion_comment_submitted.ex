defmodule Operately.Activities.Notifications.DiscussionCommentSubmitted do
  alias Operately.Messages.Notifications

  def dispatch(activity) do
    Notifications.get_subscribers(activity.content["discussion_id"], ignore: [activity.author_id])
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
