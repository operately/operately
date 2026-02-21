defmodule Operately.Tasks do
  import Ecto.Query, warn: false
  alias Ecto.Multi
  alias Operately.Repo

  alias Operately.Tasks.Task
  alias Operately.Tasks.Assignee

  def get_task!(id), do: Repo.get!(Task, id)

  def create_task(attrs \\ %{}), do: Task.changeset(attrs) |> Repo.insert()

  def update_task(task, attrs \\ %{}), do: Task.changeset(task, attrs) |> Repo.update()

  def create_assignee(attrs \\ %{}) do
    Multi.new()
    |> Multi.insert(:assignee, Assignee.changeset(attrs))
    |> Multi.run(:subscription, fn _repo, %{assignee: assignee} ->
      task = Repo.get!(Task, assignee.task_id)
      Operately.Notifications.create_subscription(%{
        subscription_list_id: task.subscription_list_id,
        person_id: assignee.person_id,
        type: :invited,
      })
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{assignee: assignee}} -> {:ok, assignee}
      {:error, :assignee, changeset, _} -> {:error, changeset}
      {:error, :subscription, _reason, _} -> {:error, :subscription_creation_failed}
    end
  end

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
