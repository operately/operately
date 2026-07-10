defmodule Operately.Data.Change031AddRetrospectiveToProjectClosedActivity do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Activities.Activity
  alias __MODULE__.{Project, Retrospective}

  def run do
    Repo.transaction(fn ->
      from(a in Activity, where: a.action == "project_closed")
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
    project_id = activity.content["project_id"]

    project =
      from(p in Project, where: p.id == ^project_id)
      |> Repo.one()

    retrospective =
      from(r in Retrospective, where: r.project_id == ^project_id)
      |> Repo.one()

    case {project, retrospective} do
      {%{group_id: group_id}, %{id: id}} ->
        content =
          activity.content
          |> Map.put(:retrospective_id, id)
          |> Map.put(:space_id, group_id)

        activity
        |> Activity.changeset(%{content: content})
        |> Repo.update()

      _ ->
        :ok
    end
  end

  defmodule Project do
    use Operately.Schema

    schema "projects" do
      field :group_id, :binary_id

      timestamps()
    end
  end

  defmodule Retrospective do
    use Operately.Schema

    schema "project_retrospectives" do
      field :project_id, :binary_id

      timestamps()
    end
  end
end
