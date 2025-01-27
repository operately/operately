defmodule Operately.Activities.Notifications.GoalReparent do
  def dispatch(activity) do
    goal_id = activity.content["goal_id"]
    goal = Operately.Goals.get_goal!(goal_id)

    people = [goal.champion_id, goal.reviewer_id]

    people
    |> Enum.filter(fn id -> id != nil end)
    |> Enum.filter(fn id -> id != goal.creator_id end)
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
