defmodule Operately.Activities.Notifications.GoalTimeframeEditing do
  def dispatch(activity) do
    goal = Operately.Goals.get_goal!(activity.content["goal_id"])
    goal = Operately.Repo.preload(goal, [:champion, :reviewer])
    message = Operately.Repo.preload(activity, :comment_thread).comment_thread.message

    mentioned = Operately.RichContent.lookup_mentioned_people(message)
    assigned = [goal.champion, goal.reviewer]
    people = Enum.uniq_by(assigned ++ mentioned, & &1.id)

    notifications =
      people
      |> Enum.filter(fn p -> p.id != activity.author_id end)
      |> Enum.map(fn p ->
        %{
          person_id: p.id,
          activity_id: activity.id,
          should_send_email: true,
        }
      end)

    Operately.Notifications.bulk_create(notifications)
  end
end
