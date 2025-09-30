defmodule Operately.Activities.Notifications.TaskAssigneeUpdating do
  def dispatch(activity) do
    old_assignee_id = activity.content["old_assignee_id"]
    new_assignee_id = activity.content["new_assignee_id"]

    [old_assignee_id, new_assignee_id]
    |> Enum.uniq_by(& &1)
    |> Enum.filter(fn id -> id != nil end)
    |> Enum.filter(fn id -> id != activity.author_id end)
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
