defmodule Operately.Goals.Permissions do
  def calculate(goal, user) do
    %{
      can_check_in: is_champion?(goal, user),
    }
  end

  # ---

  defp is_champion?(goal, user) do
    goal.champion_id == user.id
  end
end
