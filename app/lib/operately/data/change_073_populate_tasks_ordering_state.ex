defmodule Operately.Data.Change073PopulateTasksOrderingState do
  import Ecto.Query, only: [from: 2]
  alias Operately.Repo
  alias Operately.Projects.Milestone
  alias Operately.Tasks.Task

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
end
