defmodule Operately.Activities.Notifications.TaskDescriptionChange do
  @moduledoc """
  Notifies the following people:
  - People subscribed to the task

  The author of the activity is excluded from notifications.
  """

  import Ecto.Query, only: [from: 2]

  require Logger
  alias Operately.Access.Binding
  alias Operately.Access.Context
  alias Operately.Activities.Notifications.MentionedPeople
  alias Operately.Repo
  alias Operately.Tasks.Notifications, as: TaskNotifications

  def dispatch(%{content: %{"task_id" => task_id, "description" => description}} = activity) do
    {:ok, task} = fetch_task(task_id)
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
    |> mentioned_people_with_access(task)
  end

  defp mentioned_people_with_access([], _task), do: []

  defp mentioned_people_with_access(person_ids, %{project_id: project_id}) when not is_nil(project_id) do
    mentioned_people_with_access(person_ids, project_id: project_id)
  end

  defp mentioned_people_with_access(person_ids, %{space_id: space_id}) when not is_nil(space_id) do
    mentioned_people_with_access(person_ids, group_id: space_id)
  end

  defp mentioned_people_with_access(person_ids, access_context) do
    from(c in Context,
      join: b in assoc(c, :bindings),
      join: g in assoc(b, :group),
      join: m in assoc(g, :memberships),
      join: p in assoc(m, :person),
      where: ^access_context,
      where: m.person_id in ^person_ids and is_nil(p.suspended_at) and b.access_level >= ^Binding.view_access(),
      select: m.person_id,
      distinct: true
    )
    |> Repo.all()
  end
end
