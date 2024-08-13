defmodule Operately.Operations.TaskDescriptionChange do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Tasks.Task

  def run(author, task, description) do
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
