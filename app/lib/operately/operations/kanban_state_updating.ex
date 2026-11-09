defmodule Operately.Operations.KanbanStateUpdating do
  use Gettext, backend: OperatelyWeb.Gettext
  import Ecto.Query, only: [from: 2]
  alias Ecto.Multi
  alias Operately.Activities
  alias Operately.Repo
  alias Operately.Search.IndexUpdates
  alias Operately.Tasks.{KanbanState, Task}

  def run(author, scope, task, status, kanban_state) do
    Multi.new()
    |> Multi.run(:scope, fn _repo, _changes -> resolve_scope(scope) end)
    |> Multi.run(:locked_task, fn _repo, %{scope: scope} ->
      with {:ok, :ok} <- validate_task_parent(scope, task) do
        boards = if scope[:board], do: %{scope.board.id => scope.board}, else: %{}
        Operately.Tasks.BoardSync.lock_task(task, boards)
      end
    end)
    |> Multi.run(:status, fn _repo, %{scope: scope} -> validate_status(scope, status) end)
    |> Multi.update(:updated_task, fn %{status: status, locked_task: task} ->
      Task.changeset(task, Task.status_change_attrs(task, status))
    end)
    |> Multi.run(:updated_task_with_preloads, fn _repo, %{updated_task: task} ->
      {:ok, Repo.preload(task, :assigned_people)}
    end)
    |> Multi.run(:updated_project, fn _repo, %{scope: scope} ->
      allowed_statuses = allowed_statuses(scope)

      with {:ok, decoded_state} <- decode_kanban_state(kanban_state, allowed_statuses),
           :ok <- validate_board_tasks(scope, decoded_state) do
        next_state = KanbanState.load(decoded_state, allowed_statuses)
        update_scope_kanban_state(scope, next_state)
      end
    end)
    |> maybe_save_task_status_activity(author.id, scope)
    |> IndexUpdates.enqueue(:search_task, "task", fn changes -> changes.updated_task.id end)
  end

  defp resolve_scope(%{type: :space, space: space} = scope) do
    with {:ok, board} <- Operately.Tasks.TaskBoard.default_for_space(space),
         {:ok, boards} <- Operately.Tasks.BoardSync.lock_boards([board.id]) do
      {:ok, Map.put(scope, :board, Map.fetch!(boards, board.id))}
    end
  end

  defp resolve_scope(scope), do: {:ok, scope}

  defp validate_board_tasks(%{type: :space, board: board}, state) do
    ids = state |> Map.values() |> List.flatten()
    allowed = Repo.all(from t in Task, where: t.board_id == ^board.id, select: t.id) |> MapSet.new()
    valid = Enum.all?(ids, fn id ->
      case is_binary(id) && OperatelyWeb.Api.Types.Id.decode(id) do
        {:ok, id} -> MapSet.member?(allowed, id)
        _ -> false
      end
    end)

    if valid, do: :ok, else: {:error, :not_found}
  end

  defp validate_board_tasks(_, _), do: :ok

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

  defp validate_task_parent(%{type: :space, space: space, board: board}, task) do
    if task.space_id == space.id and task.board_id == board.id do
      {:ok, :ok}
    else
      {:error, :not_found}
    end
  end

  defp validate_status(_scope, status) when is_nil(status), do: {:error, {:bad_request, gettext("Invalid status")}}

  defp validate_status(scope, status) do
    statuses = case scope do
      %{type: :project, project: project} -> project.task_statuses
      %{type: :milestone, project: project} -> project.task_statuses
      %{type: :space, board: board} -> board.task_statuses
    end

    if Enum.any?(statuses || [], fn s -> s.id == status.id end) do
      {:ok, status}
    else
      {:error, {:bad_request, gettext("Invalid status")}}
    end
  end

  defp allowed_statuses(%{type: :project, project: project}) do
    Operately.Projects.Project.task_status_values(project)
  end

  defp allowed_statuses(%{type: :milestone, project: project}) do
    Operately.Projects.Project.task_status_values(project)
  end

  defp allowed_statuses(%{type: :space, board: board}) do
    Operately.Tasks.TaskBoard.task_status_values(board)
  end

  defp update_scope_kanban_state(%{type: :project, project: project}, next_state) do
    Operately.Projects.update_project(project, %{tasks_kanban_state: next_state})
  end

  defp update_scope_kanban_state(%{type: :milestone, milestone: milestone}, next_state) do
    Operately.Projects.update_milestone(milestone, %{tasks_kanban_state: next_state})
  end

  defp update_scope_kanban_state(%{type: :space, board: board}, next_state) do
    with {:ok, _board} <- board |> Operately.Tasks.TaskBoard.changeset(%{tasks_kanban_state: next_state}) |> Repo.update() do
      {:ok, nil}
    end
  end

  defp maybe_save_task_status_activity(multi, author_id, scope) do
    Multi.merge(multi, fn changes ->
      original_task = changes.locked_task
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
      invalid -> {:error, {:bad_request, gettext("Invalid status %{status}", status: invalid)}}
    end
  end
end
