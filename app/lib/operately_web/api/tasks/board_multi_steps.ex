defmodule OperatelyWeb.Api.Tasks.BoardMultiSteps do
  use Gettext, backend: OperatelyWeb.Gettext
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

  def commit(multi) do
    Repo.transaction(multi)
  end

  def respond(result, ok_callback, error_callback \\ &handle_error/1) do
    case result do
      {:ok, changes} ->
        {:ok, ok_callback.(changes)}

      {:error, _, :idempotent, changes} ->
        {:ok, ok_callback.(changes)}

      e ->
        error_callback.(e)
    end
  end

  defp handle_error(reason) do
    case reason do
      {:error, _step, {:bad_request, message, details}, _changes} ->
        {:error, :bad_request, message, details}

      {:error, _failed_operation, {:bad_request, message}, _changes} ->
        {:error, :bad_request, message}

      {:error, _failed_operation, {:not_found, message}, _changes} ->
        {:error, :not_found, message}

      {:error, _failed_operation, :not_found, _changes} ->
        {:error, :not_found}

      {:error, _failed_operation, :forbidden, _changes} ->
        {:error, :forbidden}

      {:error, _failed_operation, :bad_request, _changes} ->
        {:error, :bad_request}

      {:error, :updated_board, %Ecto.Changeset{}, _changes} ->
        {:error, :bad_request, gettext("Invalid status")}

      {:error, :validate_task_statuses, message, _changes} ->
        {:error, :bad_request, message}

      {:error, :require_status_replacements, :replacement_required, _changes} ->
        {:error, :bad_request, gettext("Every deleted task status in use requires a replacement")}

      {:error, :validate_replacements, message, _changes} ->
        {:error, :bad_request, message}

      {:error, _failed_operation, _reason, _changes} ->
        {:error, :internal_server_error}

      _ ->
        {:error, :internal_server_error}
    end
  end
end
