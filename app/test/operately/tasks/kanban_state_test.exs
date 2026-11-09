defmodule Operately.Tasks.KanbanStateTest do
  use ExUnit.Case, async: true

  alias Operately.Tasks.KanbanState

  @default_kanban_state %{"done" => [], "in_progress" => [], "pending" => [], "canceled" => []}

  test "load" do
    assert KanbanState.load(nil) == @default_kanban_state
    assert KanbanState.load(@default_kanban_state) == @default_kanban_state
  end

  test "initialize" do
    assert KanbanState.initialize() == @default_kanban_state
  end

  test "initialize with dynamic statuses" do
    statuses = ["pending", "in_progress", "review", "done"]
    assert KanbanState.initialize(statuses) == %{
             "pending" => [],
             "in_progress" => [],
             "review" => [],
             "done" => []
           }
  end

  test "add" do
    s = KanbanState.initialize()

    task1 = %Operately.Tasks.Task{id: Ecto.UUID.generate(), name: "Task 1"}
    task2 = %Operately.Tasks.Task{id: Ecto.UUID.generate(), name: "Task 2"}
    task3 = %Operately.Tasks.Task{id: Ecto.UUID.generate(), name: "Task 3"}

    s = KanbanState.add(s, task1, "pending", 0)
    assert s["pending"] == [OperatelyWeb.Paths.task_id(task1)]

    s = KanbanState.add(s, task2, "pending", 0)
    assert s["pending"] == [OperatelyWeb.Paths.task_id(task2), OperatelyWeb.Paths.task_id(task1)]

    s = KanbanState.add(s, task3, "pending", 1)
    assert s["pending"] == [OperatelyWeb.Paths.task_id(task2), OperatelyWeb.Paths.task_id(task3), OperatelyWeb.Paths.task_id(task1)]
  end

  test "load normalizes todo to pending" do
    legacy = %{"todo" => [1], "done" => [], "in_progress" => []}
    loaded = KanbanState.load(legacy)

    assert loaded["todo"] == [1]
  end

  test "append and remove identify renamed tasks without disturbing other tasks" do
    task = %Operately.Tasks.Task{id: Ecto.UUID.generate(), name: "Original name"}
    other = %Operately.Tasks.Task{id: Ecto.UUID.generate(), name: "Other task"}
    old_id = OperatelyWeb.Paths.task_id(task)
    other_id = OperatelyWeb.Paths.task_id(other)
    state = %{"pending" => [other_id, old_id], "done" => [old_id]}
    task = %{task | name: "Renamed task", task_status: %Operately.Tasks.Status{value: "done"}}

    assert KanbanState.remove(state, task) == %{"pending" => [other_id], "done" => []}
    assert KanbanState.append(state, task) == %{"pending" => [other_id], "done" => [OperatelyWeb.Paths.task_id(task)]}
  end
end
