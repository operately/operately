defmodule Operately.Activities.Notifications.TaskAdding do
  @moduledoc """
  Notifies the following people:
  - Task assignees: People assigned to work on the task
  - Project champion: The champion responsible for the project the task belongs to

  The person who authored the activity is excluded from notifications.
  """

  alias Operately.Tasks.Task

  def dispatch(activity) do
    {:ok, task} =
      Task.get(:system,
        id: activity.content["task_id"],
        opts: [preload: [:assignees, project: :champion_contributor]]
      )

    champion_id =
      case task.project do
        %{champion_contributor: %{person_id: person_id}} -> person_id
        _ -> nil
      end

    task.assignees
    |> Enum.map(& &1.person_id)
    |> Enum.concat([champion_id])
    |> Enum.filter(& &1)
    |> Enum.uniq()
    |> Enum.reject(&(&1 == activity.author_id))
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
