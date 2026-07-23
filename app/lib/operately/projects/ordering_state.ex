defmodule Operately.Projects.OrderingState do
  @moduledoc """
  Manages the ordering of milestones within a project using a list of short milestone IDs.
  """

  alias OperatelyWeb.Api.Helpers
  alias OperatelyWeb.Paths

  def load(nil), do: initialize()
  def load(list) when is_list(list), do: list
  def load(_), do: initialize()

  def initialize do
    []
  end

  def ids_match?(id1, id2) do
    Helpers.id_without_comments(id1) == Helpers.id_without_comments(id2)
  end

  def normalize(ordering_state, milestones) when is_list(milestones) do
    milestone_ids = Enum.map(milestones, &Paths.milestone_id/1)
    normalize_ordering_state(load(ordering_state), milestone_ids)
  end

  @doc """
  Returns milestones ordered according to the project's ordering state.

  Unknown IDs in the ordering state are dropped. Before applying the ordering
  state, milestones are sorted by deadline (earliest first, undated last), then
  by title. Milestones missing from the ordering state are appended in that
  fallback order.
  """
  def ordered(ordering_state, milestones) when is_list(milestones) do
    milestones = sort_by_deadline_then_title(milestones)
    milestones_by_id = Map.new(milestones, &{Paths.milestone_id(&1), &1})

    ordering_state
    |> normalize(milestones)
    |> Enum.map(&Map.fetch!(milestones_by_id, &1))
  end

  defp sort_by_deadline_then_title(milestones) do
    Enum.sort_by(milestones, fn milestone ->
      deadline = Operately.ContextualDates.Timeframe.end_date(milestone.timeframe)
      {deadline_sort_key(deadline), milestone.title || ""}
    end)
  end

  # Use {year, month, day} — Date structs do not sort chronologically under term order.
  # nil deadlines sort after dated milestones.
  defp deadline_sort_key(nil), do: {1, {9999, 12, 31}}
  defp deadline_sort_key(date), do: {0, Date.to_erl(date)}

  @doc """
  Returns where each milestone sits in the project's ordering.

  The result is a map of `milestone.id => position`, where position is 0 for first, 1 for second, and so on.
  Milestones not in the ordering state are left out. Used to break ties between pending milestones.
  """
  def positions(ordering_state, milestones) when is_list(milestones) do
    milestones_by_normalized_id =
      Enum.reduce(milestones, %{}, fn milestone, acc ->
        normalized_id = Helpers.id_without_comments(Paths.milestone_id(milestone))
        Map.put(acc, normalized_id, milestone)
      end)

    ordering_state
    |> normalize(milestones)
    |> Enum.with_index()
    |> Enum.reduce(%{}, fn {ordered_id, index}, acc ->
      normalized_id = Helpers.id_without_comments(ordered_id)

      case Map.get(milestones_by_normalized_id, normalized_id) do
        nil -> acc
        milestone -> Map.put(acc, milestone.id, index)
      end
    end)
  end

  def add_milestone(ordering_state, milestone, index \\ nil) do
    milestone_short_id = OperatelyWeb.Paths.milestone_id(milestone)

    ordering_state =
      ordering_state
      |> List.delete(milestone_short_id)

    case index do
      nil -> ordering_state ++ [milestone_short_id]
      idx -> List.insert_at(ordering_state, idx, milestone_short_id)
    end
  end

  def remove_milestone(ordering_state, milestone) do
    milestone_short_id = OperatelyWeb.Paths.milestone_id(milestone)
    List.delete(ordering_state, milestone_short_id)
  end

  # Reconcile the saved ordering with the current milestones: keep the saved order,
  # drop removed milestones, dedupe, then append any new milestones at the end.
  defp normalize_ordering_state(_ordering_state, []), do: []

  defp normalize_ordering_state(ordering_state, milestone_ids) do
    # Keep saved order for milestones that still exist.
    from_ordering =
      Enum.reduce(ordering_state, [], fn ordering_id, normalized ->
        matching_id = Enum.find(milestone_ids, &ids_match?(&1, ordering_id))

        cond do
          is_nil(matching_id) -> normalized
          id_in_list?(normalized, matching_id) -> normalized
          true -> normalized ++ [matching_id]
        end
      end)

    # Append milestones not yet in the ordering state.
    Enum.reduce(milestone_ids, from_ordering, fn milestone_id, normalized ->
      if id_in_list?(normalized, milestone_id), do: normalized, else: normalized ++ [milestone_id]
    end)
  end

  defp id_in_list?(list, id) do
    Enum.any?(list, &ids_match?(&1, id))
  end
end
