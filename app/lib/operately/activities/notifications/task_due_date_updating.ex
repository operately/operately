defmodule Operately.Activities.Notifications.TaskDueDateUpdating do
  @moduledoc """
  Notifies the following people:
  - Task assignees: People assigned to work on the task

  The person who authored the comment is excluded from notifications.
  """

  alias Operately.Tasks.Task

  def dispatch(activity) do
    task_id = activity.content["task_id"]
    {:ok, task} = Task.get(:system, id: task_id, opts: [preload: :assignees])

    task.assignees
    |> Enum.map(fn a -> a.person_id end)
    |> Enum.uniq_by(& &1)
    |> Enum.filter(fn id -> id != nil end)
    |> Enum.filter(fn id -> id != activity.author_id end)
    |> Enum.map(fn id ->
      %{
        person_id: id,
        activity_id: activity.id,
        should_send_email: true
      }
    end)
    |> Operately.Notifications.bulk_create()
  end
end
