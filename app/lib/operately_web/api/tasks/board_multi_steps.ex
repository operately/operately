defmodule OperatelyWeb.Api.Tasks.BoardMultiSteps do
  use Gettext, backend: OperatelyWeb.Gettext
  import Ecto.Query, only: [from: 2]
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Tasks.{TaskBoard, BoardSync}

  def start(conn, board_id) do
    start_transaction(conn)
    |> Multi.run(:selected_board, fn _, %{me: me} -> TaskBoard.get(me, id: board_id) end)
    |> Multi.merge(fn %{me: me, selected_board: board} ->
      case board do
        %TaskBoard{project_id: id} when not is_nil(id) ->
          Multi.run(Multi.new(), :project, fn _, _ -> Operately.Projects.Project.get(me, id: id) end)

        %TaskBoard{space_id: id} ->
          Multi.run(Multi.new(), :space, fn _, _ -> Operately.Groups.Group.get(me, id: id) end)
      end
    end)
    |> check_permissions(:can_edit)
    |> Multi.run(:board, fn _, %{selected_board: board} -> BoardSync.lock_board(board.id) end)
  end

  defp start_transaction(conn) do
    Multi.new()
    |> Multi.put(:conn, conn)
    |> Multi.put(:company_read_only, OperatelyWeb.Api.Helpers.company_read_only(conn))
    |> Multi.run(:me, fn _, %{conn: conn} ->
      {:ok, conn.assigns.current_person}
    end)
  end

  defp check_permissions(multi, permission) do
    Multi.run(multi, :permissions, fn _, changes ->
      case changes do
        %{project: %Operately.Projects.Project{} = project} ->
          Operately.Projects.Permissions.check(project.request_info.access_level, permission, company_read_only: changes.company_read_only)

        %{space: %Operately.Groups.Group{} = space} ->
          Operately.Groups.Permissions.check(space.request_info.access_level, permission, company_read_only: changes.company_read_only)

        _ ->
          {:error, :forbidden}
      end
    end)
  end

  def update_kanban(multi, status, kanban_state) do
    Multi.merge(multi, fn changes ->
      scope =
        case changes do
          %{project: project} -> %{type: :project, project: project}
          %{space: space, board: board} -> %{type: :space, space: space, board: board}
        end

      Operately.Operations.KanbanStateUpdating.run(changes.me, scope, changes.task, status, kanban_state)
    end)
  end

  def update_task_statuses(multi, task_statuses) do
    case task_statuses do
      [] ->
        Multi.run(multi, :validate_task_statuses, fn _repo, _changes ->
          {:error, gettext("At least one task status is required")}
        end)

      _ ->
        Multi.update(multi, :updated_board, fn %{board: board} ->
          Operately.Tasks.TaskBoard.changeset(board, %{task_statuses: task_statuses})
        end)
    end
  end

  def require_status_replacements(multi, task_statuses, replacements) do
    Multi.run(multi, :require_status_replacements, fn _repo, %{board: board} ->
      if Operately.Tasks.Status.replacement_required?(board, task_statuses, replacements) do
        {:error, :replacement_required}
      else
        {:ok, :valid}
      end
    end)
  end

  def validate_status_replacements(multi, _task_statuses, []), do: multi

  def validate_status_replacements(multi, task_statuses, replacements) do
    Multi.run(multi, :validate_replacements, fn _repo, _changes ->
      new_status_ids = MapSet.new(task_statuses, & &1.id)
      deleted_status_ids = MapSet.new(replacements, & &1.deleted_status_id)

      invalid_replacements =
        Enum.filter(replacements, fn r ->
          replacement_is_deleted = MapSet.member?(deleted_status_ids, r.replacement_status_id)
          replacement_not_in_new_statuses = not MapSet.member?(new_status_ids, r.replacement_status_id)

          replacement_is_deleted or replacement_not_in_new_statuses
        end)

      if Enum.empty?(invalid_replacements) do
        {:ok, :valid}
      else
        {:error, gettext("Replacement statuses must be existing statuses that are not being deleted")}
      end
    end)
  end

  def replace_deleted_task_statuses(multi, []), do: multi

  def replace_deleted_task_statuses(multi, replacements) do
    Multi.run(multi, :replace_task_statuses, fn _repo, changes ->
      board = changes.updated_board

      replacement_map =
        Map.new(replacements, fn r -> {r.deleted_status_id, r.replacement_status_id} end)

      deleted_status_ids = Map.keys(replacement_map)

      tasks =
        from(t in Operately.Tasks.Task,
          where: t.board_id == ^board.id,
          order_by: t.id,
          lock: "FOR UPDATE",
          where: fragment("?->>'id' = ANY(?)", t.task_status, ^deleted_status_ids)
        )
        |> Repo.all()

      new_statuses_by_id = Map.new(board.task_statuses, fn s -> {s.id, s} end)

      Enum.reduce_while(tasks, {:ok, board}, fn task, {:ok, board} ->
        replacement_id = Map.fetch!(replacement_map, task.task_status.id)
        status = Map.fetch!(new_statuses_by_id, replacement_id)
        attrs = Operately.Tasks.Task.status_change_attrs(task, status)

        with {:ok, updated} <- task |> Operately.Tasks.Task.changeset(attrs) |> Repo.update(),
             {:ok, board} <- Operately.Tasks.BoardSync.add_task(board, updated) do
          {:cont, {:ok, board}}
        else
          error -> {:halt, error}
        end
      end)
      |> case do
        {:ok, _board} -> {:ok, Enum.map(tasks, & &1.id)}
        error -> error
      end
    end)
    |> Operately.Search.IndexUpdates.enqueue(:search_tasks_with_replaced_status, "task", fn changes -> changes.replace_task_statuses end)
  end
end
