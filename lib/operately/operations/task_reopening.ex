defmodule Operately.Operations.TaskReopening do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(creator, task_id) do
    task = Operately.Tasks.get_task!(task_id)

    changeset = Operately.Tasks.Task.changeset(task, %{
      reopened_at: DateTime.utc_now(),
      status: :open
    })

    Multi.new()
    |> Multi.update(:task, changeset)
    |> Activities.insert(creator.id, :task_reopening, fn _changes ->
      %{
        company_id: creator.company_id,
        space_id: task.space_id,
        task_id: task.id,
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:task)
  end
end
