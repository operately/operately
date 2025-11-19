defmodule Operately.Assignments.LoaderV2 do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Goals.{Goal, Update}
  alias Operately.Projects.{Project, CheckIn, Milestone}
  alias Operately.Tasks.Task, as: ProjectTask

  alias Operately.ContextualDates.{ContextualDate, Timeframe}
  alias OperatelyWeb.Paths

  @due_soon_window_in_days 1

  defmodule AssignmentOrigin do
    @enforce_keys [:id, :name, :type, :path]
    defstruct [:id, :name, :type, :path, :space_name, :due_date]
  end

  defmodule Assignment do
    @enforce_keys [:resource_id, :name, :due, :type, :role, :path, :origin]
    defstruct [
      :resource_id,
      :name,
      :due,
      :type,
      :role,
      :action_label,
      :path,
      :origin,
      :task_status,
      :author_id,
      :author_name,
      :description
    ]
  end

  def load(person, company) do
    [
      Task.async(fn -> load_pending_project_check_ins(company, person) end),
      Task.async(fn -> load_pending_project_check_in_acknowledgements(company, person) end),
      Task.async(fn -> load_pending_goal_updates(company, person) end),
      Task.async(fn -> load_pending_goal_update_acknowledgements(company, person) end),
      Task.async(fn -> load_pending_tasks(company, person) end),
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
    |> Enum.map(fn task ->
      origin = build_project_origin(company, task.project)
      due_date = ContextualDate.get_date(task.due_date)

      %Assignment{
        resource_id: Paths.task_id(task),
        name: task.name,
        due: due_date,
        type: :project_task,
        role: :owner,
        action_label: task.name,
        path: Paths.project_task_path(company, task),
        origin: origin,
        task_status: String.to_atom(task.status)
      }
    end)
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
    from(t in ProjectTask, as: :task,
      join: assignee in assoc(t, :assignees),
      join: project in assoc(t, :project), as: :project,
      where: assignee.person_id == ^person.id,
      where: t.status in ["pending", "todo", "in_progress"],
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
    |> Enum.map(fn milestone ->
      origin = build_project_origin(company, milestone.project)
      due_date = Timeframe.end_date(milestone.timeframe)

      %Assignment{
        resource_id: Paths.milestone_id(milestone),
        name: milestone.title,
        due: due_date,
        type: :milestone,
        role: :owner,
        action_label: milestone.title,
        path: Paths.project_milestone_path(company, milestone),
        origin: origin
      }
    end)
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
    from(m in Milestone, as: :milestone,
      join: project in assoc(m, :project), as: :project,
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
    |> Enum.map(fn project ->
      origin = build_project_origin(company, project)

      %Assignment{
        resource_id: Paths.project_id(project),
        name: "#{project.name} - Check-in",
        due: Operately.Time.as_datetime(project.next_check_in_scheduled_at),
        type: :check_in,
        role: :owner,
        action_label: "Submit weekly check-in",
        path: Paths.project_check_in_new_path(company, project),
        origin: origin
      }
    end)
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
    from(p in Project, as: :project,
      join: champion in assoc(p, :champion), as: :champion,
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
    |> Enum.map(fn check_in ->
      origin = build_project_origin(company, check_in.project)

      %Assignment{
        resource_id: Paths.project_check_in_id(check_in),
        name: "#{check_in.project.name} - Check-in",
        due: Operately.Time.as_datetime(check_in.inserted_at),
        type: :check_in,
        role: :reviewer,
        action_label: "Review weekly check-in",
        path: Paths.project_check_in_path(company, check_in),
        origin: origin,
        author_id: Paths.person_id(check_in.author),
        author_name: check_in.author.full_name
      }
    end)
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
    latest_reviewer_change_subquery = from(a in Operately.Activities.Activity,
      where: a.action == "project_reviewer_updating",
      group_by: fragment("(?->>'project_id')::uuid", a.content),
      select: %{project_id: type(fragment("(?->>'project_id')::uuid", a.content), :binary_id), inserted_at: max(a.inserted_at)}
    )

    from(c in CheckIn, as: :check_in,
      join: project in assoc(c, :project), as: :project,
      join: author in assoc(c, :author), as: :author,
      left_join: champion in assoc(project, :champion),
      left_join: reviewer in assoc(project, :reviewer), as: :reviewer,
      left_join: reviewer_change in subquery(latest_reviewer_change_subquery), on: reviewer_change.project_id == project.id,
      where: is_nil(c.acknowledged_by_id),
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
    |> Enum.map(fn goal ->
      origin = build_goal_origin(company, goal)

      %Assignment{
        resource_id: Paths.goal_id(goal),
        name: "#{goal.name} - Goal Update",
        due: Operately.Time.as_datetime(goal.next_update_scheduled_at),
        type: :goal_update,
        role: :owner,
        action_label: "Submit goal progress update",
        path: Paths.goal_check_in_new_path(company, goal),
        origin: origin
      }
    end)
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
    from(g in Goal, as: :goal,
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
    |> Enum.map(fn update ->
      origin = build_goal_origin(company, update.goal)

      %Assignment{
        resource_id: Paths.goal_update_id(update),
        name: "#{update.goal.name} – Goal Update",
        due: Operately.Time.as_datetime(update.inserted_at),
        type: :goal_update,
        role: :reviewer,
        action_label: "Review goal progress update",
        path: Paths.goal_check_in_path(company, update),
        origin: origin,
        author_id: Paths.person_id(update.author),
        author_name: update.author.full_name
      }
    end)
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
    latest_reviewer_change_subquery = from(a in Operately.Activities.Activity,
      where: a.action == "goal_reviewer_updating",
      group_by: fragment("(?->>'goal_id')::uuid", a.content),
      select: %{goal_id: type(fragment("(?->>'goal_id')::uuid", a.content), :binary_id), inserted_at: max(a.inserted_at)}
    )

    from(u in Update, as: :update,
      join: goal in assoc(u, :goal), as: :goal,
      join: author in assoc(u, :author), as: :author,
      left_join: reviewer_change in subquery(latest_reviewer_change_subquery), on: reviewer_change.goal_id == goal.id,
      where: is_nil(goal.closed_at) and is_nil(goal.deleted_at),
      where: is_nil(u.acknowledged_by_id),
      where:
        (goal.reviewer_id == ^person.id and author.id != goal.reviewer_id) or
          (goal.champion_id == ^person.id and author.id != goal.champion_id),
      where: is_nil(reviewer_change.inserted_at) or u.inserted_at > reviewer_change.inserted_at
    )
  end

  #
  # Helpers
  #

  defp default_zero(nil), do: 0
  defp default_zero(count), do: count

  defp build_project_origin(company, project) do
    %AssignmentOrigin{
      id: Paths.project_id(project),
      name: project.name,
      type: :project,
      path: Paths.project_path(company, project),
      space_name: if(project.group, do: project.group.name, else: nil),
      due_date: extract_timeframe_end_date(project.timeframe)
    }
  end

  defp build_goal_origin(company, goal) do
    %AssignmentOrigin{
      id: Paths.goal_id(goal),
      name: goal.name,
      type: :goal,
      path: Paths.goal_path(company, goal),
      space_name: if(goal.group, do: goal.group.name, else: nil),
      due_date: extract_timeframe_end_date(goal.timeframe)
    }
  end

  defp extract_timeframe_end_date(timeframe) do
    case Operately.ContextualDates.Timeframe.end_date(timeframe) do
      nil -> nil
      date -> date_to_datetime(date)
    end
  end

  defp date_to_datetime(%Date{} = date) do
    DateTime.new!(date, ~T[00:00:00], "Etc/UTC")
  end

  defp date_to_datetime(_), do: nil
end
