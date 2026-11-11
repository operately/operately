defmodule Operately.Operations.TaskBoardRenaming do
  alias Ecto.Multi
  alias Operately.{Activities, Repo}
  alias Operately.Groups.Group
  alias Operately.Repo.Locking
  alias Operately.Tasks.TaskBoard

  def run(author, board, name) do
    Multi.new()
    |> Multi.run(:space, fn repo, _ -> Locking.lock_for_update(repo, %Group{id: board.space_id}) end)
    |> Multi.run(:locked_board, fn repo, _ -> Locking.lock_for_update(repo, board) end)
    |> Multi.run(:writable, fn _, %{locked_board: board} ->
      with :ok <- TaskBoard.check_writable(board), do: {:ok, :allowed}
    end)
    |> Multi.merge(fn %{space: space, locked_board: current} -> rename(author, space, current, String.trim(name)) end)
    |> Repo.transaction()
    |> case do
      {:ok, %{board: board}} -> {:ok, board}
      {:error, _step, reason, _changes} -> {:error, reason}
    end
  end

  defp rename(author, space, board, name) do
    changeset = TaskBoard.changeset(board, %{name: name})

    if changeset.valid? and name == board.name do
      Multi.put(Multi.new(), :board, board)
    else
      Multi.new()
      |> Multi.update(:board, changeset)
      |> Activities.insert_sync(author.id, :task_board_renamed, fn %{board: updated} ->
        %{company_id: space.company_id, space_id: space.id, board_id: board.id, old_name: board.name, new_name: updated.name}
      end)
    end
  end
end
