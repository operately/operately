defmodule Operately.Projects.OrderingState do
  @moduledoc """
  Manages the ordering of milestones within a project using a list of short milestone IDs.
  """

  def load(nil), do: initialize()
  def load(list) when is_list(list), do: list
  def load(_), do: initialize()

  def initialize do
    []
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
