defmodule Operately.Operations.TaskUpdate do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Tasks.Assignee

  def run(author, task_id, name, assignee_ids) do
    task = Operately.Tasks.get_task!(task_id)

    Multi.new()
    |> update_task_name(task, name)
    |> update_task_assignees(task, assignee_ids)
    |> insert_activity(author, task, name)
    |> Repo.transaction()
    |> Repo.extract_result(:task)
  end

  def update_task_name(multi, task, name) do
    Multi.update(multi, :task, fn _ ->
      Operately.Tasks.Task.changeset(task, %{name: name})
    end)
  end

  def update_task_assignees(multi, task, assignee_ids) do
    assignees = Operately.Tasks.list_task_assignees(task)
    for_delete = Enum.reject(assignees, fn assignee -> assignee.id in assignee_ids end)
    new_assignees = Enum.reject(assignee_ids, fn assignee_id -> assignee_id in assignees end)

    multi = Enum.reduce(for_delete, multi, fn assignee, multi ->
      operation_name = "delete_task_assignee_#{assignee.id}"
      Multi.delete(multi, operation_name, assignee)
    end)

    multi = Enum.reduce(new_assignees, multi, fn assignee_id, multi ->
      name = "insert_task_assignee_#{assignee_id}"
      changeset = Assignee.changeset(%{task_id: task.id, person_id: assignee_id})

      Multi.insert(multi, name, changeset)
    end)

    multi
  end

  def insert_activity(multi, author, task, name) do
    Activities.insert_sync(multi, author.id, :task_update, fn _changes ->
      %{
        company_id: author.company_id,
        task_id: task.id,
        old_name: task.name,
        new_name: name
      }
    end)
  end
end
