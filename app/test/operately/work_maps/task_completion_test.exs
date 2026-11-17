defmodule Operately.WorkMaps.TaskCompletionTest do
  use ExUnit.Case, async: true

  alias Operately.WorkMaps.TaskCompletion

  test "matches project page status and milestone counting rules" do
    tasks = [
      task(%{value: "done"}),
      task(%{value: "completed"}, :done),
      task(%{value: "shipped", closed: true, color: :green}),
      task(nil),
      task(%{value: "in_progress"}),
      task(%{value: "done"}, nil) |> Map.put(:archived_at, ~N[2026-01-01 00:00:00]),
      task(%{value: "canceled", closed: true, color: :green}),
      task(%{value: "done", closed: true, color: :red}),
      task(%{value: "in_progress"}, :done),
      task(%{value: "done"}) |> Map.put(:_is_helper_task, true)
    ]

    assert TaskCompletion.calculate(tasks) == %{completed_count: 4, total_count: 6, percentage: 67}
  end

  test "returns no statistics when there are no tracked tasks" do
    assert TaskCompletion.calculate([]) == nil
    assert TaskCompletion.calculate([task(%{value: "canceled"}), task(nil, :done)]) == nil
  end

  test "rounds task completion to the nearest integer" do
    assert TaskCompletion.calculate([task(%{value: "done"}), task(nil), task(nil)]) ==
             %{completed_count: 1, total_count: 3, percentage: 33}
  end

  defp task(status, milestone_status \\ nil) do
    %{task_status: status, milestone: if(milestone_status, do: %{status: milestone_status})}
  end
end
