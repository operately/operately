defmodule Operately.Data.Change082PopulateGoalDescriptionChangedActivityGoalName do
  import Ecto.Query, only: [from: 2]

  alias Ecto.Changeset
  alias Operately.Repo
  alias Operately.Activities.Activity
  alias Operately.Goals.Goal

  def run do
    from(a in Activity, where: a.action == "goal_description_changed")
    |> Repo.all()
    |> Enum.each(&maybe_update_activity/1)
  end

  defp maybe_update_activity(%Activity{} = activity) do
    cond do
      Map.has_key?(activity.content, "goal_name") -> :ok
      Map.has_key?(activity.content, :goal_name) -> :ok
      true ->
        goal_id = activity.content["goal_id"] || activity.content[:goal_id]
        goal_name = fetch_goal_name(goal_id)

        activity.content
        |> Map.put("goal_name", goal_name)
        |> persist(activity)
    end
  end

  defp fetch_goal_name(nil), do: nil

  defp fetch_goal_name(goal_id) do
    case Repo.get(Goal, goal_id) do
      nil -> nil
      goal -> goal.name
    end
  end

  defp persist(new_content, %Activity{} = activity) do
    if new_content != activity.content do
      activity
      |> Changeset.change(%{content: new_content})
      |> Repo.update!()
    else
      :ok
    end
  end
end

