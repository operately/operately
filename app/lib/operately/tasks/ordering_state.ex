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

  @doc """
  Moves `id` to `index` in an already-encoded ID list.

  The id is removed if present, then inserted at `index`, clamped to the end of
  the remaining list. Used by project and template list-reorder operations; the
  client sends `{task_id, milestone_id, index}` and the server applies this to
  `tasks_ordering_state`.

  Returns `{:ok, ids}` or `{:error, {:validation, message}}` when `index` is negative.
  """
  def move_id(ids, id, index) when is_list(ids) and is_binary(id) and is_integer(index) and index >= 0 do
    remaining_ids = Enum.reject(ids, &(&1 == id))
    destination_index = min(index, length(remaining_ids))
    {:ok, List.insert_at(remaining_ids, destination_index, id)}
  end

  def move_id(_ids, _id, _index), do: {:error, {:validation, "Task index must be zero or greater"}}

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
