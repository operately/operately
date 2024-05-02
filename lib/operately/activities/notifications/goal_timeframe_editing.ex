defmodule Operately.Activities.Notifications.GoalTimeframeEditing do
  def dispatch(activity) do
    goal = Operately.Goals.get_goal!(activity.content["goal_id"])
    message = Operately.Repo.preload(activity, :comment_thread).comment_thread.message

    assigned = [
      goal.champion_id,
      goal.reviewer_id,
    ]

    mentioned = 
      message
      |> ProsemirrorMentions.extract_ids()
      |> Enum.map(fn id -> Operately.People.get_person!(id) end)

    people = Enum.uniq(assigned ++ mentioned)

    notifications = 
      people
      |> Enum.uniq()
      |> Enum.filter(fn person_id -> person_id != activity.author_id end)
      |> Enum.map(fn person_id -> 
        %{
          person_id: person_id,
          activity_id: activity.id,
          should_send_email: true,
        }
      end)

    Operately.Notifications.bulk_create(notifications)
  end
end
