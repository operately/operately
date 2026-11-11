defmodule Operately.Tasks.BoardSync do
  @moduledoc "Locks writable boards before tasks and updates ordering using those locked boards."
  import Ecto.Query
  alias Operately.Repo
  alias Operately.Tasks.{Task, TaskBoard, KanbanState}

  def lock_boards(ids) do
    ids = ids |> Enum.reject(&is_nil/1) |> Enum.uniq() |> Enum.sort()
    boards = Repo.all(from b in TaskBoard, where: b.id in ^ids, order_by: b.id, lock: "FOR UPDATE")

    with true <- length(boards) == length(ids),
         :ok <- check_writable(boards) do
      {:ok, Map.new(boards, &{&1.id, &1})}
    else
      false -> {:error, :not_found}
      error -> error
    end
  end

  defp check_writable(boards) do
    case Enum.find(boards, & &1.archived_at) do
      nil -> :ok
      _board -> TaskBoard.archived_error()
    end
  end

  def lock_task(task) do
    with {:ok, boards} <- lock_boards([task.board_id]) do
      lock_task(task, boards)
    end
  end

  # Authorize first, then lock boards. Reject a task that moved since authorization.
  def lock_task(task, boards) do
    with current when not is_nil(current) <- Repo.one(from t in Task, where: t.id == ^task.id, lock: "FOR UPDATE"),
         true <- {current.space_id, current.project_id, current.board_id} == {task.space_id, task.project_id, task.board_id},
         true <- valid_board?(current, boards) do
      {:ok, Operately.Repo.Locking.restore_loaded_associations(current, task)}
    else
      _ -> {:error, :not_found}
    end
  end

  defp valid_board?(%{space_id: nil, board_id: nil}, _boards), do: true

  defp valid_board?(task, boards) do
    case boards[task.board_id] do
      %TaskBoard{space_id: space_id} -> space_id == task.space_id and is_nil(task.project_id)
      _ -> false
    end
  end

  def add_task(nil, %{space_id: nil}), do: {:ok, nil}
  def add_task(nil, _task), do: {:error, :bad_request}

  def add_task(board, task) do
    update_ordering(board, KanbanState.append(board.tasks_kanban_state || %{}, task))
  end

  def remove_task(nil, %{space_id: nil}), do: {:ok, nil}
  def remove_task(nil, _task), do: {:error, :bad_request}

  def remove_task(board, task) do
    update_ordering(board, KanbanState.remove(board.tasks_kanban_state || %{}, task))
  end

  defp update_ordering(board, state) do
    board |> TaskBoard.changeset(%{tasks_kanban_state: state}) |> Repo.update()
  end
end
