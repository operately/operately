defmodule Operately.WorkMaps.TaskCompletion do
  @moduledoc "Task completion policy shared with TurboUI ProjectPage/taskCompletion.ts."

  def calculate(tasks) do
    tracked_tasks = Enum.filter(tasks, &tracked?/1)
    total_count = length(tracked_tasks)

    if total_count > 0 do
      completed_count = Enum.count(tracked_tasks, &completed?/1)
      %{completed_count: completed_count, total_count: total_count, percentage: round(completed_count / total_count * 100)}
    end
  end

  defp tracked?(task) do
    not Map.get(task, :_is_helper_task, false) and not canceled?(task.task_status) and
      (completed?(task) or not match?(%{status: :done}, task.milestone))
  end

  defp canceled?(%{value: "canceled"}), do: true
  defp canceled?(%{closed: true, color: :red}), do: true
  defp canceled?(_), do: false

  defp completed?(%{task_status: %{value: value}}) when value in ["done", "completed"], do: true
  defp completed?(%{task_status: %{closed: true, color: :green}}), do: true
  defp completed?(_), do: false
end
