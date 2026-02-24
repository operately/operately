defmodule Operately.Activities.Notifications.TaskMoving do
  @moduledoc """
  Notifies task subscribers when a task changes destination.

  The activity author is excluded from notifications.
  """

  alias Operately.Tasks.Task

  def dispatch(activity) do
    {:ok, task} = Task.get(:system, id: activity.content["task_id"])

    task
    |> Operately.Tasks.Notifications.get_subscribers(ignore: [activity.author_id])
    |> Enum.uniq()
    |> Enum.reject(&is_nil/1)
    |> Enum.map(fn person_id ->
      %{
        person_id: person_id,
        activity_id: activity.id,
        should_send_email: true
      }
    end)
    |> Operately.Notifications.bulk_create()
  end
end
