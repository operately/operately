defmodule Operately.Activities.Notifications.GoalReopening do
  alias Operately.Goals.Notifications

  def dispatch(activity) do
    goal_id = activity.content["goal_id"]

    Notifications.get_goal_thread_subscribers(activity.id, goal_id, ignore: [activity.author_id])
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
