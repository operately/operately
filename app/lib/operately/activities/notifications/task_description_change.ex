defmodule Operately.Activities.Notifications.TaskDescriptionChange do
  @moduledoc """
  Notifies the following people:
  - People subscribed to the task

  The author of the activity is excluded from notifications.
  """

  require Logger
  alias Operately.Access.Binding
  alias Operately.Activities.Notifications.MentionedPeople
  alias Operately.Tasks.Notifications, as: TaskNotifications

  def dispatch(activity) do
    {:ok, task} = fetch_task(activity.content["task_id"])
    description = activity.content["description"]
    task_subscribers = TaskNotifications.get_subscribers(task, ignore: [activity.author_id])
    mentioned_people = mentioned_people_with_access(task, description, activity.author_id)

    (task_subscribers ++ mentioned_people)
    |> MentionedPeople.reject_stale_mentioned_subscribers(task.subscription_list_id, description)
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

  defp mentioned_people_with_access(task, description, author_id) do
    description
    |> MentionedPeople.ids()
    |> Enum.reject(&(&1 == author_id))
    |> Enum.filter(&has_view_access?(task, &1))
  end

  defp has_view_access?(task, person_id) do
    case Operately.Notifications.get_subscription_list_access_level(task.subscription_list_id, task_parent_type(task), person_id) do
      {:ok, access_level} when is_integer(access_level) -> access_level >= Binding.view_access()
      _ -> false
    end
  end

  defp task_parent_type(%{project_id: project_id}) when not is_nil(project_id), do: :project_task
  defp task_parent_type(_task), do: :space_task
end
