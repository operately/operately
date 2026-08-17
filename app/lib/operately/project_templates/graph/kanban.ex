defmodule Operately.ProjectTemplates.Graph.Kanban do
  @moduledoc """
  Transforms Kanban state while copying a project or project-template graph.

  Kanban state is a map from workflow status keys to ordered task paths. A copy
  receives fresh task and status IDs, so stored paths and status keys must be
  validated and translated before they can be persisted on the target graph.

  The path and status callbacks let this module work with the planner structs
  used by project creation, template materialization, and template duplication.
  """

  alias Operately.ProjectTemplates.Graph.Copy
  alias OperatelyWeb.Api.Helpers

  @doc """
  Builds target Kanban state with every task placed in the first open status.

  The source state is validated and used to preserve task order across its
  columns. Tasks omitted from the stored state are appended in the order they
  appear in `tasks`.

  Returns `{:ok, state}` or a validation error describing malformed status,
  task, or column references.
  """
  def reset(state, tasks, workflow, source_path, target_path, task_status) when is_map(state) do
    state = normalize_keys(state)

    # Maps have no column order, so workflow indexes define how columns are
    # flattened before all tasks are moved into the first open status.
    status_keys = workflow.source |> Enum.sort_by(& &1.index) |> Enum.map(&Copy.status_key/1)
    target_status_keys = Enum.map(workflow.copied, &Copy.status_key/1)
    valid_source_ids = MapSet.new(tasks, &(source_path.(&1) |> path_id()))

    with :ok <- validate_shape(state, status_keys),
         {:ok, ordered_source_ids} <- ordered_task_ids(state, status_keys, valid_source_ids),
         :ok <- validate_task_columns(state, tasks, source_path, task_status) do
      target_paths_by_source_id = Map.new(tasks, &{source_path.(&1) |> path_id(), target_path.(&1)})
      complete_ids = ordered_source_ids ++ (source_ids(tasks, source_path) -- ordered_source_ids)
      ordered_target_paths = Enum.map(complete_ids, &Map.fetch!(target_paths_by_source_id, &1))
      empty_state = Map.new(target_status_keys, &{&1, []})

      {:ok, Map.put(empty_state, Copy.status_key(workflow.first_open), ordered_target_paths)}
    end
  end

  def reset(_state, _tasks, _workflow, _source_path, _target_path, _task_status), do: {:error, :malformed_kanban_state}

  @doc """
  Remaps Kanban columns and task paths to their copied IDs.

  Existing column membership and task ordering are preserved. Tasks omitted
  from the stored state are appended to the copied version of the status column
  assigned on the source task.

  Returns `{:ok, state}` or a validation error describing malformed status,
  task, or column references.
  """
  def remap(state, tasks, workflow, source_path, target_path, task_status) when is_map(state) do
    state = normalize_keys(state)
    source_status_keys = Enum.map(workflow.source, &Copy.status_key/1)
    valid_source_ids = MapSet.new(tasks, &(source_path.(&1) |> path_id()))

    with :ok <- validate_shape(state, source_status_keys),
         {:ok, _ordered_source_ids} <- ordered_task_ids(state, source_status_keys, valid_source_ids),
         :ok <- validate_task_columns(state, tasks, source_path, task_status) do
      mapped = remap_existing_tasks(state, tasks, workflow, source_path, target_path)
      missing_source_ids = source_ids(tasks, source_path) -- listed_task_ids(state)

      {:ok, append_missing_tasks(mapped, missing_source_ids, tasks, workflow, source_path, target_path, task_status)}
    end
  end

  def remap(_state, _tasks, _workflow, _source_path, _target_path, _task_status), do: {:error, :malformed_kanban_state}

  defp remap_existing_tasks(state, tasks, workflow, source_path, target_path) do
    target_paths_by_source_id = Map.new(tasks, &{source_path.(&1) |> path_id(), target_path.(&1)})

    workflow.source
    |> Enum.map(fn source_status ->
      target_status = Map.fetch!(workflow.copied_by_source_id, source_status.id)

      paths =
        state
        |> Map.get(Copy.status_key(source_status), [])
        |> Enum.map(&Map.fetch!(target_paths_by_source_id, path_id(&1)))

      {Copy.status_key(target_status), paths}
    end)
    |> Map.new()
  end

  defp append_missing_tasks(mapped, missing_source_ids, tasks, workflow, source_path, target_path, task_status) do
    tasks_by_source_id = Map.new(tasks, &{source_path.(&1) |> path_id(), &1})

    Enum.reduce(missing_source_ids, mapped, fn source_id, acc ->
      task = Map.fetch!(tasks_by_source_id, source_id)
      source_status = task_status.(task)
      target_status = Map.fetch!(workflow.copied_by_source_id, source_status.id)
      target_path = target_path.(task)

      Map.update!(acc, Copy.status_key(target_status), &(&1 ++ [target_path]))
    end)
  end

  defp normalize_keys(state), do: Map.new(state, fn {key, paths} -> {to_string(key), paths} end)
  defp source_ids(tasks, source_path), do: Enum.map(tasks, &(source_path.(&1) |> path_id()))
  defp listed_task_ids(state), do: state |> Map.values() |> List.flatten() |> Enum.map(&path_id/1)

  defp validate_shape(state, status_keys) do
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
    task_statuses = Map.new(tasks, &{source_path.(&1) |> path_id(), task_status.(&1) |> Copy.status_key()})

    if Enum.any?(state, fn {key, paths} -> Enum.any?(paths, &(Map.get(task_statuses, path_id(&1)) != key)) end) do
      {:error, :mismatched_kanban_status}
    else
      :ok
    end
  end

  defp path_id(path), do: Helpers.id_without_comments(path)
end
