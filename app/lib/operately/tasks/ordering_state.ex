defmodule Operately.Tasks.OrderingState do
  @moduledoc """
  Manages the ordering of tasks within a milestone using a simple list of task IDs.
  This is a simplified version of KanbanState that only tracks order, not status.
  """

  def load(nil), do: initialize()
  def load(list) when is_list(list), do: list
  def load(_), do: initialize()

  def initialize do
    []
  end

  def add_task(ordering_state, task_id, index \\ 0) do
    # Remove task if it already exists to avoid duplicates
    ordering_state = remove_task(ordering_state, task_id)
    # Insert at the specified index
    List.insert_at(ordering_state, index, task_id)
  end

  def remove_task(ordering_state, task_id) do
    List.delete(ordering_state, task_id)
  end

  def move_task(ordering_state, task_id, new_index) do
    ordering_state
    |> remove_task(task_id)
    |> List.insert_at(new_index, task_id)
  end

  def get_task_index(ordering_state, task_id) do
    Enum.find_index(ordering_state, &(&1 == task_id))
  end

  def contains_task?(ordering_state, task_id) do
    task_id in ordering_state
  end
end
