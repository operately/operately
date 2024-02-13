defmodule Operately.Operations.TaskDescriptionChange do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(author, task_id, description) do
    task = Operately.Tasks.get_task!(task_id)
    changeset = Operately.Tasks.Task.changeset(task, %{description: description})

    Multi.new()
    |> Multi.update(:task, changeset)
    |> Activities.insert(author.id, :task_description_change, fn _changes ->
      %{
        company_id: author.company_id,
        space_id: task.space_id,
        task_id: task.id,
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:task)
  end
end
