defmodule Operately.ProjectTemplates.Copy do
  alias Operately.Tasks.{Reminder, Status}
  alias OperatelyWeb.Api.Helpers

  def copy_workflow(statuses) when is_list(statuses) do
    with :ok <- validate_workflow(statuses),
         first_open when not is_nil(first_open) <- first_open_status(statuses) do
      copied_by_source_id = Map.new(statuses, &{&1.id, copy_status(&1)})

      {:ok,
       %{
         source: statuses,
         copied: Enum.map(statuses, &Map.fetch!(copied_by_source_id, &1.id)),
         copied_by_source_id: copied_by_source_id,
         first_open: Map.fetch!(copied_by_source_id, first_open.id)
       }}
    else
      nil -> {:error, :no_open_task_status}
      error -> error
    end
  end

  def copy_workflow(_statuses), do: {:error, :empty_workflow}

  def map_ordering(ordering, resources, source_path, target_path) when is_list(ordering) do
    if Enum.all?(ordering, &is_binary/1) do
      source_paths = Enum.map(resources, source_path)
      source_paths_by_id = Map.new(source_paths, &{path_id(&1), &1})
      ordered_ids = Enum.map(ordering, &path_id/1)

      cond do
        Enum.uniq(ordered_ids) != ordered_ids ->
          {:error, :duplicate_ordering_id}

        not Enum.all?(ordered_ids, &Map.has_key?(source_paths_by_id, &1)) ->
          {:error, :foreign_ordering_id}

        true ->
          complete_ids = ordered_ids ++ (Enum.map(source_paths, &path_id/1) -- ordered_ids)
          targets_by_source_id = Map.new(resources, &{path_id(source_path.(&1)), target_path.(&1)})
          {:ok, Enum.map(complete_ids, &Map.fetch!(targets_by_source_id, &1))}
      end
    else
      {:error, :malformed_ordering_state}
    end
  end

  def map_ordering(_ordering, _resources, _source_path, _target_path), do: {:error, :malformed_ordering_state}

  def reset_kanban(state, tasks, workflow, source_path, target_path, task_status) when is_map(state) do
    state = Map.new(state, fn {key, paths} -> {to_string(key), paths} end)
    status_keys = workflow.source |> Enum.sort_by(& &1.index) |> Enum.map(&status_key/1)
    target_status_keys = Enum.map(workflow.copied, &status_key/1)
    valid_source_ids = MapSet.new(tasks, &(source_path.(&1) |> path_id()))

    with :ok <- validate_kanban_shape(state, status_keys),
         {:ok, ordered_source_ids} <- ordered_task_ids(state, status_keys, valid_source_ids),
         :ok <- validate_task_columns(state, tasks, source_path, task_status) do
      target_paths_by_source_id = Map.new(tasks, &{source_path.(&1) |> path_id(), target_path.(&1)})
      complete_ids = ordered_source_ids ++ (Enum.map(tasks, &(source_path.(&1) |> path_id())) -- ordered_source_ids)
      ordered_target_paths = Enum.map(complete_ids, &Map.fetch!(target_paths_by_source_id, &1))
      empty_state = Map.new(target_status_keys, &{&1, []})

      {:ok, Map.put(empty_state, status_key(workflow.first_open), ordered_target_paths)}
    end
  end

  def reset_kanban(_state, _tasks, _workflow, _source_path, _target_path, _task_status), do: {:error, :malformed_kanban_state}

  def date_from_offset(_start_date, nil), do: nil
  def date_from_offset(%Date{} = start_date, offset) when is_integer(offset), do: Date.add(start_date, offset)

  def offset_from_date(_start_date, nil), do: nil
  def offset_from_date(%Date{} = start_date, %Date{} = date), do: Date.diff(date, start_date)

  def due_relative_reminders(reminders) when is_list(reminders), do: Enum.filter(reminders, &Reminder.due_relative?/1)
  def due_relative_reminders(_reminders), do: []

  def status_attrs(status) do
    %{
      id: status.id,
      label: status.label,
      color: status.color,
      index: status.index,
      value: status.value,
      closed: status.closed
    }
  end

  def status_key(status), do: status.value || status.id

  def validate_workflow([]), do: {:error, :empty_workflow}

  def validate_workflow(statuses) when is_list(statuses) do
    if Enum.all?(statuses, &match?(%Status{}, &1)) do
      changesets = Enum.map(statuses, &Status.changeset(&1, %{}))
      ids = Enum.map(statuses, & &1.id)
      keys = Enum.map(statuses, &status_key/1)

      cond do
        Enum.any?(changesets, &(not &1.valid?)) -> {:error, :invalid_task_status}
        Enum.uniq(ids) != ids -> {:error, :duplicate_task_status}
        Enum.any?(keys, &is_nil/1) or Enum.uniq(keys) != keys -> {:error, :duplicate_task_status_key}
        Enum.all?(statuses, & &1.closed) -> {:error, :no_open_task_status}
        true -> :ok
      end
    else
      {:error, :invalid_task_status}
    end
  end

  def validate_workflow(_statuses), do: {:error, :empty_workflow}

  defp first_open_status(statuses) do
    statuses
    |> Enum.with_index()
    |> Enum.sort_by(fn {status, position} -> {status.index, position} end)
    |> Enum.find_value(fn {status, _position} -> if status.closed, do: nil, else: status end)
  end

  defp copy_status(status) do
    %Status{
      id: Ecto.UUID.generate(),
      label: status.label,
      color: status.color,
      index: status.index,
      value: status.value,
      closed: status.closed
    }
  end

  defp validate_kanban_shape(state, status_keys) do
    cond do
      not Enum.all?(Map.keys(state), &(&1 in status_keys)) -> {:error, :unknown_kanban_status}
      not Enum.all?(Map.values(state), &is_list/1) -> {:error, :malformed_kanban_state}
      not Enum.all?(Map.values(state), &Enum.all?(&1, fn path -> is_binary(path) end)) -> {:error, :malformed_kanban_state}
      true -> :ok
    end
  end

  defp ordered_task_ids(state, status_keys, valid_source_ids) do
    ordered_ids = status_keys |> Enum.flat_map(&Map.get(state, &1, [])) |> Enum.map(&path_id/1)

    cond do
      Enum.uniq(ordered_ids) != ordered_ids -> {:error, :duplicate_kanban_task}
      not Enum.all?(ordered_ids, &MapSet.member?(valid_source_ids, &1)) -> {:error, :foreign_kanban_task}
      true -> {:ok, ordered_ids}
    end
  end

  defp validate_task_columns(state, tasks, source_path, task_status) do
    task_statuses = Map.new(tasks, &{source_path.(&1) |> path_id(), task_status.(&1) |> status_key()})

    if Enum.any?(state, fn {key, paths} -> Enum.any?(paths, &(Map.get(task_statuses, path_id(&1)) != key)) end) do
      {:error, :mismatched_kanban_status}
    else
      :ok
    end
  end

  defp path_id(path), do: Helpers.id_without_comments(path)
end
