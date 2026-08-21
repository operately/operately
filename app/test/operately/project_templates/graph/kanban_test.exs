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
      Copy.status_key(not_started) => ["Task-source1"],
      Copy.status_key(done) => ["Task-source2"]
    }

    assert {:ok, remapped} = Kanban.remap(state, tasks, workflow, &source_path/1, &target_path/1, & &1.status)

    copied_not_started = Map.fetch!(workflow.copied_by_source_id, not_started.id)
    copied_done = Map.fetch!(workflow.copied_by_source_id, done.id)

    assert remapped[Copy.status_key(copied_not_started)] == ["Task-target1"]
    assert remapped[Copy.status_key(copied_done)] == ["Task-target2", "Task-target3"]
  end

  test "remap drops foreign task ids and unknown status keys" do
    {workflow, [not_started, done]} = workflow()
    tasks = [task("source1", "target1", not_started)]

    state = %{
      Copy.status_key(not_started) => ["Task-source1", "Task-foreign"],
      "unknown-status" => ["Task-whatever"],
      Copy.status_key(done) => ["Task-also-foreign"]
    }

    assert {:ok, remapped} = Kanban.remap(state, tasks, workflow, &source_path/1, &target_path/1, & &1.status)

    copied_not_started = Map.fetch!(workflow.copied_by_source_id, not_started.id)
    copied_done = Map.fetch!(workflow.copied_by_source_id, done.id)

    assert remapped[Copy.status_key(copied_not_started)] == ["Task-target1"]
    assert remapped[Copy.status_key(copied_done)] == []
    refute Map.has_key?(remapped, "unknown-status")
  end

  test "remap appends missing tasks into their status column" do
    {workflow, [not_started, done]} = workflow()

    tasks = [
      task("source1", "target1", not_started),
      task("source2", "target2", done)
    ]

    assert {:ok, remapped} = Kanban.remap(%{}, tasks, workflow, &source_path/1, &target_path/1, & &1.status)

    copied_not_started = Map.fetch!(workflow.copied_by_source_id, not_started.id)
    copied_done = Map.fetch!(workflow.copied_by_source_id, done.id)

    assert remapped[Copy.status_key(copied_not_started)] == ["Task-target1"]
    assert remapped[Copy.status_key(copied_done)] == ["Task-target2"]
  end

  test "remap treats malformed non-map state as empty" do
    {workflow, [not_started, _done]} = workflow()
    tasks = [task("source1", "target1", not_started)]

    assert {:ok, remapped} = Kanban.remap("not-a-map", tasks, workflow, &source_path/1, &target_path/1, & &1.status)

    copied_not_started = Map.fetch!(workflow.copied_by_source_id, not_started.id)
    assert remapped[Copy.status_key(copied_not_started)] == ["Task-target1"]
  end

  defp workflow do
    statuses = [
      %Status{id: "not-started", label: "Not started", color: :gray, index: 0, value: "not_started"},
      %Status{id: "done", label: "Done", color: :green, index: 1, value: "done", closed: true}
    ]

    {:ok, workflow} = Copy.copy_workflow(statuses)
    {workflow, statuses}
  end

  defp task(source_id, target_id, status), do: %{source_id: source_id, target_id: target_id, status: status}
  defp source_path(task), do: "Task-#{task.source_id}"
  defp target_path(task), do: "Task-#{task.target_id}"
end
