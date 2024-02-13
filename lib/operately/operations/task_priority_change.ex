defmodule Operately.Operations.TaskPriorityChange do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(author, task_id, new_priority) do
    task = Operately.Tasks.get_task!(task_id)
    changeset = Operately.Tasks.Task.changeset(task, %{priority: new_priority})

    Multi.new()
    |> Multi.update(:task, changeset)
    |> Activities.insert(author.id, :task_priority_change, fn _changes ->
      %{
        company_id: author.company_id,
        space_id: task.space_id,
        task_id: task_id,
        old_priority: task.priority,
        new_priority: new_priority
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:task)
  end
end
