defmodule Operately.Goals.Permissions do
  defstruct [
    :can_edit,
    :can_check_in,
    :can_acknowledge_check_in,
    :can_close,
    :can_archive,
  ]

  def calculate(goal, user) do
    %__MODULE__{
      can_edit: is_champion?(goal, user) || is_reviewer?(goal, user),
      can_check_in: is_champion?(goal, user) || is_reviewer?(goal, user),
      can_acknowledge_check_in: is_reviewer?(goal, user),
      can_close: is_champion?(goal, user) || is_reviewer?(goal, user),
      can_archive: is_champion?(goal, user) || is_reviewer?(goal, user),
    }
  end

  # ---

  defp is_champion?(goal, user) do
    goal.champion_id == user.id
  end

  defp is_reviewer?(goal, user) do
    goal.reviewer_id == user.id
  end
end
