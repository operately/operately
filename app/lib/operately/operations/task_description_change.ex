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
        space_id: space.id,
        project_id: task.project_id,
        task_id: task.id,
        task_name: task.name,
        project_name: task.project.name
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:task)
  end
end
