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
    })

    Multi.new()
    |> Multi.insert(:task, changeset)
    |> Activities.insert(creator.id, :task_adding, fn changes ->
      %{
        company_id: changes.goal.company_id,
        space_id: changes.goal.space_id,
        assignee_id: changes.goal.assignee_id,
        name: changes.task.name
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:task)
  end
end
