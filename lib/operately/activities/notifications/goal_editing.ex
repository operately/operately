defmodule Operately.Activities.Notifications.GoalEditing do
  def dispatch(activity) do
    people = [
      activity.content.old_champion_id,
      activity.content.new_champion_id,
      activity.content.old_reviewer_id,
      activity.content.new_reviewer_id,
    ]

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
