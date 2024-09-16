defmodule Operately.Activities.Notifications.GoalCheckInCommented do
  alias Operately.Goals.Notifications

  def dispatch(activity) do
    Notifications.get_goal_update_subscribers(activity.content["goal_check_in_id"], ignore: [activity.author_id])
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
