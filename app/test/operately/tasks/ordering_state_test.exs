defmodule Operately.Tasks.OrderingStateTest do
  use ExUnit.Case, async: true

  alias Operately.Tasks.OrderingState

  test "move_id inserts the id at the requested index" do
    assert OrderingState.move_id(["a", "b", "c"], "a", 2) == {:ok, ["b", "c", "a"]}
  end

  test "move_id clamps indexes beyond the list length" do
    assert OrderingState.move_id(["a", "b"], "a", 100) == {:ok, ["b", "a"]}
  end

  test "move_id inserts a missing id" do
    assert OrderingState.move_id(["b"], "a", 0) == {:ok, ["a", "b"]}
  end

  test "rejects a negative index" do
    assert OrderingState.move_id(["a", "b"], "a", -1) == {:error, {:validation, "Task index must be zero or greater"}}
  end
end
