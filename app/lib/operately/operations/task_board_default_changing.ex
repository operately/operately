defmodule Operately.Operations.TaskBoardDefaultChanging do
  import Ecto.Query
  alias Ecto.Multi
  alias Operately.{Activities, Repo}
  alias Operately.Groups.Group
  alias Operately.Repo.Locking

  def run(author, space, board) do
    Multi.new()
    |> Multi.run(:space, fn repo, _ -> lock_space(repo, space.id) end)
    |> Multi.run(:board, fn repo, _ -> Locking.lock_for_update(repo, board) end)
    |> Multi.run(:validate_board, fn _, %{space: space, board: board} -> validate_board(space, board) end)
    |> Multi.merge(fn %{space: space, board: board} -> change_default(author, space, board) end)
    |> Repo.transaction()
    |> case do
      {:ok, %{updated_space: space}} -> {:ok, space}
      {:error, _step, reason, _changes} -> {:error, reason}
    end
  end

  defp lock_space(repo, id) do
    # Allow concurrent task inserts to acquire their space foreign-key locks while
    # we wait for the board lock. Default changes still serialize on the space.
    case repo.one(from s in Group, where: s.id == ^id, lock: "FOR NO KEY UPDATE") do
      nil -> {:error, :not_found}
      space -> {:ok, space}
    end
  end

  defp validate_board(space, board) do
    cond do
      board.space_id != space.id -> {:error, :bad_request}
      board.archived_at != nil -> {:error, :board_archived}
      true -> {:ok, :valid}
    end
  end

  defp change_default(author, space, board) do
    if space.default_task_board_id == board.id do
      Multi.put(Multi.new(), :updated_space, space)
    else
      Multi.new()
      |> Multi.update(:updated_space, Group.default_task_board_changeset(space, board))
      |> Activities.insert_sync(author.id, :task_board_default_changed, fn _ ->
        %{company_id: space.company_id, space_id: space.id, board_id: board.id, previous_board_id: space.default_task_board_id, name: board.name}
      end)
    end
  end
end
