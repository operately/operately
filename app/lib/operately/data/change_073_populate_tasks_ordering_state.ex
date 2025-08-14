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
    task_ids = from(t in Task,
      where: t.milestone_id == ^milestone.id,
      order_by: [asc: t.inserted_at],
      select: t.id
    )
    |> Repo.all()

    Repo.update_all(
      from(m in Milestone, where: m.id == ^milestone.id),
      set: [tasks_ordering_state: task_ids]
    )
  end
end
