defmodule Operately.Tasks do
  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Tasks.Task

  def list_tasks(params \\ %{}) do
    query = from t in Task, where: t.space_id == ^params.space_id

    Repo.all(query)
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
end
