defmodule Operately.Data.Change122BackfillProjectTaskBoards do
  @moduledoc """
  Prepared for the coordinated project task-board cutover. Run only while legacy
  project task writes are paused; the schema preparation migration does not call it.
  """

  import Ecto.Query
  alias Operately.Repo

  defmodule Project do
    use Operately.Schema

    # Deliberately omit deleted_at so soft-deleted projects are included.
    schema "projects" do
      field :task_statuses, {:array, :map}
      field :tasks_kanban_state, :map
      timestamps()
    end
  end

  defmodule Board do
    use Operately.Schema

    schema "task_boards" do
      field :project_id, :binary_id
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
      field :project_id, :binary_id
      field :space_id, :binary_id
      field :board_id, :binary_id
    end
  end

  def run do
    {:ok, :ok} =
      Repo.transaction(fn ->
        Repo.all(from p in Project, select: p.id, order_by: p.id)
        |> Enum.each(&backfill_project/1)

        validate!()
      end)

    :ok
  end

  def validate! do
    invalid_projects =
      Repo.exists?(from p in Project, left_join: b in Board, on: b.project_id == p.id, where: is_nil(b.id) or not is_nil(b.archived_at))

    invalid_tasks =
      Repo.exists?(
        from t in Task,
          left_join: b in Board,
          on: b.id == t.board_id,
          where:
            (not is_nil(t.project_id) and (is_nil(b.project_id) or b.project_id != t.project_id or not is_nil(t.space_id))) or
              (not is_nil(b.project_id) and is_nil(t.project_id))
      )

    if invalid_projects or invalid_tasks, do: raise("Project task board cutover failed: missing board, archived board, or invalid task board ownership")
    :ok
  end

  defp backfill_project(project_id) do
    project = Repo.one!(from p in Project, where: p.id == ^project_id, lock: "FOR UPDATE")
    board_id = ensure_board(project)

    from(t in Task, where: t.project_id == ^project.id and is_nil(t.board_id))
    |> Repo.update_all(set: [board_id: board_id])
  end

  defp ensure_board(project) do
    case Repo.get_by(Board, project_id: project.id) do
      nil -> insert_board(project)
      board -> board.id
    end
  end

  defp insert_board(project) do
    board_id = Ecto.UUID.generate()

    # Copy raw payloads and explicit NULLs without applying current schema defaults.
    Repo.insert_all(Board, [
      %{
        id: board_id,
        project_id: project.id,
        name: "Tasks",
        task_statuses: project.task_statuses,
        tasks_kanban_state: project.tasks_kanban_state,
        position: 0,
        inserted_at: project.inserted_at,
        updated_at: project.updated_at
      }
    ])

    board_id
  end
end
