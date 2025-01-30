defmodule Operately.Assignments.Loader do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Assignments.Assignment

  def load(person, company) do
    person
    |> load_all()
    |> Assignment.build(company)
  end

  defp load_all(person) do
    [
      Task.async(fn -> load_projects(person) end),
      Task.async(fn -> load_goals(person) end),
      Task.async(fn -> load_due_project_check_ins(person) end),
      Task.async(fn -> load_due_milestones(person) end),
      Task.async(fn -> load_due_goal_updates(person) end),
    ]
    |> Task.await_many()
    |> List.flatten()
  end

  defp load_projects(person) do
    from(p in Operately.Projects.Project,
      join: champion in assoc(p, :champion),
      where: champion.id == ^person.id,
      where: p.next_check_in_scheduled_at <= ^DateTime.utc_now(),
      where: p.status == "active"
    )
    |> Repo.all()
  end

  defp load_goals(person) do
    from(g in Operately.Goals.Goal,
      where: g.next_update_scheduled_at <= ^DateTime.utc_now(),
      where: is_nil(g.closed_at),
      where: g.champion_id == ^person.id
    )
    |> Repo.all()
  end

  defp load_due_project_check_ins(person) do
    from(c in Operately.Projects.CheckIn,
      join: project in assoc(c, :project),
      join: author in assoc(c, :author),
      join: contrib in assoc(project, :contributors),
      where: contrib.person_id == ^person.id and contrib.role == :reviewer,
      where: is_nil(c.acknowledged_by_id),
      preload: [project: project, author: author]
    )
    |> Repo.all()
  end

  defp load_due_milestones(person) do
    from(m in Operately.Projects.Milestone,
      join: project in assoc(m, :project),
      join: champion in assoc(project, :champion),
      where: champion.id == ^person.id,
      where: m.deadline_at <= ^DateTime.utc_now() and is_nil(m.completed_at)
    )
    |> Repo.all()
  end

  defp load_due_goal_updates(person) do
    from(u in Operately.Goals.Update,
      join: goal in assoc(u, :goal),
      join: author in assoc(u, :author),
      where: goal.reviewer_id == ^person.id,
      where: is_nil(goal.deleted_at),
      where: is_nil(u.acknowledged_by_id),
      preload: [goal: goal, author: author]
    )
    |> Repo.all()
  end
end
