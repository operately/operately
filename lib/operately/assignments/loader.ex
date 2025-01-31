defmodule Operately.Assignments.Loader do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Assignments.Assignment

  def load(person, company) do
    reports = load_reports(person)

    tasks = load_all_tasks(person, reports)
    {person_tasks, _reports_tasks} = separate_reports_tasks(tasks, person)

    Assignment.build(person_tasks, company)
  end

  defp load_all_tasks(person, reports) do
    person_ids = extract_ids(person, reports)

    [
      Task.async(fn -> load_projects(person.id, person_ids) end),
      Task.async(fn -> load_goals(person.id, person_ids) end),
      Task.async(fn -> load_due_project_check_ins(person_ids) end),
      Task.async(fn -> load_due_goal_updates(person_ids) end),
    ]
    |> Task.await_many()
    |> List.flatten()
  end

  defp load_projects(person_id, all_person_ids) do
    from(p in Operately.Projects.Project,
      join: champion in assoc(p, :champion),
      join: reviewer in assoc(p, :reviewer),
      where: champion.id in ^all_person_ids or reviewer.id == ^person_id,
      where: p.next_check_in_scheduled_at <= ^DateTime.utc_now(),
      where: p.status == "active",
      preload: [champion: champion]
    )
    |> Repo.all()
  end

  defp load_goals(person_id, all_person_ids) do
    from(g in Operately.Goals.Goal,
      where: g.next_update_scheduled_at <= ^DateTime.utc_now(),
      where: is_nil(g.closed_at),
      where: g.champion_id in ^all_person_ids or g.reviewer_id == ^person_id
    )
    |> Repo.all()
  end

  defp load_due_project_check_ins(person_ids) do
    from(c in Operately.Projects.CheckIn,
      join: project in assoc(c, :project),
      join: author in assoc(c, :author),
      join: reviewer in assoc(project, :reviewer),
      where: reviewer.id in ^person_ids,
      where: is_nil(c.acknowledged_by_id),
      preload: [project: {project, reviewer: reviewer}, author: author]
    )
    |> Repo.all()
  end

  defp load_due_goal_updates(person_ids) do
    from(u in Operately.Goals.Update,
      join: goal in assoc(u, :goal),
      join: author in assoc(u, :author),
      where: goal.reviewer_id in ^person_ids,
      where: is_nil(goal.deleted_at),
      where: is_nil(u.acknowledged_by_id),
      preload: [goal: goal, author: author]
    )
    |> Repo.all()
  end

  defp load_reports(person) do
    query = """
    WITH RECURSIVE reports AS (
      SELECT id, 0 AS level
      FROM people
      WHERE manager_id = $1

      UNION ALL

      SELECT p.id, r.level + 1 AS level
      FROM people p
      INNER JOIN reports r ON p.manager_id = r.id
    )
    SELECT * FROM reports
    """

    {:ok, person_id} = Ecto.UUID.dump(person.id)
    {:ok, %{rows: result}} = Operately.Repo.query(query, [person_id])

    Enum.map(result, fn [id, level] ->
      {:ok, id} = Ecto.UUID.cast(id)
      {id, level}
    end)
  end

  defp extract_ids(person, reports) do
    ids = Enum.map(reports, fn {id, _} -> id end)
    [person.id | ids]
  end

  defp separate_reports_tasks(tasks, person) do
    Enum.split_with(tasks, fn
      %Operately.Projects.Project{champion: champion} ->
        champion.id == person.id

      %Operately.Goals.Goal{champion_id: champion_id} ->
        champion_id == person.id

      %Operately.Projects.CheckIn{project: project} ->
        project.reviewer.id == person.id

      %Operately.Goals.Update{goal: goal} ->
        goal.reviewer_id == person.id

      _ ->
        false
    end)
  end
end
