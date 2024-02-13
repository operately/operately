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
end
