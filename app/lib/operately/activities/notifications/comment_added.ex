defmodule Operately.Activities.Notifications.CommentAdded do
  alias Operately.Goals.Notifications

  def dispatch(activity) do
    get_subscribers(activity)
    |> Enum.map(fn person_id ->
      %{
        person_id: person_id,
        activity_id: activity.id,
        should_send_email: true
      }
    end)
    |> Operately.Notifications.bulk_create()
  end

  defp get_subscribers(activity) do
    cond do
      activity.content["goal_id"] -> get_goal_subscribers(activity)
      activity.content["project_id"] -> get_project_subscribers(activity)
      true -> raise "Unknown activity type"
    end
  end

  defp get_goal_subscribers(activity) do
    goal_id = activity.content["goal_id"]
    comment_thread_id = activity.content["comment_thread_id"]

    Notifications.get_goal_thread_subscribers(nil, goal_id, ignore: [activity.author_id], comment_thread_id: comment_thread_id)
  end

  defp get_project_subscribers(activity) do
    Operately.Projects.Notifications.get_discussion_subscribers(
      activity.content["comment_thread_id"],
      ignore: [activity.author_id]
    )
  end
end
