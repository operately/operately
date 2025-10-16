defmodule Operately.Data.Change075EnhanceTaskDescriptionChangeActivities do
  import Ecto.Query, only: [from: 2]
  alias Operately.Repo
  alias Operately.Activities.Activity
  alias Operately.Tasks.Task
  alias Operately.Access.Context

  def run do
    from(a in Activity, where: a.action == "task_description_change")
    |> Repo.all()
    |> Enum.each(fn activity ->
      task_id = activity.content["task_id"]

      case get_task_with_associations(task_id) do
        nil ->
          # Task doesn't exist anymore, set empty values
          new_content =
            activity.content
            |> Map.put("task_name", "")
            |> Map.put("project_id", "")
            |> Map.put("project_name", "")

          {:ok, _updated} = update_activity(activity, new_content)

        task ->
          # Task exists, populate the fields
          project = get_associated_project(task)

          new_content =
            activity.content
            |> Map.put("task_name", task.name)
            |> Map.put("project_id", (project && project.id) || "")
            |> Map.put("project_name", (project && project.name) || "")

          # Also update the access_context_id if project exists
          if project do
            access_context = get_project_access_context(project.id)

            if access_context do
              update_activity_with_access_context(activity, new_content, access_context.id)
            else
              {:ok, _updated} = update_activity(activity, new_content)
            end
          else
            {:ok, _updated} = update_activity(activity, new_content)
          end
      end
    end)
  end

  defp get_task_with_associations(task_id) do
    case Repo.get(Task, task_id) do
      nil ->
        nil

      task ->
        task
        |> Repo.preload(milestone: [:project], project: [])
    end
  end

  defp get_project_access_context(project_id) do
    from(c in Context, where: c.project_id == ^project_id)
    |> Repo.one()
  end

  defp get_associated_project(task) do
    cond do
      task.project -> task.project
      task.milestone && task.milestone.project -> task.milestone.project
      # No project found through either relation
      true -> nil
    end
  end

  defp update_activity(activity, new_content) do
    activity
    |> Ecto.Changeset.change(%{content: new_content})
    |> Repo.update()
  end

  defp update_activity_with_access_context(activity, new_content, access_context_id) do
    activity
    |> Ecto.Changeset.change(%{
      content: new_content,
      access_context_id: access_context_id
    })
    |> Repo.update()
  end
end
