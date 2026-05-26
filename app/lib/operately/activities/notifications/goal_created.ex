defmodule Operately.Activities.Notifications.GoalCreated do
  alias Operately.RichContent

  def dispatch(activity) do
    goal_id = activity.content["goal_id"]
    goal = Operately.Goals.get_goal!(goal_id)

    mentioned_ids = RichContent.find_mentioned_ids(goal.description, :decode_ids)
    people = [goal.champion_id, goal.reviewer_id | mentioned_ids]

    people
    |> Enum.filter(fn id -> id != nil end)
    |> Enum.filter(fn id -> id != goal.creator_id end)
    |> Enum.uniq()
    |> Enum.map(fn id ->
      %{
        person_id: id,
        activity_id: activity.id,
        should_send_email: true
      }
    end)
    |> Operately.Notifications.bulk_create()
  end
end
