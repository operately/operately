defmodule Operately.Activities.Notifications.SpaceTaskCommented do
  @moduledoc """
  Notifies the following people:
  - Task creator: The person who originally created the task
  - Task assignees: All people assigned to the task
  - Subscribers: People who were mentioned or subscribed to notifications for this task

  The person who authored the comment is excluded from notifications.
  """

  alias Operately.Tasks.Task

  def dispatch(activity) do
    task_id = activity.content["task_id"]
    {:ok, task} = Task.get(:system, id: task_id, opts: [preload: :assignees])

    subscriber_ids = Operately.Tasks.Notifications.get_subscribers(task)

    person_ids = [task.creator_id | Enum.map(task.assignees, fn a -> a.person_id end)]

    subscriber_ids ++ person_ids
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
