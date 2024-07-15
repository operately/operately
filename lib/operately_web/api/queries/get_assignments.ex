defmodule OperatelyWeb.Api.Queries.GetAssignments do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo

  # def call() do

  # end

  def get_due_projects(person) do
    from(p in Operately.Projects.Project,
      join: c in assoc(p, :contributors),
      where: c.person_id == ^person.id and c.role == :champion,
      where: p.next_check_in_scheduled_at <= ^DateTime.utc_now(),
      where: p.status == "active",
      select: p
    )
    |> Repo.all()
  end

  def get_due_goals(person) do
    from(g in Operately.Goals.Goal,
      where: g.next_update_scheduled_at <= ^DateTime.utc_now(),
      where: is_nil(g.closed_at),
      where: g.champion_id == ^person.id,
      select: g
    )
    |> Repo.all()
  end

  def get_due_project_check_ins(person) do
    from(c in Operately.Projects.CheckIn,
      join: p in assoc(c, :project),
      join: contrib in assoc(p, :contributors),
      where: contrib.person_id == ^person.id and contrib.role == :reviewer,
      where: is_nil(c.acknowledged_by_id),
      select: c
    )
    |> Repo.all()
  end

  def get_due_goal_updates(person) do
    from(u in Operately.Updates.Update,
      join: g in Operately.Goals.Goal, on: u.updatable_id == g.id,
      where: g.reviewer_id == ^person.id,
      where: u.type == :goal_check_in and is_nil(u.acknowledging_person_id),
      select: u
    )
    |> Repo.all()
  end
end
