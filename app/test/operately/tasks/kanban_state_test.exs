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

  test "remove" do
    s = KanbanState.initialize()

    task1 = %Operately.Tasks.Task{id: Ecto.UUID.generate(), name: "Task 1"}
    task2 = %Operately.Tasks.Task{id: Ecto.UUID.generate(), name: "Task 2"}
    task3 = %Operately.Tasks.Task{id: Ecto.UUID.generate(), name: "Task 3"}

    s = KanbanState.add(s, task1, "pending", 0)
    s = KanbanState.add(s, task2, "pending", 0)
    s = KanbanState.add(s, task3, "pending", 0)

    assert s["pending"] == [
             OperatelyWeb.Paths.task_id(task3),
             OperatelyWeb.Paths.task_id(task2),
             OperatelyWeb.Paths.task_id(task1)
           ]

    s = KanbanState.remove(s, task2, "pending")

    assert s["pending"] == [OperatelyWeb.Paths.task_id(task3), OperatelyWeb.Paths.task_id(task1)]
  end

  test "move moves task between columns and clamps index" do
    task1 = %Operately.Tasks.Task{id: Ecto.UUID.generate(), name: "Task 1"}
    task2 = %Operately.Tasks.Task{id: Ecto.UUID.generate(), name: "Task 2"}
    task3 = %Operately.Tasks.Task{id: Ecto.UUID.generate(), name: "Task 3"}

    id1 = OperatelyWeb.Paths.task_id(task1)
    id2 = OperatelyWeb.Paths.task_id(task2)
    id3 = OperatelyWeb.Paths.task_id(task3)

    s = %{
      "pending" => [id1, id2, id3],
      "in_progress" => [],
      "done" => [],
      "canceled" => []
    }

    s = KanbanState.move(s, task2, "pending", 1, "in_progress", 5)

    assert s["pending"] == [id1, id3]
    assert s["in_progress"] == [id2]
  end

  test "load normalizes todo to pending" do
    legacy = %{"todo" => [1], "done" => [], "in_progress" => []}
    loaded = KanbanState.load(legacy)

    assert loaded["todo"] == [1]
  end
end
