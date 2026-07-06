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

  def positions(ordering_state, milestones) when is_list(milestones) do
    ordering_state
    |> normalize(milestones)
    |> Enum.with_index()
    |> Enum.reduce(%{}, fn {ordered_id, index}, acc ->
      case Enum.find(milestones, &ids_match?(Paths.milestone_id(&1), ordered_id)) do
        nil -> acc
        milestone -> Map.put(acc, milestone.id, index)
      end
    end)
  end

  defp normalize_ordering_state(_ordering_state, []), do: []

  defp normalize_ordering_state(ordering_state, milestone_ids) do
    from_ordering =
      Enum.reduce(ordering_state, [], fn ordering_id, normalized ->
        matching_id = Enum.find(milestone_ids, &ids_match?(&1, ordering_id))

        cond do
          is_nil(matching_id) -> normalized
          id_in_list?(normalized, matching_id) -> normalized
          true -> normalized ++ [matching_id]
        end
      end)

    Enum.reduce(milestone_ids, from_ordering, fn milestone_id, normalized ->
      if id_in_list?(normalized, milestone_id), do: normalized, else: normalized ++ [milestone_id]
    end)
  end

  defp id_in_list?(list, id) do
    Enum.any?(list, &ids_match?(&1, id))
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
end
