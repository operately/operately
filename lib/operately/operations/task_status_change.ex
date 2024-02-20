defmodule Operately.Operations.TaskStatusChange do
  import Ecto.Query
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Tasks.KanbanState
  alias Operately.Tasks.Task

  def run(creator, task_id, new_status) do
    task = Operately.Tasks.get_task!(task_id)
    old_status = task.status

    Multi.new()
    |> find_and_lock_milestone(task.milestone_id)
    |> update_task_status(task, new_status)
    |> update_kanban_state(old_status, new_status)
    |> Activities.insert(creator.id, :task_status_change, fn changes ->
      %{
        company_id: creator.company_id,
        task_id: changes.task.id,
        new_status: new_status,
        old_status: old_status
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

  def update_task_status(multi, task, new_status) do
    Multi.update(multi, :task, fn _changes ->
      cond do
        new_status == task.status ->
          {:ok, task}

        new_status == "done" ->
          Task.changeset(task, %{status: new_status, closed_at: DateTime.utc_now()})

        new_status == "in_progress" && task.status == "done" ->
          Task.changeset(task, %{status: new_status, reopened_at: DateTime.utc_now()})

        new_status == "in_progress" && task.status == "todo" ->
          Task.changeset(task, %{status: new_status})

        new_status == "todo" && task.status == "in_progress" ->
          Task.changeset(task, %{status: new_status})

        new_status == "todo" && task.status == "done" ->
          Task.changeset(task, %{status: new_status, reopened_at: DateTime.utc_now()})

        true ->
          {:error, :invalid_status_transition, "Invalid status transition from #{task.status} to #{new_status}"}
      end
    end)
  end

  def update_kanban_state(multi, old_status, new_status) do
    Multi.update(multi, :updated_milestone, fn changes ->
      kanban_state = KanbanState.load(changes.milestone.tasks_kanban_state)
      kanban_state = KanbanState.remove(kanban_state, changes.task.id, old_status)
      kanban_state = KanbanState.add(kanban_state, changes.task.id, new_status)

      Operately.Projects.Milestone.changeset(changes.milestone, %{tasks_kanban_state: kanban_state})
    end)
  end
end
