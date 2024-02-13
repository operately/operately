defmodule Operately.Tasks do
  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Tasks.Task

  def list_tasks(params \\ %{}) do
    from(t in Task)
    |> where(space_id: ^params.space_id)
    |> apply_if(params[:status], fn q -> where(q, status: ^params.status) end)
    |> Repo.all()
  end

  def get_task!(id), do: Repo.get!(Task, id)

  def create_task(attrs \\ %{}) do
    %Task{}
    |> Task.changeset(attrs)
    |> Repo.insert()
  end

  def update_task(%Task{} = task, attrs) do
    task
    |> Task.changeset(attrs)
    |> Repo.update()
  end

  def delete_task(%Task{} = task) do
    Repo.delete(task)
  end

  def change_task(%Task{} = task, attrs \\ %{}) do
    Task.changeset(task, attrs)
  end

  defp apply_if(query, condition, fun) do
    if condition, do: fun.(query), else: query
  end

  alias Operately.Tasks.Assignee

  def assigned?(task, person) do
    query = from(a in Assignee, where: a.task_id == ^task.id and a.person_id == ^person.id)

    Repo.one(query) != nil
  end

  def list_task_assignees do
    Repo.all(Assignee)
  end

  def get_assignee!(id), do: Repo.get!(Assignee, id)

  def create_assignee(attrs \\ %{}) do
    %Assignee{}
    |> Assignee.changeset(attrs)
    |> Repo.insert()
  end

  def update_assignee(%Assignee{} = assignee, attrs) do
    assignee
    |> Assignee.changeset(attrs)
    |> Repo.update()
  end

  def delete_assignee(%Assignee{} = assignee) do
    Repo.delete(assignee)
  end

  def change_assignee(%Assignee{} = assignee, attrs \\ %{}) do
    Assignee.changeset(assignee, attrs)
  end
end
