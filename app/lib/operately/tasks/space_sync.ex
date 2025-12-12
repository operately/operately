defmodule Operately.Tasks.SpaceSync do
  @moduledoc """
  Synchronizes task ordering and kanban state for space tasks.
  Similar to MilestoneSync but for spaces which don't have milestones.
  """

  import Ecto.Query, only: [from: 2]

  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Tasks.KanbanState
  alias Operately.Groups.Group

  @doc """
  Synchronizes space kanban state after a task is created.
  Adds the task to the space's kanban state.
  """
  def sync_after_task_create(multi, space_id) when is_nil(space_id), do: multi

  def sync_after_task_create(multi, space_id) do
    Multi.run(multi, :space_sync_create, fn _repo, changes ->
      with_space_lock(space_id, fn space ->
        task = get_task_from_changes(changes)

        kanban_state =
          space.tasks_kanban_state
          |> KanbanState.load(kanban_statuses_from_changes(changes, task))

        updated_kanban_state = append_task_to_kanban_state(kanban_state, task)

        update_space_kanban(space, %{tasks_kanban_state: updated_kanban_state})
      end)
    end)
    |> Multi.run(:updated_space, &extract_space_from_sync/2)
  end

  @doc """
  Synchronizes space kanban state after a task status is updated.
  Moves the task to the appropriate column in the kanban state.
  """
  def sync_after_task_status_update(multi) do
    Multi.run(multi, :space_sync_status, fn _repo, changes ->
      task = changes.updated_task

      case task.space_id do
        nil ->
          {:ok, nil}

        space_id ->
          with_space_lock(space_id, fn space ->
            kanban_state =
              space.tasks_kanban_state
              |> KanbanState.load(kanban_statuses_from_changes(changes, task))

            updated_kanban_state = move_task_in_kanban_state(kanban_state, task)

            update_space_kanban(space, %{tasks_kanban_state: updated_kanban_state})
          end)
      end
    end)
    |> Multi.run(:updated_space, &extract_space_from_sync/2)
  end

  @doc """
  Synchronizes space kanban state after a task is deleted.
  Removes the task from the space's kanban state.
  """
  def sync_after_task_delete(multi) do
    Multi.run(multi, :space_sync_delete, fn _repo, changes ->
      task = changes.task

      case task.space_id do
        nil ->
          {:ok, nil}

        space_id ->
          with_space_lock(space_id, fn space ->
            kanban_state =
              space.tasks_kanban_state
              |> KanbanState.load(kanban_statuses_from_space(space))

            updated_kanban_state = remove_task_from_kanban_state(kanban_state, task)

            update_space_kanban(space, %{tasks_kanban_state: updated_kanban_state})
          end)
      end
    end)
    |> Multi.run(:updated_space, &extract_space_from_sync/2)
  end

  # Private helpers

  defp with_space_lock(space_id, callback) do
    Repo.transaction(fn ->
      space =
        from(s in Group,
          where: s.id == ^space_id,
          lock: "FOR UPDATE"
        )
        |> Repo.one!()

      callback.(space)
    end)
    |> case do
      {:ok, result} -> result
      {:error, reason} -> {:error, reason}
    end
  end

  defp get_task_from_changes(changes) do
    cond do
      Map.has_key?(changes, :task) -> changes.task
      Map.has_key?(changes, :updated_task) -> changes.updated_task
      true -> nil
    end
  end

  defp kanban_statuses_from_changes(changes, task) do
    statuses =
      cond do
        Map.has_key?(changes, :space) and changes.space ->
          task_status_values_from_space(changes.space)

        task.space ->
          task_status_values_from_space(task.space)

        true ->
          KanbanState.default_statuses()
      end

    case task_status_value(task) do
      nil -> statuses
      status -> statuses ++ [status]
    end
  end

  defp kanban_statuses_from_space(space) do
    task_status_values_from_space(space)
  end

  defp task_status_values_from_space(space) do
    case space.task_statuses do
      nil -> KanbanState.default_statuses()
      [] -> KanbanState.default_statuses()
      statuses -> Enum.map(statuses, fn s -> s.value || s.id end) |> Enum.filter(& &1)
    end
  end

  defp append_task_to_kanban_state(kanban_state, task) do
    case task_status_value(task) do
      nil ->
        kanban_state

      status ->
        column_index =
          kanban_state
          |> Map.get(status, [])
          |> length()

        KanbanState.add(kanban_state, task, status, column_index)
    end
  end

  defp move_task_in_kanban_state(kanban_state, task) do
    case task_status_value(task) do
      nil ->
        kanban_state

      new_status ->
        # Remove from all statuses and add to new status
        cleaned_state =
          Enum.reduce(kanban_state, %{}, fn {status, ids}, acc ->
            task_short_id = OperatelyWeb.Paths.task_id(task)
            Map.put(acc, status, List.delete(ids, task_short_id))
          end)

        column_index =
          cleaned_state
          |> Map.get(new_status, [])
          |> length()

        KanbanState.add(cleaned_state, task, new_status, column_index)
    end
  end

  defp remove_task_from_kanban_state(kanban_state, task) do
    task_short_id = OperatelyWeb.Paths.task_id(task)

    Enum.reduce(kanban_state, %{}, fn {status, ids}, acc ->
      Map.put(acc, status, List.delete(ids, task_short_id))
    end)
  end

  defp task_status_value(%{task_status: %{value: value}}) when not is_nil(value), do: to_string(value)
  defp task_status_value(%{status: status}) when is_binary(status), do: status
  defp task_status_value(%{status: status}) when is_atom(status), do: Atom.to_string(status)
  defp task_status_value(_), do: nil

  defp update_space_kanban(space, updates) do
    case Operately.Groups.update_group(space, updates) do
      {:ok, updated_space} -> {:ok, updated_space}
      {:error, changeset} -> {:error, changeset}
    end
  end

  defp extract_space_from_sync(_repo, %{space_sync_create: result}), do: {:ok, result}
  defp extract_space_from_sync(_repo, %{space_sync_status: result}), do: {:ok, result}
  defp extract_space_from_sync(_repo, %{space_sync_delete: result}), do: {:ok, result}
  defp extract_space_from_sync(_repo, _changes), do: {:ok, nil}
end
