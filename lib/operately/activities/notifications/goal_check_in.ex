defmodule Operately.Activities.Notifications.GoalCheckIn do
  alias Operately.Goals.Update

  def dispatch(activity) do
    goal_id = activity.content["goal_id"]
    update_id = activity.content["update_id"]

    goal = Operately.Goals.get_goal!(goal_id)
    goal = Operately.Repo.preload(goal, [:champion, :reviewer])

    {:ok, update} = Update.get(:system, id: update_id)

    people = (
      Operately.RichContent.lookup_mentioned_people(update.message)
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
