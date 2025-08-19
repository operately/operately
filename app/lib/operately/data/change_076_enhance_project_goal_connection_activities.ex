defmodule Operately.Data.Change076EnhanceProjectGoalConnectionActivities do
  import Ecto.Query, only: [from: 2]
  alias Operately.Repo
  alias Operately.Activities.Activity
  alias Operately.Goals.Goal

  def run do
    from(a in Activity, where: a.action == "project_goal_connection")
    |> Repo.all()
    |> Enum.each(fn activity ->
      goal_id = activity.content["goal_id"]

      goal_name = case get_goal(goal_id) do
        nil -> nil
        goal -> goal.name
      end

      new_content = activity.content
      |> Map.put("goal_name", goal_name)

      {:ok, _updated} = update_activity(activity, new_content)
    end)
  end

  defp get_goal(nil), do: nil
  defp get_goal(goal_id) do
    Repo.get(Goal, goal_id)
  end

  defp update_activity(activity, new_content) do
    activity
    |> Ecto.Changeset.change(%{content: new_content})
    |> Repo.update()
  end
end
