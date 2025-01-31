defmodule Operately.Assignments.Loader do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Goals.{Goal, Update}
  alias Operately.Projects.{Project, CheckIn}
  alias Operately.Assignments.{Assignment, FilterLateAssignments}

  @doc """
  Loads assignments for a given person and late assignments
  from people who report to the given person.

  Returns a keyword list with two assignment groups:
  [
    mine: [%Assignment{}],    # Person's direct assignments
    reports: [%Assignment{}], # Late assignments from people who report to the person
  ]
  """
  def load(person, company) do
    reports = load_reports(person)

    tasks = load_all_assignments(person, reports)
    {person_assignments, reports_assignments} = separate_assignments(tasks, person)

    late_assignments = FilterLateAssignments.filter(reports_assignments, reports, person)

    [
      mine: Assignment.build(person_assignments, company),
      reports: Assignment.build(late_assignments, company),
    ]
  end

  defp load_all_assignments(person, reports) do
    person_ids = extract_ids(person, reports)

    [
      Task.async(fn -> load_projects(person.id, person_ids) end),
      Task.async(fn -> load_goals(person.id, person_ids) end),
      Task.async(fn -> load_late_project_check_ins(person_ids) end),
      Task.async(fn -> load_late_goal_updates(person_ids) end),
    ]
    |> Task.await_many()
    |> List.flatten()
  end

  defp load_projects(person_id, all_person_ids) do
    from(p in Project,
      join: champion in assoc(p, :champion),
      join: reviewer in assoc(p, :reviewer),
      where: champion.id in ^all_person_ids or reviewer.id == ^person_id,
      where: p.next_check_in_scheduled_at <= ^DateTime.utc_now(),
      where: p.status == "active",
      preload: [champion: champion, reviewer: reviewer]
    )
    |> Repo.all()
  end

  defp load_goals(person_id, all_person_ids) do
    from(g in Goal,
      where: g.next_update_scheduled_at <= ^DateTime.utc_now(),
      where: is_nil(g.closed_at),
      where: g.champion_id in ^all_person_ids or g.reviewer_id == ^person_id
    )
    |> Repo.all()
  end

  defp load_late_project_check_ins(person_ids) do
    from(c in CheckIn,
      join: project in assoc(c, :project),
      join: author in assoc(c, :author),
      join: reviewer in assoc(project, :reviewer),
      where: reviewer.id in ^person_ids,
      where: is_nil(c.acknowledged_by_id),
      preload: [project: {project, reviewer: reviewer}, author: author]
    )
    |> Repo.all()
  end

  defp load_late_goal_updates(person_ids) do
    from(u in Update,
      join: goal in assoc(u, :goal),
      join: author in assoc(u, :author),
      where: goal.reviewer_id in ^person_ids,
      where: is_nil(goal.deleted_at),
      where: is_nil(u.acknowledged_by_id),
      preload: [goal: goal, author: author]
    )
    |> Repo.all()
  end

  @doc """
  Fetches a list of all the employees under that person in the
  company's hierarchy based on the manager_id property.

  Returns a list of `{person_id, management_level}` tuples
  `management_level` indicates the depth in the management chain:
    - 0: Directly under the given person
    - 1: Under the people who are directly under the given person
    - 2: etc...

  The `management_level` is used later to determine notification thresholds:
  - Level 0 (direct reports): Shorter notification threshold (e.g., 3 business days)
  - Level 1+ (indirect reports): Longer notification threshold (e.g., 10 business days)
  """
  def load_reports(person) do
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
    {:ok, %{rows: result}} = Repo.query(query, [person_id])

    Enum.map(result, fn [id, level] ->
      {:ok, id} = Ecto.UUID.cast(id)
      {id, level}
    end)
  end

  defp extract_ids(person, reports) do
    ids = Enum.map(reports, fn {id, _} -> id end)
    [person.id | ids]
  end

  defp separate_assignments(tasks, person) do
    Enum.split_with(tasks, fn
      %Project{champion: champion} ->
        champion.id == person.id

      %Goal{champion_id: champion_id} ->
        champion_id == person.id

      %CheckIn{project: project} ->
        project.reviewer.id == person.id

      %Update{goal: goal} ->
        goal.reviewer_id == person.id

      _ ->
        false
    end)
  end
end
