defmodule Operately.Tasks.OrderingState do
  @moduledoc """
  Manages the ordering of tasks within a milestone using a simple list of short task IDs.
  This is a simplified version of KanbanState that only tracks order, not status.
  """

  def load(nil), do: initialize()
  def load(list) when is_list(list), do: list
  def load(_), do: initialize()

  def initialize do
    []
  end

  def add_task(ordering_state, task, index \\ 0) do
    task_short_id = OperatelyWeb.Paths.task_id(task)

    # Remove task if it already exists to avoid duplicates
    ordering_state = remove_task(ordering_state, task)

    # Insert at the specified index
    List.insert_at(ordering_state, index, task_short_id)
  end

  def remove_task(ordering_state, task) do
    task_short_id = OperatelyWeb.Paths.task_id(task)
    List.delete(ordering_state, task_short_id)
  end

  def move_task(ordering_state, task, new_index) do
    task_short_id = OperatelyWeb.Paths.task_id(task)
    ordering_state
    |> List.delete(task_short_id)
    |> List.insert_at(new_index, task_short_id)
  end

  def get_task_index(ordering_state, task) do
    task_short_id = OperatelyWeb.Paths.task_id(task)
    Enum.find_index(ordering_state, &(&1 == task_short_id))
  end

  def contains_task?(ordering_state, task) do
    task_short_id = OperatelyWeb.Paths.task_id(task)
    task_short_id in ordering_state
  end
end
