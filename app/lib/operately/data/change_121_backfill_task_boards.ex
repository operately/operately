defmodule Operately.Data.Change121BackfillTaskBoards do
  @moduledoc """
  Prepared for the coordinated task-board cutover. Run only while legacy task
  writes are paused; the schema preparation migration deliberately does not call it.
  """

  import Ecto.Query
  alias Operately.Repo

  defmodule Space do
    use Operately.Schema

    schema "groups" do
      field :default_task_board_id, :binary_id
      field :task_statuses, {:array, :map}
      field :tasks_kanban_state, :map
      timestamps()
    end
  end

  defmodule Board do
    use Operately.Schema

    schema "task_boards" do
      field :space_id, :binary_id
      field :name, :string
      field :task_statuses, {:array, :map}
      field :tasks_kanban_state, :map
      field :position, :integer
      field :archived_at, :naive_datetime
      timestamps()
    end
  end

  defmodule Task do
    use Operately.Schema

    schema "tasks" do
      field :space_id, :binary_id
      field :project_id, :binary_id
      field :board_id, :binary_id
    end
  end

  def run do
    {:ok, :ok} =
      Repo.transaction(fn ->
        Repo.all(from s in Space, select: s.id, order_by: s.id)
        |> Enum.each(&backfill_space/1)

        validate!()
      end)

    :ok
  end

  def validate! do
    invalid_spaces = Repo.exists?(from s in Space,
      left_join: b in Board, on: b.id == s.default_task_board_id,
      where: is_nil(b.id) or b.space_id != s.id or not is_nil(b.archived_at))

    invalid_tasks = Repo.exists?(from t in Task,
      left_join: b in Board, on: b.id == t.board_id,
      where: (not is_nil(t.space_id) and (is_nil(b.id) or b.space_id != t.space_id)) or
        (not is_nil(t.project_id) and not is_nil(t.board_id)))

    if invalid_spaces or invalid_tasks, do: raise("Task board cutover failed: invalid default or task board ownership")
    :ok
  end

  defp backfill_space(space_id) do
    space = Repo.one!(from s in Space, where: s.id == ^space_id, lock: "FOR UPDATE")
    board_id = ensure_default_board(space)

    from(t in Task, where: t.space_id == ^space.id and is_nil(t.project_id) and is_nil(t.board_id))
    |> Repo.update_all(set: [board_id: board_id])
  end

  defp ensure_default_board(%Space{default_task_board_id: nil} = space) do
    board_id = Ecto.UUID.generate()

    # Explicit values preserve legacy NULLs instead of applying database defaults.
    Repo.insert_all(Board, [
      %{
        id: board_id,
        space_id: space.id,
        name: "Tasks",
        task_statuses: space.task_statuses,
        tasks_kanban_state: space.tasks_kanban_state,
        position: 0,
        inserted_at: space.inserted_at,
        updated_at: space.updated_at
      }
    ])

    from(s in Space, where: s.id == ^space.id)
    |> Repo.update_all(set: [default_task_board_id: board_id])

    board_id
  end

  defp ensure_default_board(space), do: space.default_task_board_id
end
