defmodule Operately.Data.Change037AddSpaceToGoalUpdateActivities do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Activities.Activity
  alias Operately.Goals.Goal

  def run do
    Repo.transaction(fn ->
      from(a in Activity,
        where: a.action in [
          "goal_check_in",
          "goal_check_in_acknowledgement",
          "goal_check_in_commented",
        ]
      )
      |> Repo.all()
      |> update_activities()
    end)
  end

  defp update_activities(activities) when is_list(activities) do
    Enum.each(activities, fn a ->
      update_activities(a)
    end)
  end

  defp update_activities(activity) do
    Goal.get(:system, id: activity.content["goal_id"], opts: [
      with_deleted: true,
    ])
    |> case do
      {:ok, %{group_id: space_id}} ->
        content = Map.put(activity.content, :space_id, space_id)

        {:ok, _} = Activity.changeset(activity, %{content: content})
        |> Repo.update()

      _ ->
        :ok
    end
  end
end
