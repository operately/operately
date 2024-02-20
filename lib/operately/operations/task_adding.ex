defmodule Operately.Operations.TaskAdding do
  import Ecto.Query
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(creator, attrs) do
    Multi.new()
    |> find_and_lock_milestone(attrs.milestone_id)
    |> insert_task(creator, attrs)
    |> update_kanban_state()
    |> insert_assignees(attrs.assignee_ids)
    |> insert_activity(creator)
    |> Repo.transaction()
    |> Repo.extract_result(:task)
  end

  def find_and_lock_milestone(multi, milestone_id) do
    Multi.run(multi, :milestone, fn repo, _ ->
      query = from(m in Operately.Projects.Milestone, where: m.id == ^milestone_id, lock: "FOR UPDATE")

      case repo.one(query) do
        nil -> {:error, :not_found}
        milestone -> {:ok, milestone}
      end
    end)
  end

  def insert_task(multi, creator, attrs) do
    Multi.insert(multi, :task, fn changes ->
      Operately.Tasks.Task.changeset(%{
        name: attrs.name,
        description: Jason.decode!(attrs.description),
        milestone_id: changes.milestone.id,
        creator_id: creator.id,
      })
    end)
  end

  def update_kanban_state(multi) do
    Multi.update(multi, :updated_milestone, fn changes ->
      kanban_state = Operately.Tasks.KanbanState.load(changes.milestone.tasks_kanban_state)
      kanban_state = Operately.Tasks.KanbanState.add_todo(kanban_state, changes.task.id)

      Operately.Projects.Milestone.changeset(changes.milestone, %{tasks_kanban_state: kanban_state})
    end)
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
