defmodule Operately.Data.Change062SetGoalSuccessStatus do
  import Ecto.Query

  alias Operately.Repo
  alias Operately.Goals.Goal

  def run do
    Goal
    |> where([g], not is_nil(g.closed_at) or not is_nil(g.success))
    |> Repo.all()
    |> Enum.each(fn goal ->
      update_success_status(goal)
    end)
  end

  defp update_success_status(goal) do
    success_status = if goal.success == "yes", do: :achieved, else: :missed

    goal
    |> Ecto.Changeset.change(%{success_status: success_status})
    |> Repo.update!()
  end
end
