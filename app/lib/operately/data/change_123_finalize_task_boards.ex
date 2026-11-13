defmodule Operately.Data.Change123FinalizeTaskBoards do
  @moduledoc "Restores legacy project workflows from task boards on rollback."
  import Ecto.Query
  alias Operately.Repo

  defmodule Project do
    use Operately.Schema

    # Include soft-deleted projects. Legacy fields are only used during rollback.
    schema "projects" do
      field :task_statuses, {:array, :map}
      field :tasks_kanban_state, :map
    end
  end

  defmodule Board do
    use Operately.Schema

    schema "task_boards" do
      field :project_id, :binary_id
      field :task_statuses, {:array, :map}
      field :tasks_kanban_state, :map
    end
  end

  def restore_project_workflows do
    from(p in Project, join: b in Board, on: b.project_id == p.id, update: [set: [task_statuses: b.task_statuses, tasks_kanban_state: b.tasks_kanban_state]])
    |> Repo.update_all([])

    :ok
  end
end
