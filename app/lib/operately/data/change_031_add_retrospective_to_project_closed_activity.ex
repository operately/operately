defmodule Operately.Data.Change031AddRetrospectiveToProjectClosedActivity do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Activities.Activity
  alias Operately.Projects.Project

  def run do
    Repo.transaction(fn ->
      from(a in Activity,
        where: a.action == "project_closed"
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
    {:ok, project} = Project.get(:system, id: activity.content["project_id"], opts: [
      with_deleted: true,
      preload: :retrospective
    ])

    case project.retrospective do
      %{id: id} ->
        content =
          activity.content
          |> Map.put(:retrospective_id, id)
          |> Map.put(:space_id, project.group_id)

        Activity.changeset(activity, %{content: content})
        |> Repo.update()

      _ -> :ok
    end
  end
end
