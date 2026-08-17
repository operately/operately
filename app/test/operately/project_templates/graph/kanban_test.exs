defmodule Operately.ProjectTemplates.Graph.KanbanTest do
  use ExUnit.Case, async: true

  alias Operately.ProjectTemplates.Graph.{Copy, Kanban}
  alias Operately.Tasks.Status

  test "remap preserves columns and ordering with copied task and status paths" do
    {workflow, [not_started, done]} = workflow()

    tasks = [
      task("source1", "target1", not_started),
      task("source2", "target2", done),
      task("source3", "target3", done)
    ]

    state = %{
      not_started.id => ["Task-source1"],
      done.id => ["Task-source2"]
    }

    assert {:ok, remapped} = Kanban.remap(state, tasks, workflow, &source_path/1, &target_path/1, & &1.status)

    copied_not_started = Map.fetch!(workflow.copied_by_source_id, not_started.id)
    copied_done = Map.fetch!(workflow.copied_by_source_id, done.id)

    assert remapped[copied_not_started.id] == ["Task-target1"]
    assert remapped[copied_done.id] == ["Task-target2", "Task-target3"]
  end

  test "reset places every copied task in the first open status" do
    {workflow, [not_started, done]} = workflow()

    tasks = [
      task("source1", "target1", not_started),
      task("source2", "target2", done),
      task("source3", "target3", not_started)
    ]

    state = %{
      not_started.id => ["Task-source1"],
      done.id => ["Task-source2"]
    }

    assert {:ok, reset} = Kanban.reset(state, tasks, workflow, &source_path/1, &target_path/1, & &1.status)

    copied_done = Map.fetch!(workflow.copied_by_source_id, done.id)

    assert reset[workflow.first_open.id] == ["Task-target1", "Task-target2", "Task-target3"]
    assert reset[copied_done.id] == []
  end

  defp workflow do
    statuses = [
      %Status{id: "not-started", label: "Not started", color: :gray, index: 0},
      %Status{id: "done", label: "Done", color: :green, index: 1, closed: true}
    ]

    {:ok, workflow} = Copy.copy_workflow(statuses)
    {workflow, statuses}
  end

  defp task(source_id, target_id, status), do: %{source_id: source_id, target_id: target_id, status: status}
  defp source_path(task), do: "Task-#{task.source_id}"
  defp target_path(task), do: "Task-#{task.target_id}"
end
