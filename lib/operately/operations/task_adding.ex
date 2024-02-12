defmodule Operately.Operations.TaskAdding do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(creator, attrs) do
    changeset = Operately.Tasks.Task.changeset(%{
      creator_id: creator.id,
      assignee_id: attrs.assignee_id,
      space_id: attrs.space_id,
      name: attrs.name,
      description: Jason.decode!(attrs.description),
      due_date: attrs.due_date,
      size: attrs.size,
      priority: attrs.priority,
    })

    Multi.new()
    |> Multi.insert(:task, changeset)
    |> Activities.insert(creator.id, :task_adding, fn changes ->
      %{
        company_id: creator.company_id,
        space_id: changes.task.space_id,
        assignee_id: changes.task.assignee_id,
        name: changes.task.name,
        task_id: changes.task.id,
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:task)
  end
end
