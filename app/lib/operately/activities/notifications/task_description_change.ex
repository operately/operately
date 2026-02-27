defmodule Operately.Activities.Notifications.TaskDescriptionChange do
  @moduledoc """
  Notifies the following people:
  - People subscribed to the task

  The author of the activity is excluded from notifications.
  """

  require Logger
  alias Operately.Tasks.Notifications

  def dispatch(activity) do
    {:ok, task} = fetch_task(activity.content["task_id"])
    task_subscribers = Notifications.get_subscribers(task, ignore: [activity.author_id])

    task_subscribers
    |> Enum.uniq()
    |> Enum.map(fn person_id ->
      %{
        person_id: person_id,
        activity_id: activity.id,
        should_send_email: true
      }
    end)
    |> Operately.Notifications.bulk_create()
  end

  defp fetch_task(task_id) do
    case Operately.Tasks.Task.get(:system, id: task_id) do
      {:ok, task} ->
        {:ok, task}

      {:error, reason} ->
        Logger.warning(
          "Unable to load task #{task_id} for description change notifications: #{inspect(reason)}"
        )

        {:error, reason}
    end
  end
end
