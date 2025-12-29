defmodule Operately.Operations.KanbanStateUpdating do
  alias Ecto.Multi
  alias Operately.Activities
  alias Operately.Repo
  alias Operately.Tasks.KanbanState

  def run(author, scope, task, status, kanban_state) do
    Multi.new()
    |> Multi.run(:validate_task_parent, fn _repo, _changes ->
      validate_task_parent(scope, task)
    end)
    |> Multi.run(:status, fn _repo, _changes -> validate_status(scope, status) end)
    |> Multi.update(:updated_task, fn %{status: status} ->
      Operately.Tasks.Task.changeset(task, %{task_status: status})
    end)
    |> Multi.run(:updated_task_with_preloads, fn _repo, %{updated_task: task} ->
      {:ok, Repo.preload(task, :assigned_people)}
    end)
    |> Multi.run(:updated_project, fn _repo, _changes ->
      allowed_statuses = allowed_statuses(scope)

      with {:ok, decoded_state} <- decode_kanban_state(kanban_state, allowed_statuses) do
        next_state = KanbanState.load(decoded_state, allowed_statuses)
        update_scope_kanban_state(scope, next_state)
      end
    end)
    |> maybe_save_task_status_activity(author.id, scope, task)
  end

  defp validate_task_parent(%{type: :project, project: project}, task) do
    if task.project_id == project.id do
      {:ok, :ok}
    else
      {:error, :not_found}
    end
  end

  defp validate_task_parent(%{type: :milestone, project: project}, task) do
    if task.project_id == project.id do
      {:ok, :ok}
    else
      {:error, :not_found}
    end
  end

  defp validate_task_parent(%{type: :space, space: space}, task) do
    if task.space_id == space.id do
      {:ok, :ok}
    else
      {:error, :not_found}
    end
  end

  defp validate_status(_scope, status) when is_nil(status), do: {:error, {:bad_request, "Invalid status"}}

  defp validate_status(scope, status) do
    statuses = case scope do
      %{type: :project, project: project} -> project.task_statuses
      %{type: :milestone, project: project} -> project.task_statuses
      %{type: :space, space: space} -> space.task_statuses
    end

    if Enum.any?(statuses || [], fn s -> s.id == status.id end) do
      {:ok, status}
    else
      {:error, {:bad_request, "Invalid status"}}
    end
  end

  defp allowed_statuses(%{type: :project, project: project}) do
    Operately.Projects.Project.task_status_values(project)
  end

  defp allowed_statuses(%{type: :milestone, project: project}) do
    Operately.Projects.Project.task_status_values(project)
  end

  defp allowed_statuses(%{type: :space, space: space}) do
    Operately.Groups.Group.task_status_values(space)
  end

  defp update_scope_kanban_state(%{type: :project, project: project}, next_state) do
    Operately.Projects.update_project(project, %{tasks_kanban_state: next_state})
  end

  defp update_scope_kanban_state(%{type: :milestone, milestone: milestone}, next_state) do
    Operately.Projects.update_milestone(milestone, %{tasks_kanban_state: next_state})
  end

  defp update_scope_kanban_state(%{type: :space, space: space}, next_state) do
    with {:ok, _group} <- Operately.Groups.update_group(space, %{tasks_kanban_state: next_state}) do
      {:ok, nil}
    end
  end

  defp maybe_save_task_status_activity(multi, author_id, scope, original_task) do
    Multi.merge(multi, fn changes ->
      if task_status_changed?(original_task, changes.updated_task) do
        Activities.insert_sync(Multi.new(), author_id, :task_status_updating, fn _ ->
          build_task_status_activity_content(scope, original_task, changes.updated_task)
        end)
      else
        Multi.new()
      end
    end)
  end

  defp build_task_status_activity_content(%{type: :project, project: project}, task, updated_task) do
    %{
      company_id: project.company_id,
      space_id: project.group_id,
      project_id: project.id,
      milestone_id: task.milestone_id,
      task_id: task.id,
      old_status: task.task_status && Map.from_struct(task.task_status),
      new_status: updated_task.task_status && Map.from_struct(updated_task.task_status),
      name: task.name
    }
  end

  defp build_task_status_activity_content(%{type: :milestone, project: project}, task, updated_task) do
    %{
      company_id: project.company_id,
      space_id: project.group_id,
      project_id: project.id,
      milestone_id: task.milestone_id,
      task_id: task.id,
      old_status: task.task_status && Map.from_struct(task.task_status),
      new_status: updated_task.task_status && Map.from_struct(updated_task.task_status),
      name: task.name
    }
  end

  defp build_task_status_activity_content(%{type: :space, space: space}, task, updated_task) do
    %{
      company_id: space.company_id,
      space_id: space.id,
      project_id: nil,
      milestone_id: task.milestone_id,
      task_id: task.id,
      old_status: task.task_status && Map.from_struct(task.task_status),
      new_status: updated_task.task_status && Map.from_struct(updated_task.task_status),
      name: task.name
    }
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
