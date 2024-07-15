defmodule OperatelyWeb.Api.Queries.GetAssignments do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Repo

  import Ecto.Query, only: [from: 2]

  outputs do
    field :assignments, list_of(:assignment)
  end

  def call(conn, _inputs) do
    assignments = load_assignments(me(conn))

    {:ok, %{assignments: assignments}}
  end

  #
  # Loading data
  #

  defp load_assignments(person) do
    load_projects(person)
    |> load_goals(person)
    |> get_due_project_check_ins(person)
    |> get_due_goal_updates(person)
    |> Enum.sort(&(&1.due > &2.due))
  end

  defp load_projects(person) do
    from(p in Operately.Projects.Project,
      join: c in assoc(p, :contributors),
      where: c.person_id == ^person.id and c.role == :champion,
      where: p.next_check_in_scheduled_at <= ^DateTime.utc_now(),
      where: p.status == "active",
      select: %{
        id: p.id,
        name: p.name,
        due: p.next_check_in_scheduled_at,
        type: :project,
      }
    )
    |> Repo.all()
  end

  defp load_goals(result, person) do
    from(g in Operately.Goals.Goal,
      where: g.next_update_scheduled_at <= ^DateTime.utc_now(),
      where: is_nil(g.closed_at),
      where: g.champion_id == ^person.id,
      select: %{
        id: g.id,
        name: g.name,
        due: g.next_update_scheduled_at,
        type: :goal,
      }
    )
    |> Repo.all()
    |> Enum.concat(result)
  end

  defp get_due_project_check_ins(result, person) do
    from(c in Operately.Projects.CheckIn,
      join: p in assoc(c, :project),
      join: contrib in assoc(p, :contributors),
      join: champion in assoc(p, :champion),
      where: contrib.person_id == ^person.id and contrib.role == :reviewer,
      where: is_nil(c.acknowledged_by_id),
      select: %{
        id: c.id,
        name: p.name,
        due: c.inserted_at,
        type: :check_in,
        champion_id: champion.id,
        champion_name: champion.full_name,
      }
    )
    |> Repo.all()
    |> normalize_date()
    |> Enum.concat(result)
  end

  defp get_due_goal_updates(result, person) do
    from(u in Operately.Updates.Update,
      join: g in Operately.Goals.Goal, on: u.updatable_id == g.id,
      join: champion in assoc(g, :champion),
      where: g.reviewer_id == ^person.id,
      where: u.type == :goal_check_in and is_nil(u.acknowledging_person_id),
      select: %{
        id: u.id,
        name: g.name,
        due: u.inserted_at,
        type: :goal_update,
        champion_id: champion.id,
        champion_name: champion.full_name,
      }
    )
    |> Repo.all()
    |> normalize_date()
    |> Enum.concat(result)
  end

  defp normalize_date(items) do
    Enum.map(items, fn item ->
      Map.merge(item, %{due: DateTime.from_naive!(item.due, "Etc/UTC")})
    end)
  end
end
