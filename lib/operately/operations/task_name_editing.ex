defmodule Operately.Operations.TaskNameEditing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(creator, task_id, name) do
    task = Operately.Tasks.get_task!(task_id)
    changeset = Operately.Tasks.Task.changeset(task, %{name: name})

    Multi.new()
    |> Multi.update(:task, changeset)
    |> Activities.insert(creator.id, :task_name_editing, fn changes ->
      %{
        company_id: creator.company_id,
        space_id: task.space_id,
        task_id: task.id,
        old_name: task.name,
        new_name: changes.task.name,
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:task)
  end
end
