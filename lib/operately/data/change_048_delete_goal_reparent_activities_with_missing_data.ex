defmodule Operately.Data.Change048DeleteGoalReparentActivitiesWithMissingData do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Activities.Activity

  def run do
    Repo.transaction(fn ->
      fetch_activities()
      |> delete_activities()
    end)
  end

  defp fetch_activities do
    from(a in Activity, where: a.action == "goal_reparent")
    |> Repo.all()
  end

  defp delete_activities(activities) do
    ids = find_activities_without_goal(activities)
    count = length(ids)

    {^count, nil} = from(a in Activity, where: a.id in ^ids)
    |> Repo.delete_all()
  end

  defp find_activities_without_goal(activities) do
    activities
    |> Enum.filter(fn a -> not Map.has_key?(a.content, "goal_id") end)
    |> Enum.map(& &1.id)
  end
end
