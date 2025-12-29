defmodule Operately.Operations.ProjectKanbanStateUpdating do
  alias Ecto.Multi
  alias Operately.Activities
  alias Operately.Repo
  alias Operately.Tasks.KanbanState

  def run(author, project, task, status, kanban_state) do
    Multi.new()
    |> Multi.run(:validate_task_belongs_to_project, fn _repo, _changes ->
      if task.project_id == project.id do
        {:ok, :ok}
      else
        {:error, :not_found}
      end
    end)
    |> Multi.run(:status, fn _repo, _changes -> validate_status(project, status) end)
    |> Multi.update(:updated_task, fn %{status: status} ->
      Operately.Tasks.Task.changeset(task, %{task_status: status})
    end)
    |> Multi.run(:updated_task_with_preloads, fn _repo, %{updated_task: task} ->
      {:ok, Repo.preload(task, :assigned_people)}
    end)
    |> Multi.run(:updated_project, fn _repo, _changes ->
      allowed_statuses = Operately.Projects.Project.task_status_values(project)

      with {:ok, decoded_state} <- decode_kanban_state(kanban_state, allowed_statuses) do
        next_state = KanbanState.load(decoded_state, allowed_statuses)
        Operately.Projects.update_project(project, %{tasks_kanban_state: next_state})
      end
    end)
    |> maybe_save_task_status_activity(author.id, task)
  end

  defp validate_status(project, status) do
    if is_nil(status) do
      {:error, {:bad_request, "Invalid status"}}
    else
      if Enum.any?(project.task_statuses || [], fn s -> s.id == status.id end) do
        {:ok, status}
      else
        {:error, {:bad_request, "Invalid status"}}
      end
    end
  end

  defp maybe_save_task_status_activity(multi, author_id, original_task) do
    Multi.merge(multi, fn changes ->
      if task_status_changed?(original_task, changes.updated_task) do
        Activities.insert_sync(Multi.new(), author_id, :task_status_updating, fn _ ->
          %{
            company_id: changes.updated_project.company_id,
            space_id: changes.updated_project.group_id,
            project_id: changes.updated_project.id,
            milestone_id: original_task.milestone_id,
            task_id: original_task.id,
            old_status: original_task.task_status && Map.from_struct(original_task.task_status),
            new_status: changes.updated_task.task_status && Map.from_struct(changes.updated_task.task_status),
            name: original_task.name
          }
        end)
      else
        Multi.new()
      end
    end)
  end

  defp task_status_changed?(task, updated_task) do
    old = task.task_status && Map.from_struct(task.task_status)
    new = updated_task.task_status && Map.from_struct(updated_task.task_status)
    old != new
  end

  defp decode_kanban_state(state, allowed_statuses) when is_map(state) do
    normalized =
      Enum.into(state, %{}, fn {key, value} ->
        {to_string(key), value || []}
      end)

    statuses =
      case allowed_statuses do
        [] -> Map.keys(normalized)
        allowed -> allowed
      end

    with :ok <- validate_statuses(normalized, statuses) do
      {:ok,
       Enum.reduce(statuses, %{}, fn status, acc ->
         Map.put(acc, status, Map.get(normalized, status, []))
       end)}
    end
  end

  defp decode_kanban_state(_state, _allowed_statuses), do: {:ok, %{}}

  defp validate_statuses(_state, []), do: :ok

  defp validate_statuses(state, allowed_statuses) do
    allowed = MapSet.new(Enum.map(allowed_statuses, &to_string/1))

    case Enum.find(Map.keys(state), fn status -> not MapSet.member?(allowed, status) end) do
      nil -> :ok
      invalid -> {:error, {:bad_request, "Invalid status #{invalid}"}}
    end
  end
end
