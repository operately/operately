defmodule Operately.Tasks.OrderingState do
  @moduledoc """
  Manages the ordering of tasks within a milestone using a simple list of short task IDs.
  """

  def load(nil), do: initialize()
  def load(list) when is_list(list), do: list
  def load(_), do: initialize()

  def initialize do
    []
  end

  def add_task(ordering_state, task, index \\ nil) do
    task_short_id = OperatelyWeb.Paths.task_id(task)

    # Remove task if it already exists to avoid duplicates
    ordering_state = List.delete(ordering_state, task_short_id)

    # Insert at the specified index, or at the end if no index provided
    case index do
      nil -> ordering_state ++ [task_short_id]
      idx -> List.insert_at(ordering_state, idx, task_short_id)
    end
  end

  def remove_task(ordering_state, task) do
    task_short_id = OperatelyWeb.Paths.task_id(task)
    List.delete(ordering_state, task_short_id)
  end
end
