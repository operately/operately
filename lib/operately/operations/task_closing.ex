defmodule Operately.Operations.TaskClosing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(creator, task_id) do
    task = Operately.Tasks.get_task!(task_id)

    changeset = Operately.Tasks.Task.changeset(task, %{
      closed_at: DateTime.utc_now(),
      status: :closed
    })

    Multi.new()
    |> Multi.update(:task, changeset)
    |> Activities.insert(creator.id, :task_closing, fn _changes ->
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
