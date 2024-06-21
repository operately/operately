defmodule Operately.Operations.TaskDescriptionChange do
  import Ecto.Query, only: [from: 2]

  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Tasks.Task

  def run(author, task_id, description) do
    task = from(t in Task, where: t.id == ^task_id, preload: :group) |> Repo.one()
    space = task.group

    changeset = Task.changeset(task, %{description: description})

    Multi.new()
    |> Multi.update(:task, changeset)
    |> Activities.insert_sync(author.id, :task_description_change, fn _changes ->
      %{
        company_id: author.company_id,
        task_id: task.id,
        space_id: space.id,
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:task)
  end
end
