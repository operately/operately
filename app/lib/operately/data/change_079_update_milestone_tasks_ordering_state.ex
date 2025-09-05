defmodule Operately.Data.Change079UpdateMilestoneTasksOrderingState do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias __MODULE__.{Milestone, Task}

  def run do
    Repo.transaction(fn ->
      from(m in Milestone,
        preload: [:tasks]
      )
      |> Repo.all()
      |> Enum.each(&update_milestone_ordering/1)
    end)
  end

  defp update_milestone_ordering(milestone) do
    active_tasks = Enum.filter(milestone.tasks, fn task ->
      task.status != "done" && task.status != "canceled"
    end)

    task_short_ids = Enum.map(active_tasks, &OperatelyWeb.Paths.task_id/1)

    Repo.update_all(
      from(m in Milestone, where: m.id == ^milestone.id),
      set: [tasks_ordering_state: task_short_ids]
    )
  end

  defmodule Milestone do
    use Operately.Schema

    schema "project_milestones" do
      field :tasks_ordering_state, {:array, :string}, default: Operately.Tasks.OrderingState.initialize()
      has_many :tasks, Task
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
      belongs_to :milestone, Milestone
      field :name, :string
      field :status, :string

      timestamps()
    end

    def changeset(attrs) do
      changeset(%__MODULE__{}, attrs)
    end

    def changeset(task, attrs) do
      task
      |> cast(attrs, [:milestone_id, :status])
    end
  end
end
