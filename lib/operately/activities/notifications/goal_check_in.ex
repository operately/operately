defmodule Operately.Activities.Notifications.GoalCheckIn do
  def dispatch(activity) do
    goal_id = activity.content["goal_id"]
    check_in_id = activity.content["update_id"]

    goal = Operately.Goals.get_goal!(goal_id)
    check_in = Operately.Updates.get_update!(check_in_id)

    people = (ProsemirrorMentions.extract_ids(check_in.content["message"]) ++ [goal.champion_id, goal.reviewer_id])
      |> Enum.uniq()
      |> Enum.filter(fn id -> id != activity.author_id end)
      |> Enum.map(fn id -> Operately.People.get_person!(id) end)

    notifications = Enum.map(people, fn person ->
      %{
        person_id: person.id,
        activity_id: activity.id,
        should_send_email: true,
      }
    end)

    notifications = Enum.filter(notifications, fn n -> n.person_id != activity.author_id end)

    Operately.Notifications.bulk_create(notifications)
  end
end
