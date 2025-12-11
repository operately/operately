defmodule Operately.Tasks.KanbanState do
  alias Operately.Tasks.Status
  alias Operately.Tasks.Task

  defstruct state: %{}

  def load(state, statuses \\ default_statuses())

  def load(nil, statuses), do: initialize(statuses)

  def load(map, statuses) do
    normalized = normalize_keys(map || %{})
    statuses = normalize_statuses(statuses ++ Map.keys(normalized))

    Enum.into(statuses, %{}, fn status ->
      {status, normalize_list(Map.get(normalized, status, []))}
    end)
  end

  def initialize() do
    initialize(default_statuses())
  end

  def initialize(statuses) when is_list(statuses) do
    statuses
    |> normalize_statuses()
    |> Enum.into(%{}, fn status -> {String.to_atom(status), []} end)
  end

  def default_statuses do
    Status.default_task_statuses()
    |> Enum.map(fn status -> status.value || status.id end)
    |> Enum.filter(& &1)
    |> normalize_statuses()
  end

  def add(kanban_state, task = %Task{}, status, column_index) do
    task_short_id = OperatelyWeb.Paths.task_id(task)

    kanban_state
    |> Map.update(status, [task_short_id], &List.insert_at(&1, column_index, task_short_id))
  end

  def remove(kanban_state, task = %Task{}, status) do
    task_short_id = OperatelyWeb.Paths.task_id(task)

    kanban_state
    |> Map.update(status, [], &List.delete(&1, task_short_id))
  end

  def move(kanban_state, task = %Task{}, from_status, _from_index, to_status, to_index) do
    task_short_id = OperatelyWeb.Paths.task_id(task)

    kanban_state
    |> Map.update(from_status, [], &List.delete(&1, task_short_id))
    |> insert_at(to_status, task_short_id, to_index)
  end

  defp insert_at(kanban_state, status, task_short_id, to_index) do
    kanban_state
    |> Map.update!(status, fn list ->
      index = clamp_index(list, to_index)
      List.insert_at(list, index, task_short_id)
    end)
  end

  defp clamp_index(list, index) when is_integer(index) do
    max = max(length(list), 0)

    cond do
      index < 0 -> 0
      index > max -> max
      true -> index
    end
  end

  defp clamp_index(list, _index), do: length(list)

  defp normalize_statuses(statuses) do
    statuses
    |> Enum.map(&to_string/1)
    |> Enum.reject(&(&1 == ""))
    |> Enum.uniq()
  end

  defp normalize_keys(map) do
    map
    |> Enum.reduce(%{}, fn {key, value}, acc ->
      Map.put(acc, normalize_statuses([key]) |> hd(), normalize_list(value))
    end)
  end

  defp normalize_list(list) when is_list(list), do: list
  defp normalize_list(item) when is_nil(item), do: []
  defp normalize_list(item), do: [item]
end
