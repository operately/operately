defmodule Operately.Activities.Notifications.CommentAdded do
  alias Operately.Goals.Notifications

  def dispatch(activity) do
    goal_id = activity.content["goal_id"]
    comment_thread_id = activity.content["comment_thread_id"]

    Notifications.get_goal_thread_subscribers(nil, goal_id, ignore: [activity.author_id], comment_thread_id: comment_thread_id)
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
