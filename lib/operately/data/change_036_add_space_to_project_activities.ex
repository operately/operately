defmodule Operately.Data.Change036AddSpaceToProjectActivities do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Activities.Activity
  alias Operately.Projects.Project

  def run do
    Repo.transaction(fn ->
      from(a in Activity,
        where: a.action in [
          "project_archived",
          "project_goal_connection",
          "project_goal_disconnection",
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
    Project.get(:system, id: activity.content["project_id"], opts: [
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
