defmodule Operately.Operations.TaskReopening do
  import Ecto.Query
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Tasks.KanbanState

  def run(creator, task_id) do
    task = Operately.Tasks.get_task!(task_id)

    Multi.new()
    |> find_and_lock_milestone(task.milestone_id)
    |> update_task_status(task)
    |> update_kanban_state(task.status)
    |> Activities.insert(creator.id, :task_reopening, fn _changes ->
      %{
        company_id: creator.company_id,
        task_id: task.id,
      }
    end)
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

  def update_task_status(multi, task) do
    Multi.update(multi, :task, fn _changes ->
      Operately.Tasks.Task.changeset(task, %{status: "todo", reopened_at: DateTime.utc_now()})
    end)
  end

  def update_kanban_state(multi, original_status) do
    Multi.update(multi, :updated_milestone, fn changes ->
      kanban_state = KanbanState.load(changes.milestone.tasks_kanban_state)
      kanban_state = KanbanState.remove(kanban_state, changes.task.id, original_status)
      kanban_state = KanbanState.add(kanban_state, changes.task.id, changes.task.status, 0)

      Operately.Projects.Milestone.changeset(changes.milestone, %{tasks_kanban_state: kanban_state})
    end)
  end
end
