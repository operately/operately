defmodule Operately.Tasks do
  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Tasks.Task
  alias Operately.Tasks.Assignee
  alias Operately.Access.Fetch

  def get_task!(id), do: Repo.get!(Task, id)

  @spec get_task_with_access_level(id :: String.t(), requester_id :: String.t()) :: Task.t()
  def get_task_with_access_level(id, requester_id) do
    from(t in Task, as: :resource, where: t.id == ^id)
    |> Fetch.get_resource_with_access_level(requester_id)
  end

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
