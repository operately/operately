defmodule Operately.Operations.TaskAssigneeAssignment do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(author, task_id, person_id) do
    task = Operately.Tasks.get_task!(task_id)
    person = Operately.People.get_person!(person_id)
    
    if Operately.Tasks.assigned?(task, person) do
      {:ok, task}
    else
      case assign_person(author, task, person) do
        {:ok, _result} -> {:ok, task}
        {:error, changeset} -> {:error, changeset}
      end
    end
  end

  defp assign_person(author, task, person) do
    Multi.new()
    |> Multi.insert(:assignment, Operately.Tasks.Assignee.changeset(%{task_id: task.id, person_id: person.id}))
    |> Activities.insert(author.id, :task_assignee_assignment, fn _changes ->
      %{
        company_id: author.company_id,
        space_id: task.space_id,
        task_id: task.id,
        person_id: person.id
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:assignment)
  end
end
