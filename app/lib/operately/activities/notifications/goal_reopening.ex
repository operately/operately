defmodule Operately.Activities.Notifications.GoalReopening do
  def dispatch(activity) do
    goal_id = activity.content["goal_id"]
    goal = Operately.Goals.get_goal!(goal_id)
    goal = Operately.Repo.preload(goal, [:champion, :reviewer])
    comment_thread = Operately.Comments.get_thread!(activity.comment_thread_id)

    mentioned = Operately.RichContent.lookup_mentioned_people(comment_thread.message)
    assigned = [goal.champion, goal.reviewer]
    all = mentioned ++ assigned

    all
    |> Enum.uniq_by(& &1.id)
    |> Enum.filter(fn p -> p.id != activity.author_id end)
    |> Enum.map(fn person -> %{person_id: person.id, activity_id: activity.id, should_send_email: true} end)
    |> Operately.Notifications.bulk_create()
  end
end
