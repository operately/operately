defmodule Operately.Activities.Notifications.GoalCheckIn do
  def dispatch(activity) do
    goal_id = activity.content["goal_id"]
    check_in_id = activity.content["update_id"]

    goal = Operately.Goals.get_goal!(goal_id)
    goal = Operately.Repo.preload(goal, [:champion, :reviewer])

    check_in = Operately.Updates.get_update!(check_in_id)
    message = check_in.content["message"]

    people = (
      Operately.RichContent.lookup_mentioned_people(message)
      ++ [goal.champion]
      ++ [goal.reviewer]
    ) |> Enum.uniq_by(& &1.id)

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
