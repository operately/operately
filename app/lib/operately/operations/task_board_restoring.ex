defmodule Operately.Operations.TaskBoardRestoring do
  import Ecto.Query
  alias Ecto.Multi
  alias Operately.{Activities, Repo}
  alias Operately.Groups.Group
  alias Operately.Repo.Locking
  alias Operately.Tasks.TaskBoard

  def run(author, space, board) do
    Multi.new()
    |> Multi.run(:space, fn repo, _ ->
      case repo.one(from s in Group, where: s.id == ^space.id, lock: "FOR NO KEY UPDATE") do
        nil -> {:error, :not_found}
        current -> {:ok, current}
      end
    end)
    |> Multi.run(:board, fn repo, _ -> Locking.lock_for_update(repo, board) end)
    |> Multi.run(:validate, fn _, %{space: current, board: board} ->
      if board.space_id == current.id, do: {:ok, :valid}, else: {:error, :bad_request}
    end)
    |> Multi.merge(fn %{space: current, board: board} -> restore(author, current, board) end)
    |> Repo.transaction()
    |> case do
      {:ok, %{restored_board: board}} -> {:ok, board}
      {:error, _step, reason, _changes} -> {:error, reason}
    end
  end

  defp restore(_author, _space, %{archived_at: nil} = board), do: Multi.put(Multi.new(), :restored_board, board)

  defp restore(author, space, board) do
    position = Repo.one(from b in TaskBoard, where: b.space_id == ^space.id and is_nil(b.archived_at), select: max(b.position))

    Multi.new()
    |> Multi.update(:restored_board, Ecto.Changeset.change(board, archived_at: nil, position: (position || -1) + 1))
    |> Activities.insert_sync(author.id, :task_board_restored, fn _ ->
      %{company_id: space.company_id, space_id: space.id, board_id: board.id, name: board.name}
    end)
  end
end
