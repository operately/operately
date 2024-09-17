defmodule Operately.Activities.Notifications.GoalCheckIn do
  alias Operately.Goals.Notifications

  def dispatch(activity) do
    Notifications.get_goal_update_subscribers(activity.content["update_id"], ignore: [activity.author_id])
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
