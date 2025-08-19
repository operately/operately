defmodule Operately.Data.Change077EnhanceTaskDueDateUpdatingActivities do
  import Ecto.Query, only: [from: 2]
  alias Operately.Repo
  alias Operately.Activities.Activity
  alias Operately.Tasks.Task

  def run do
    from(a in Activity, where: a.action == "task_due_date_updating")
    |> Repo.all()
    |> Enum.each(fn activity ->
      task_id = activity.content["task_id"]

      task_name = case get_task(task_id) do
        nil -> nil
        task -> task.name
      end

      new_content = activity.content
      |> Map.put("task_name", task_name)

      {:ok, _updated} = update_activity(activity, new_content)
    end)
  end

  defp get_task(nil), do: nil
  defp get_task(task_id) do
    Repo.get(Task, task_id)
  end

  defp update_activity(activity, new_content) do
    activity
    |> Ecto.Changeset.change(%{content: new_content})
    |> Repo.update()
  end
end
