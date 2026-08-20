defmodule OperatelyWeb.Api.ProjectTemplates.Helpers do
  alias Operately.Tasks.Status

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

  def status_attrs(%Status{} = status), do: Map.from_struct(status)
end
