defmodule Operately.Data.Change074AddNameToTaskStatusUpdatingActivity do
  import Ecto.Query, only: [from: 2]
  alias Operately.Repo
  alias Operately.Activities.Activity
  alias Operately.Tasks.Task

  def run do
    from(a in Activity, where: a.action == "task_status_updating")
    |> Repo.all()
    |> Enum.each(fn activity ->
      task_id = activity.content["task_id"]

      task_name =
        case get_task_name(task_id) do
          # Task doesn't exist anymore
          nil -> ""
          name -> name
        end

      new_content = Map.put(activity.content, "name", task_name)

      {:ok, _updated} = update_activity(activity, new_content)
    end)
  end

  defp get_task_name(task_id) do
    case Repo.get(Task, task_id) do
      nil -> nil
      task -> task.name
    end
  end

  defp update_activity(activity, new_content) do
    activity
    |> Ecto.Changeset.change(%{content: new_content})
    |> Repo.update()
  end
end
