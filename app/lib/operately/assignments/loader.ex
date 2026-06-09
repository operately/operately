defmodule Operately.Assignments.Loader do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Goals.{Goal, Update}
  alias Operately.Projects.{Project, CheckIn, Milestone}
  alias Operately.Assignments.Assignment

  @due_soon_window_in_days 1

  def load(person, company) do
    [
      Task.async(fn -> load_pending_project_check_ins(company, person) end),
      Task.async(fn -> load_pending_project_check_in_acknowledgements(company, person) end),
      Task.async(fn -> load_pending_goal_updates(company, person) end),
      Task.async(fn -> load_pending_goal_update_acknowledgements(company, person) end),
      Task.async(fn -> load_pending_tasks(company, person) end),
      Task.async(fn -> load_pending_space_tasks(company, person) end),
      Task.async(fn -> load_pending_milestones(company, person) end)
    ]
    |> Task.await_many()
    |> List.flatten()
  end

  def count(person) do
    [
      Task.async(fn -> count_pending_project_check_ins(person) end),
      Task.async(fn -> count_pending_project_check_in_acknowledgements(person) end),
      Task.async(fn -> count_pending_goal_updates(person) end),
      Task.async(fn -> count_pending_goal_update_acknowledgements(person) end),
      Task.async(fn -> count_pending_tasks(person) end),
      Task.async(fn -> count_pending_space_tasks(person) end),
      Task.async(fn -> count_pending_milestones(person) end)
    ]
    |> Task.await_many()
    |> Enum.sum()
  end

  #
  # Pending tasks
  #

  defp load_pending_tasks(company, person) do
    base_query = pending_tasks_query(person)

    from([project: p] in base_query,
      join: space in assoc(p, :group),
      preload: [project: {p, group: space}]
    )
    |> Repo.all()
    |> Enum.map(&Assignment.build(&1, company))
  end

  defp count_pending_tasks(person) do
    due_cutoff = Date.add(Date.utc_today(), @due_soon_window_in_days)
    base_query = pending_tasks_query(person)

    from([task: t] in base_query,
      where: fragment("(?->>'date')::date <= ?", t.due_date, ^due_cutoff),
      select: count(t.id)
    )
    |> Repo.one()
    |> default_zero()
  end

  defp pending_tasks_query(person) do
    from(t in Operately.Tasks.Task,
      as: :task,
      join: assignee in assoc(t, :assignees),
      join: project in assoc(t, :project),
      as: :project,
      where: assignee.person_id == ^person.id,
      where: fragment("not (?->>'closed')::boolean", t.task_status),
      where: is_nil(project.deleted_at),
      where: project.status == "active" and is_nil(project.closed_at)
    )
  end

  #
  # Pending milestones
  #

  defp load_pending_milestones(company, person) do
    base_query = pending_milestones_query(person)

    from([project: p] in base_query,
      join: space in assoc(p, :group),
      preload: [project: {p, group: space}]
    )
    |> Repo.all()
    |> Enum.map(&Assignment.build(&1, company))
  end

  defp count_pending_milestones(person) do
    due_cutoff = Date.add(Date.utc_today(), @due_soon_window_in_days)
    base_query = pending_milestones_query(person)

    from([milestone: m] in base_query,
      where: fragment("(?->'contextual_end_date'->>'date')::date <= ?", m.timeframe, ^due_cutoff),
      select: count(m.id)
    )
    |> Repo.one()
    |> default_zero()
  end

  defp pending_milestones_query(person) do
    from(m in Milestone,
      as: :milestone,
      join: project in assoc(m, :project),
      as: :project,
      join: champion in assoc(project, :champion),
      where: m.status == :pending,
      where: champion.id == ^person.id,
      where: is_nil(project.deleted_at) and is_nil(m.deleted_at),
      where: project.status == "active" and is_nil(project.closed_at)
    )
  end

  #
  # Projects that need check-ins (owner role)
  #

  defp load_pending_project_check_ins(company, person) do
    base_query = pending_project_check_ins_query(person)

    from([project: p, champion: c] in base_query,
      join: space in assoc(p, :group),
      preload: [champion: c, group: space]
    )
    |> Repo.all()
    |> Enum.map(&Assignment.build(&1, company))
  end

  defp count_pending_project_check_ins(person) do
    base_query = pending_project_check_ins_query(person)

    from([project: p] in base_query,
      select: count(p.id)
    )
    |> Repo.one()
    |> default_zero()
  end

  defp pending_project_check_ins_query(person) do
    from(p in Project,
      as: :project,
      join: champion in assoc(p, :champion),
      as: :champion,
      where: p.next_check_in_scheduled_at <= ^DateTime.utc_now(),
      where: p.status == "active",
      where: champion.id == ^person.id,
      where: is_nil(p.deleted_at),
      where:
        fragment(
          "(p0.timeframe->'contextual_start_date'->>'date' <= ? OR p0.timeframe->'contextual_start_date'->>'date' IS NULL)",
          ^to_string(Date.utc_today())
        )
    )
  end

  #
  # Project Check-ins that need acknowledgement (reviewer role)
  #

  defp load_pending_project_check_in_acknowledgements(company, person) do
    base_query = pending_project_check_in_acknowledgements_query(person)

    from([project: p, author: a, reviewer: r] in base_query,
      join: space in assoc(p, :group),
      preload: [project: {p, reviewer: r, group: space}, author: a]
    )
    |> Repo.all()
    |> Enum.map(&Assignment.build(&1, company))
  end

  defp count_pending_project_check_in_acknowledgements(person) do
    base_query = pending_project_check_in_acknowledgements_query(person)

    from([check_in: c] in base_query,
      select: count(c.id)
    )
    |> Repo.one()
    |> default_zero()
  end

  defp pending_project_check_in_acknowledgements_query(person) do
    latest_reviewer_change_subquery =
      from(a in Operately.Activities.Activity,
        where: a.action == "project_reviewer_updating",
        group_by: fragment("(?->>'project_id')::uuid", a.content),
        select: %{project_id: type(fragment("(?->>'project_id')::uuid", a.content), :binary_id), inserted_at: max(a.inserted_at)}
      )

    from(c in CheckIn,
      as: :check_in,
      join: project in assoc(c, :project),
      as: :project,
      join: author in assoc(c, :author),
      as: :author,
      left_join: champion in assoc(project, :champion),
      left_join: reviewer in assoc(project, :reviewer),
      as: :reviewer,
      left_join: reviewer_change in subquery(latest_reviewer_change_subquery),
      on: reviewer_change.project_id == project.id,
      where: is_nil(c.acknowledged_by_id),
      where: c.state == :published,
      where: project.status == "active" and is_nil(project.deleted_at),
      where:
        (reviewer.id == ^person.id and author.id != reviewer.id) or
          (champion.id == ^person.id and author.id != champion.id),
      where: is_nil(reviewer_change.inserted_at) or c.inserted_at > reviewer_change.inserted_at
    )
  end

  #
  # Goal that need updates (owner role)
  #

  defp load_pending_goal_updates(company, person) do
    base_query = pending_goal_updates_query(person)

    from([goal: g] in base_query,
      join: space in assoc(g, :group),
      preload: [group: space]
    )
    |> Repo.all()
    |> Enum.map(&Assignment.build(&1, company))
  end

  defp count_pending_goal_updates(person) do
    base_query = pending_goal_updates_query(person)

    from([goal: g] in base_query,
      select: count(g.id)
    )
    |> Repo.one()
    |> default_zero()
  end

  defp pending_goal_updates_query(person) do
    from(g in Goal,
      as: :goal,
      where: g.next_update_scheduled_at <= ^DateTime.utc_now(),
      where: is_nil(g.closed_at),
      where: g.champion_id == ^person.id,
      where:
        fragment(
          "(g0.timeframe->'contextual_start_date'->>'date' <= ? OR g0.timeframe->'contextual_start_date'->>'date' IS NULL)",
          ^to_string(Date.utc_today())
        )
    )
  end

  #
  # Goal Updates that need acknowledgement (reviewer role)
  #

  defp load_pending_goal_update_acknowledgements(company, person) do
    base_query = pending_goal_update_acknowledgements_query(person)

    from([goal: g, author: a] in base_query,
      join: space in assoc(g, :group),
      preload: [goal: {g, group: space}, author: a]
    )
    |> Repo.all()
    |> Enum.map(&Assignment.build(&1, company))
  end

  defp count_pending_goal_update_acknowledgements(person) do
    base_query = pending_goal_update_acknowledgements_query(person)

    from([update: u] in base_query,
      select: count(u.id)
    )
    |> Repo.one()
    |> default_zero()
  end

  defp pending_goal_update_acknowledgements_query(person) do
    latest_reviewer_change_subquery =
      from(a in Operately.Activities.Activity,
        where: a.action == "goal_reviewer_updating",
        group_by: fragment("(?->>'goal_id')::uuid", a.content),
        select: %{goal_id: type(fragment("(?->>'goal_id')::uuid", a.content), :binary_id), inserted_at: max(a.inserted_at)}
      )

    from(u in Update,
      as: :update,
      join: goal in assoc(u, :goal),
      as: :goal,
      join: author in assoc(u, :author),
      as: :author,
      left_join: reviewer_change in subquery(latest_reviewer_change_subquery),
      on: reviewer_change.goal_id == goal.id,
      where: is_nil(goal.closed_at) and is_nil(goal.deleted_at),
      where: is_nil(u.acknowledged_by_id),
      where: u.state == :published,
      where:
        (goal.reviewer_id == ^person.id and author.id != goal.reviewer_id) or
          (goal.champion_id == ^person.id and author.id != goal.champion_id),
      where: is_nil(reviewer_change.inserted_at) or u.inserted_at > reviewer_change.inserted_at
    )
  end

  #
  # Pending space tasks
  #

  defp load_pending_space_tasks(company, person) do
    base_query = pending_space_tasks_query(person)

    result =
      from([space: s] in base_query,
        preload: [space: s]
      )
      |> Repo.all()

    Enum.map(result, &Assignment.build(&1, company))
  end

  defp count_pending_space_tasks(person) do
    due_cutoff = Date.add(Date.utc_today(), @due_soon_window_in_days)
    base_query = pending_space_tasks_query(person)

    from([task: t] in base_query,
      where: fragment("(?->>'date')::date <= ?", t.due_date, ^due_cutoff),
      select: count(t.id)
    )
    |> Repo.one()
    |> default_zero()
  end

  defp pending_space_tasks_query(person) do
    from(t in Operately.Tasks.Task,
      as: :task,
      join: assignee in assoc(t, :assignees),
      join: space in assoc(t, :space),
      as: :space,
      where: assignee.person_id == ^person.id,
      where: fragment("not (?->>'closed')::boolean", t.task_status),
      where: is_nil(space.deleted_at)
    )
  end

  #
  # Helpers
  #

  defp default_zero(nil), do: 0
  defp default_zero(count), do: count
end
