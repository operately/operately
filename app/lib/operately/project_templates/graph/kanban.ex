defmodule Operately.ProjectTemplates.Graph.Kanban do
  @moduledoc """
  Transforms Kanban state while copying a project or project-template graph.

  Kanban state is a map from workflow status keys to ordered task paths. A copy
  receives fresh task and status IDs, so stored paths and status keys must be
  translated before they can be persisted on the target graph.

  Copying is always graceful: unknown status keys and foreign task IDs are
  dropped, and tasks missing from the source state are appended to the column
  matching their status. Malformed non-map state is treated as empty.
  """

  alias Operately.ProjectTemplates.Graph.Copy
  alias OperatelyWeb.Api.Helpers

  @doc """
  Remaps Kanban columns and task paths to their copied IDs.

  Existing column membership and task ordering are preserved for known tasks.
  Tasks omitted from the stored state are appended to the copied version of the
  status column assigned on the source task. Foreign IDs and unknown status
  keys are dropped.

  Always returns `{:ok, state}`.
  """
  def remap(state, tasks, workflow, source_path, target_path, task_status) do
    state = normalize_state(state)
    target_paths_by_source_id = Map.new(tasks, &{source_path.(&1) |> path_id(), target_path.(&1)})
    target_status_keys = Enum.map(workflow.copied, &Copy.status_key/1)
    empty = Map.new(target_status_keys, &{&1, []})

    {mapped, listed_source_ids} =
      Enum.reduce(workflow.source, {empty, []}, fn source_status, {acc, listed} ->
        target_status = Map.fetch!(workflow.copied_by_source_id, source_status.id)
        target_key = Copy.status_key(target_status)

        source_ids_in_column =
          state
          |> Map.get(Copy.status_key(source_status), [])
          |> Enum.map(&path_id/1)
          |> Enum.uniq()
          |> Enum.filter(&Map.has_key?(target_paths_by_source_id, &1))

        paths = Enum.map(source_ids_in_column, &Map.fetch!(target_paths_by_source_id, &1))

        {
          Map.put(acc, target_key, Map.get(acc, target_key, []) ++ paths),
          listed ++ source_ids_in_column
        }
      end)

    missing_source_ids = source_ids(tasks, source_path) -- listed_source_ids

    {:ok, append_missing_tasks(mapped, missing_source_ids, tasks, workflow, source_path, target_path, task_status)}
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

  defp normalize_state(state) when is_map(state) do
    Map.new(state, fn {key, paths} ->
      list = if is_list(paths), do: Enum.filter(paths, &is_binary/1), else: []
      {to_string(key), list}
    end)
  end

  defp normalize_state(_state), do: %{}

  defp source_ids(tasks, source_path), do: Enum.map(tasks, &(source_path.(&1) |> path_id()))
  defp path_id(path), do: Helpers.id_without_comments(path)
end
