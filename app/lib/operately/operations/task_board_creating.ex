defmodule Operately.Operations.TaskBoardCreating do
  import Ecto.Query, only: [from: 2]
  alias Ecto.Multi
  alias Operately.{Activities, Repo}
  alias Operately.Repo.Locking
  alias Operately.Tasks.{TaskBoard, Status}

  def run(author, space, name) do
    Multi.new()
    |> Multi.run(:space, fn repo, _ -> Locking.lock_for_update(repo, space) end)
    |> Multi.insert(:board, fn %{space: current} ->
      position = Repo.one(from b in TaskBoard, where: b.space_id == ^current.id and is_nil(b.archived_at), select: max(b.position))
      statuses = Status.default_task_statuses()

      TaskBoard.changeset(%{
        space_id: current.id,
        name: String.trim(name),
        position: (position || -1) + 1,
        task_statuses: Enum.map(statuses, &Map.from_struct/1),
        tasks_kanban_state: Map.new(statuses, &{&1.value, []})
      })
    end)
    |> Activities.insert_sync(author.id, :task_board_created, fn %{space: current, board: board} ->
      %{company_id: current.company_id, space_id: current.id, board_id: board.id, name: board.name}
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{board: board}} -> {:ok, board}
      {:error, _step, reason, _changes} -> {:error, reason}
    end
  end
end
