defmodule OperatelyWeb.Api.ProjectTemplates.Helpers do
  alias Operately.Tasks.Status
  alias OperatelyWeb.Paths

  def validate_workflow(attrs) do
    if Map.has_key?(attrs, :task_statuses) do
      statuses = attrs.task_statuses
      ids = Enum.map(statuses, &(Map.get(&1, :id) || Map.get(&1, "id")))
      values = Enum.map(statuses, &(Map.get(&1, :value) || Map.get(&1, "value")))

      cond do
        statuses == [] -> {:error, {:validation, "At least one task status is required"}}
        Enum.uniq(ids) != ids -> {:error, {:validation, "Task status IDs must be unique"}}
        Enum.uniq(values) != values -> {:error, {:validation, "Task status values must be unique"}}
        true -> :ok
      end
    else
      :ok
    end
  end

  def canonical_status(template, nil) do
    case List.first(template.task_statuses) do
      nil -> {:error, {:validation, "At least one task status is required"}}
      status -> {:ok, status}
    end
  end

  def canonical_status(template, status) do
    status_id = Map.get(status, :id) || Map.get(status, "id")

    case Enum.find(template.task_statuses, &(&1.id == status_id)) do
      nil -> {:error, {:validation, "Invalid task status"}}
      status -> {:ok, status}
    end
  end

  def validate_replacements(replacements, deleted_ids, new_ids) do
    replacement_map = Map.new(replacements, &{&1.deleted_status_id, &1.replacement_status_id})

    valid? =
      Enum.all?(replacement_map, fn {deleted_id, replacement_id} ->
        MapSet.member?(deleted_ids, deleted_id) and MapSet.member?(new_ids, replacement_id)
      end)

    if valid?, do: {:ok, replacement_map}, else: {:error, {:validation, "Invalid task status replacement"}}
  end

  def replacement_status(old_status_id, replacement_map, statuses_by_id) do
    with {:ok, replacement_id} <- Map.fetch(replacement_map, old_status_id),
         {:ok, status} <- Map.fetch(statuses_by_id, replacement_id) do
      {:ok, status}
    else
      _ -> {:error, {:validation, "Every deleted task status in use requires a replacement"}}
    end
  end

  def validate_ordering(ordering, valid_ids, error_message) when is_list(ordering) do
    provided = Enum.uniq(ordering)

    if Enum.all?(provided, &(&1 in valid_ids)) do
      {:ok, provided ++ (valid_ids -- provided)}
    else
      {:error, {:validation, error_message}}
    end
  end

  def validate_ordering(_ordering, _valid_ids, error_message), do: {:error, {:validation, error_message}}

  def normalize_ordering(ordering, valid_ids) do
    ordering
    |> List.wrap()
    |> Enum.filter(&(&1 in valid_ids))
    |> Enum.uniq()
    |> then(&(&1 ++ (valid_ids -- &1)))
  end

  @doc "Rejects unknown status keys, non-lists, duplicate/foreign task IDs, and column/status mismatches; returns normalized state on success."
  def validate_kanban(state, tasks, statuses) when is_map(state) do
    allowed_keys = status_keys(statuses)
    normalized = stringify_keys(state)

    cond do
      not Enum.all?(Map.keys(normalized), &(&1 in allowed_keys)) -> {:error, {:validation, "Kanban state contains an unknown status"}}
      not Enum.all?(Map.values(normalized), &is_list/1) -> {:error, {:validation, "Kanban state must contain task ID lists"}}
      true -> validate_kanban_tasks(normalized, tasks, statuses)
    end
  end

  def validate_kanban(_state, _tasks, _statuses), do: {:error, {:validation, "Kanban state must be an object"}}

  @doc "Drops foreign IDs, appends missing tasks, and rebuilds columns from each task's status while preserving relative order."
  def normalize_kanban(state, tasks, statuses) do
    allowed_keys = status_keys(statuses)
    valid_ids = Enum.map(tasks, &Paths.project_template_task_id/1)
    state = stringify_keys(state)

    ordered_ids =
      allowed_keys
      |> Enum.flat_map(&List.wrap(Map.get(state, &1, [])))
      |> Enum.filter(&(&1 in valid_ids))
      |> Enum.uniq()
      |> then(&(&1 ++ (valid_ids -- &1)))

    kanban_from_order(ordered_ids, tasks, statuses)
  end

  @doc "Flattens Kanban columns into a single task-ID list in status order."
  def flatten_kanban(state, statuses) do
    state = stringify_keys(state)
    statuses |> status_keys() |> Enum.flat_map(&List.wrap(Map.get(state, &1, [])))
  end

  @doc "Builds Kanban state by placing each task ID into the column matching its status, preserving `task_ids` order within columns."
  def kanban_from_order(task_ids, tasks, statuses) do
    allowed_keys = status_keys(statuses)
    task_statuses = Map.new(tasks, &{Paths.project_template_task_id(&1), status_key(&1.task_status)})
    valid_ids = Enum.map(tasks, &Paths.project_template_task_id/1)

    ordered_ids =
      task_ids
      |> Enum.filter(&(&1 in valid_ids))
      |> Enum.uniq()
      |> then(&(&1 ++ (valid_ids -- &1)))

    Map.new(allowed_keys, fn key -> {key, Enum.filter(ordered_ids, &(task_statuses[&1] == key))} end)
  end

  def status_attrs(%Status{} = status), do: Map.from_struct(status)

  defp validate_kanban_tasks(state, tasks, statuses) do
    valid_ids = Enum.map(tasks, &Paths.project_template_task_id/1)
    provided_ids = state |> Map.values() |> List.flatten()

    cond do
      Enum.uniq(provided_ids) != provided_ids -> {:error, {:validation, "Kanban state contains duplicate task IDs"}}
      not Enum.all?(provided_ids, &(&1 in valid_ids)) -> {:error, {:validation, "Kanban state contains IDs from another template container"}}
      tasks_in_wrong_columns?(state, tasks) -> {:error, {:validation, "Kanban task status does not match its column"}}
      true -> {:ok, normalize_kanban(state, tasks, statuses)}
    end
  end

  defp tasks_in_wrong_columns?(state, tasks) do
    task_statuses = Map.new(tasks, &{Paths.project_template_task_id(&1), status_key(&1.task_status)})
    Enum.any?(state, fn {column, ids} -> Enum.any?(ids, &(task_statuses[&1] != column)) end)
  end

  defp stringify_keys(state), do: Map.new(state || %{}, fn {key, value} -> {to_string(key), value} end)
  defp status_keys(statuses), do: Enum.map(statuses, &status_key/1)
  defp status_key(status), do: status.value || status.id
end
