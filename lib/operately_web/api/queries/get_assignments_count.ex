defmodule OperatelyWeb.Api.Queries.GetAssignmentsCount do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Repo

  import Ecto.Query, only: [from: 2]

  outputs do
    field :count, :integer
  end

  def call(conn, _inputs) do
    count = load_assignments_count(me(conn))

    {:ok, %{count: count}}
  end

  #
  # Loading data
  #

  defp load_assignments_count(person) do
    count_due_projects(person)
    |> count_due_goals(person)
    |> count_due_project_check_ins(person)
    |> count_due_goal_updates(person)
  end

  defp count_due_projects(person) do
    from(p in Operately.Projects.Project,
      join: c in assoc(p, :contributors),
      where: c.person_id == ^person.id and c.role == :champion,
      where: p.next_check_in_scheduled_at <= ^DateTime.utc_now(),
      where: p.status == "active"
      )
    |> Repo.aggregate(:count, :id)
  end

  defp count_due_goals(result, person) do
    count = from(g in Operately.Goals.Goal,
        where: g.next_update_scheduled_at <= ^DateTime.utc_now(),
        where: is_nil(g.closed_at),
        where: g.champion_id == ^person.id
      )
      |> Repo.aggregate(:count, :id)

    count + result
  end

  defp count_due_project_check_ins(result, person) do
    count = from(c in Operately.Projects.CheckIn,
        join: p in assoc(c, :project),
        join: contrib in assoc(p, :contributors),
        where: contrib.person_id == ^person.id and contrib.role == :reviewer,
        where: is_nil(c.acknowledged_by_id)
      )
      |> Repo.aggregate(:count, :id)

    count + result
  end

  defp count_due_goal_updates(result, person) do
    count = from(u in Operately.Updates.Update,
        join: g in Operately.Goals.Goal, on: u.updatable_id == g.id,
        where: g.reviewer_id == ^person.id,
        where: u.type == :goal_check_in and is_nil(u.acknowledging_person_id)
      )
      |> Repo.aggregate(:count, :id)

    count + result
  end
end
