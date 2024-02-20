defmodule Operately.Tasks do
  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Tasks.Task
  alias Operately.Tasks.Assignee

  def get_task!(id), do: Repo.get!(Task, id)

  def create_task(attrs \\ %{}), do: Task.changeset(attrs) |> Repo.insert()
  def create_assignee(attrs \\ %{}), do: Assignee.changeset(attrs) |> Repo.insert()

  def list_tasks(params \\ %{}) do
    from(t in Task)
    |> where(milestone_id: ^params.milestone_id)
    |> apply_if(params[:status], fn q -> where(q, status: ^params.status) end)
    |> Repo.all()
  end

  def list_task_assignees(task) do
    query = from(a in Assignee, where: a.task_id == ^task.id)
    Repo.all(query)
  end

  defp apply_if(query, condition, fun) do
    if condition, do: fun.(query), else: query
  end
end
