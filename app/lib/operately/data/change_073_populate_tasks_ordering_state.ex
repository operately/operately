defmodule Operately.Data.Change073PopulateTasksOrderingState do
  import Ecto.Query, only: [from: 2]
  alias Operately.Repo
  alias __MODULE__.{Milestone, Task}

  def run do
    Repo.transaction(fn ->
      from(m in Milestone,
        where: is_nil(m.tasks_ordering_state) or m.tasks_ordering_state == []
      )
      |> Repo.all()
      |> Enum.each(&populate_milestone_ordering/1)
    end)
  end

  defp populate_milestone_ordering(milestone) do
    tasks = from(t in Task,
      where: t.milestone_id == ^milestone.id,
      order_by: [asc: t.inserted_at]
    )
    |> Repo.all()

    # Convert tasks to short IDs using the same logic as OrderingState
    task_short_ids = Enum.map(tasks, &OperatelyWeb.Paths.task_id/1)

    Repo.update_all(
      from(m in Milestone, where: m.id == ^milestone.id),
      set: [tasks_ordering_state: task_short_ids]
    )
  end

  defmodule Milestone do
    use Operately.Schema

    schema "project_milestones" do
      field :tasks_ordering_state, {:array, :string}, default: Operately.Tasks.OrderingState.initialize()
    end

    def changeset(attrs) do
      changeset(%__MODULE__{}, attrs)
    end

    def changeset(milestone, attrs) do
      milestone
      |> cast(attrs, [:tasks_ordering_state])
    end
  end

  defmodule Task do
    use Operately.Schema

    schema "tasks" do
      belongs_to :milestone, Operately.Projects.Milestone
      field :name, :string

      timestamps()
    end

    def changeset(attrs) do
      changeset(%__MODULE__{}, attrs)
    end

    def changeset(task, attrs) do
      task
      |> cast(attrs, [:milestone_id])
    end
  end
end
