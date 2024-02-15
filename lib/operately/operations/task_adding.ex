defmodule Operately.Operations.TaskAdding do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(creator, attrs) do
    changeset = Operately.Tasks.Task.changeset(%{
      creator_id: creator.id,
      assignee_id: attrs.assignee_id,
      name: attrs.name,
      description: Jason.decode!(attrs.description),
      due_date: attrs.due_date,
      size: attrs.size,
      priority: attrs.priority,
      milestone_id: attrs.milestone_id,
    })

    Multi.new()
    |> Multi.insert(:task, changeset)
    |> Enum.reduce(attrs.assignee_ids, fn assignee_id, multi ->
      multi_id = "assignee_#{assignee_id}"

      Multi.insert(multi, multi_id, fn changes -> 
        Operately.Tasks.Assignee.changeset(%{
          task_id: changes.task.id,
          person_id: assignee_id,
        })
      end)
    end)
    |> Activities.insert(creator.id, :task_adding, fn changes ->
      %{
        company_id: creator.company_id,
        name: changes.task.name,
        task_id: changes.task.id,
        milestone_id: changes.task.milestone_id,
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:task)
  end
end
