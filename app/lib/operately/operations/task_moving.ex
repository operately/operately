defmodule Operately.Operations.TaskMoving do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Tasks.{Task, TaskBoard}
  alias Operately.Groups.Group
  alias Operately.Projects.Project
  alias Operately.Activities
  alias Operately.Search.IndexUpdates

  def run(author, task, destination_type, destination, opts \\ []) do
    with :ok <- ensure_valid_destination(destination_type, destination),
         {:ok, moved_task} <- persist_move(author, task, destination_type, destination, opts) do
      {:ok, %{task: moved_task, destination_type: destination_type, destination_id: destination.id}}
    end
  end

  defp ensure_valid_destination(:project, %Project{}), do: :ok
  defp ensure_valid_destination(:space, %Group{}), do: :ok
  defp ensure_valid_destination(_, _), do: {:error, :invalid_destination}

  defp persist_move(author, task, destination_type, destination, opts) do
    Multi.new()
    |> Multi.run(:destination_board, fn _repo, _ ->
      case {destination_type, opts[:board]} do
        {:space, nil} -> TaskBoard.default_for_space(destination)
        {:space, board} -> {:ok, board}
        {:project, nil} -> {:ok, nil}
        _ -> {:error, :bad_request}
      end
    end)
    |> Multi.run(:boards, fn _repo, %{destination_board: board} ->
      Operately.Tasks.BoardSync.lock_boards([task.board_id, board && board.id])
    end)
    |> Multi.run(:locked_task, fn _repo, %{boards: boards} ->
      with {:ok, current} <- Operately.Tasks.BoardSync.lock_task(task, boards) do
        {:ok, Repo.preload(current, [:space, project: :group])}
      end
    end)
    |> Multi.run(:validate_destination, fn _repo, %{destination_board: board, boards: boards} ->
      with :ok <- ensure_different_destination(task, destination_type, if(board, do: board.id, else: destination.id)),
           :ok <- validate_board_destination(board && boards[board.id], destination) do
        {:ok, nil}
      end
    end)
    |> Multi.run(:status, fn _repo, %{locked_task: current, destination_board: board, boards: boards} ->
      status_scope = if board, do: Map.fetch!(boards, board.id), else: destination

      with {:ok, status, selection} <- select_destination_status(current, destination_type, status_scope, opts) do
        {:ok, %{status: status, selection: selection}}
      end
    end)
    |> Multi.run(:remove_from_board, fn _repo, %{locked_task: current, boards: boards} ->
      Operately.Tasks.BoardSync.remove_task(boards[current.board_id], current)
    end)
    |> Multi.update(:task, fn %{locked_task: current, destination_board: board, status: status} ->
      attrs =
        move_attrs(destination_type, destination)
        |> Map.put(:board_id, board && board.id)
        |> Map.merge(status_attrs(current, status.status, status.selection))

      Task.changeset(current, attrs)
    end)
    |> Multi.run(:add_to_board, fn _repo, %{task: updated, boards: boards} ->
      Operately.Tasks.BoardSync.add_task(boards[updated.board_id], updated)
    end)
    |> Multi.run(:loaded_task, fn _repo, %{task: updated} ->
      {:ok, Repo.preload(updated, [:space, project: :group], force: true)}
    end)
    |> IndexUpdates.enqueue(:search_task, "task", fn changes -> changes.task.id end)
    |> Activities.insert_sync(author.id, :task_moving, fn %{locked_task: current, task: updated} ->
      activity_content(current, destination_type, destination)
      |> Map.merge(%{origin_board_id: current.board_id, destination_board_id: updated.board_id})
    end)
    |> Repo.transaction()
    |> OperatelyWeb.Api.Subscriptions.ProjectUpdated.broadcast_result([task.project_id, destination_project_id(destination_type, destination)])
    |> case do
      {:ok, %{loaded_task: task}} -> {:ok, task}
      {:error, _step, reason, _changes} -> {:error, reason}
    end
  end

  defp ensure_different_destination(task, :project, destination_id) do
    if task.project_id == destination_id, do: {:error, :bad_request}, else: :ok
  end

  defp ensure_different_destination(task, :space, board_id) do
    if task.board_id == board_id, do: {:error, :bad_request}, else: :ok
  end


  defp validate_board_destination(nil, %Project{}), do: :ok
  defp validate_board_destination(%TaskBoard{space_id: space_id, archived_at: nil}, %Group{id: space_id}), do: :ok
  defp validate_board_destination(%TaskBoard{archived_at: archived_at}, _) when not is_nil(archived_at), do: {:error, :task_board_archived}
  defp validate_board_destination(_, _), do: {:error, :bad_request}

  defp select_destination_status(task, type, destination, opts) do
    cond do
      opts[:status_id] ->
        case Enum.find(destination.task_statuses || [], &(&1.id == opts[:status_id])) do
          nil -> {:error, {:status_mapping_required, destination.task_statuses || []}}
          status -> status_to_map(status) |> status_with_selection(:explicit)
        end

      opts[:explicit_board] ->
        statuses = destination.task_statuses || []
        same_id = task.task_status && Enum.find(statuses, &(&1.id == task.task_status.id))
        equivalent = Enum.filter(statuses, &equivalent_status?(&1, task.task_status))

        case same_id || (if length(equivalent) == 1, do: hd(equivalent)) do
          nil -> {:error, {:status_mapping_required, statuses}}
          status ->
            selection = if equivalent_status?(status, task.task_status), do: :equivalent, else: :explicit
            status_to_map(status) |> status_with_selection(selection)
        end

      true -> destination_status(task, type, destination)
    end
  end

  defp destination_project_id(:project, destination), do: destination.id
  defp destination_project_id(:space, _destination), do: nil

  defp destination_status(task = %Task{project_id: project_id}, :space, board = %TaskBoard{}) when not is_nil(project_id) do
    matching_status =
      board.task_statuses
      |> List.wrap()
      |> Enum.find(&equivalent_status?(&1, task.task_status))

    case matching_status do
      nil -> destination_default_status(:space, board) |> status_with_selection(:fallback)
      status -> status_to_map(status) |> status_with_selection(:equivalent)
    end
  end

  defp destination_status(_task, destination_type, destination) do
    destination_default_status(destination_type, destination) |> status_with_selection(:default)
  end

  defp status_with_selection({:ok, status}, selection), do: {:ok, status, selection}
  defp status_with_selection(error, _selection), do: error

  defp equivalent_status?(_destination_status, nil), do: false

  defp equivalent_status?(destination_status, source_status) do
    destination_status.value == source_status.value && destination_status.closed == source_status.closed
  end

  defp destination_default_status(:project, project = %Project{}) do
    project
    |> Project.get_default_task_status()
    |> status_to_map()
  end

  defp destination_default_status(:space, board = %TaskBoard{}) do
    board
    |> TaskBoard.get_default_task_status()
    |> status_to_map()
  end

  defp status_to_map(nil), do: {:error, :invalid_task_status}

  defp status_to_map(status) do
    status =
      status
      |> Map.from_struct()
      |> Map.take([:id, :label, :color, :index, :value, :closed])

    case status[:value] do
      nil -> {:error, :invalid_task_status}
      _ -> {:ok, status}
    end
  end

  defp move_attrs(:project, destination) do
    %{
      milestone_id: nil,
      project_id: destination.id,
      space_id: nil,
    }
  end

  defp move_attrs(:space, destination) do
    %{
      milestone_id: nil,
      project_id: nil,
      space_id: destination.id,
    }
  end

  defp status_attrs(task, status, :explicit), do: Task.status_change_attrs(task, status)
  defp status_attrs(_task, status, :equivalent), do: %{task_status: status, status: status.value}
  defp status_attrs(task, status, :fallback), do: Task.status_change_attrs(task, status)
  defp status_attrs(_task, status, :default), do: %{task_status: status}

  defp activity_content(task, destination_type, destination) do
    destination_project_id =
      case destination_type do
        :project -> destination.id
        :space -> nil
      end

    destination_space_id =
      case destination_type do
        :project -> destination.group_id
        :space -> destination.id
      end

    %{
      company_id: company_id(task),
      task_id: task.id,
      project_id: destination_project_id,
      space_id: destination_space_id,
      origin_project_id: task.project_id,
      origin_space_id: origin_space_id(task),
      destination_project_id: destination_project_id,
      destination_space_id: destination_space_id,
      task_name: task.name,
      origin_type: Task.task_type(task),
      destination_type: Atom.to_string(destination_type)
    }
  end

  defp company_id(task) do
    cond do
      task.project && task.project.company_id -> task.project.company_id
      task.space && task.space.company_id -> task.space.company_id
    end
  end

  defp origin_space_id(task) do
    cond do
      task.space_id -> task.space_id
      task.project && task.project.group_id -> task.project.group_id
    end
  end
end
