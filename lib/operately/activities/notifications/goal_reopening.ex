defmodule Operately.Activities.Notifications.GoalReopening do
  def dispatch(activity) do
    goal_id = activity.content["goal_id"]
    goal = Operately.Goals.get_goal!(goal_id)
    comment_thread = Operately.Comments.get_thread!(activity.comment_thread_id)

    from_message = ProsemirrorMentions.extract_ids(comment_thread.message)
    assigned = [goal.champion_id, goal.reviewer_id]
    all = from_message ++ assigned

    all
    |> Enum.uniq()
    |> Enum.filter(fn id -> id != activity.author_id end)
    |> Enum.map(fn id -> Operately.People.get_person!(id) end)
    |> Enum.map(fn person -> %{person_id: person.id, activity_id: activity.id, should_send_email: true} end)
    |> Operately.Notifications.bulk_create()
  end
end
