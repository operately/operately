defmodule Operately.Operations.TaskAdding do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(creator, attrs) do
    changeset = Operately.Tasks.Task.changeset(%{
      name: attrs.name,
      description: Jason.decode!(attrs.description),
      milestone_id: attrs.milestone_id,
      creator_id: creator.id,
    })

    Multi.new()
    |> Multi.insert(:task, changeset)
    |> insert_assignees(attrs.assignee_ids)
    |> insert_activity(creator)
    |> Repo.transaction()
    |> Repo.extract_result(:task)
  end

  def insert_assignees(multi, assignee_ids) do
    Enum.reduce(assignee_ids, multi, fn assignee_id, multi ->
      multi_id = "assignee_#{assignee_id}"

      Multi.insert(multi, multi_id, fn changes -> 
        Operately.Tasks.Assignee.changeset(%{
          task_id: changes.task.id,
          person_id: assignee_id,
        })
      end)
    end)
  end

  def insert_activity(multi, creator) do
    Activities.insert(multi, creator.id, :task_adding, fn changes ->
      %{
        company_id: creator.company_id,
        name: changes.task.name,
        task_id: changes.task.id,
        milestone_id: changes.task.milestone_id,
      }
    end)
  end
end
