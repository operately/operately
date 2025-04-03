defmodule Operately.Tasks.KanbanStateTest do
  use ExUnit.Case, async: true

  alias Operately.Tasks.KanbanState

  @default_kanban_state %{"done" => [], "in_progress" => [], "todo" => []}

  test "load" do
    assert KanbanState.load(nil) == @default_kanban_state
    assert KanbanState.load(@default_kanban_state) == @default_kanban_state
  end

  test "initialize" do
    assert KanbanState.initialize() == @default_kanban_state
  end

  test "add_todo" do
    state = KanbanState.initialize()

    assert KanbanState.add_todo(state, 1) == %{"done" => [], "in_progress" => [], "todo" => [1]}
  end

  test "add" do
    s = KanbanState.initialize()

    s = KanbanState.add(s, 1, "todo", 0)
    assert s == %{"done" => [], "in_progress" => [], "todo" => [1]}

    s = KanbanState.add(s, 2, "todo", 0)
    assert s == %{"done" => [], "in_progress" => [], "todo" => [2, 1]}

    s = KanbanState.add(s, 3, "todo", 1)
    assert s == %{"done" => [], "in_progress" => [], "todo" => [2, 3, 1]}
  end

  test "remove" do
    s = KanbanState.initialize()

    s = KanbanState.add(s, 1, "todo", 0)
    s = KanbanState.add(s, 2, "todo", 0)
    s = KanbanState.add(s, 3, "todo", 0)

    assert s == %{"done" => [], "in_progress" => [], "todo" => [3, 2, 1]}

    s = KanbanState.remove(s, 2, "todo")

    assert s == %{"done" => [], "in_progress" => [], "todo" => [3, 1]}
  end
end
