defmodule Operately.Operations.TaskBoardArchiving do
  import Ecto.Query
  alias Ecto.Multi
  alias Operately.{Activities, Repo}
  alias Operately.Groups.Group
  alias Operately.Repo.Locking

  def run(author, space, board) do
    Multi.new()
    |> Multi.run(:space, fn repo, _ ->
      # Do not block space foreign-key checks by task writers holding a board lock.
      case repo.one(from s in Group, where: s.id == ^space.id, lock: "FOR NO KEY UPDATE") do
        nil -> {:error, :not_found}
        current -> {:ok, current}
      end
    end)
    |> Multi.run(:board, fn repo, _ -> Locking.lock_for_update(repo, board) end)
    |> Multi.run(:validate, fn _, %{space: current, board: board} -> validate(current, board) end)
    |> Multi.merge(fn %{space: current, board: board} -> archive(author, current, board) end)
    |> Repo.transaction()
    |> case do
      {:ok, %{archived_board: board}} -> {:ok, board}
      {:error, _step, reason, _changes} -> {:error, reason}
    end
  end

  defp validate(space, board) do
    cond do
      board.space_id != space.id -> {:error, :bad_request}
      space.default_task_board_id == board.id -> {:error, :default_board}
      true -> {:ok, :valid}
    end
  end

  defp archive(_author, _space, %{archived_at: archived_at} = board) when not is_nil(archived_at) do
    Multi.put(Multi.new(), :archived_board, board)
  end

  defp archive(author, space, board) do
    Multi.new()
    |> Multi.update(:archived_board, Ecto.Changeset.change(board, archived_at: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)))
    |> Activities.insert_sync(author.id, :task_board_archived, fn _ ->
      %{company_id: space.company_id, space_id: space.id, board_id: board.id, name: board.name}
    end)
  end
end
