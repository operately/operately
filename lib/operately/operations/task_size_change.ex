defmodule Operately.Operations.TaskSizeChange do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(author, task_id, new_size) do
    task = Operately.Tasks.get_task!(task_id)
    changeset = Operately.Tasks.Task.changeset(task, %{size: new_size})

    Multi.new()
    |> Multi.update(:task, changeset)
    |> Activities.insert(author.id, :task_size_change, fn _changes ->
      %{
        company_id: author.company_id,
        space_id: task.space_id,
        task_id: task_id,
        old_size: task.size,
        new_size: new_size
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:task)
  end
end
