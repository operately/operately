defmodule Operately.Assignments.LoaderV2 do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Goals.{Goal, Update}
  alias Operately.Projects.{Project, CheckIn, Milestone}
  alias Operately.Tasks.Task, as: ProjectTask

  alias Operately.ContextualDates.{ContextualDate, Timeframe}
  alias OperatelyWeb.Paths

  defmodule AssignmentOrigin do
    @enforce_keys [:id, :name, :type, :path]
    defstruct [:id, :name, :type, :path, :space_name, :due_date]
  end

  defmodule AssignmentV2 do
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

  # Load tasks assigned to the person that are not completed
  defp load_pending_tasks(company, person) do
    from(t in ProjectTask,
      join: assignee in assoc(t, :assignees),
      join: project in assoc(t, :project),
      join: space in assoc(project, :group),
      where: assignee.person_id == ^person.id,
      where: t.status in ["pending", "todo", "in_progress"],
      where: is_nil(project.deleted_at),
      preload: [project: {project, group: space}]
    )
    |> Repo.all()
    |> Enum.map(fn task ->
      origin = build_project_origin(company, task.project)
      due_date = ContextualDate.get_date(task.due_date)

      %AssignmentV2{
        resource_id: Paths.task_id(task),
        name: task.name,
        due: due_date,
        type: :project_task,
        role: :owner,
        action_label: "Complete #{task.name}",
        path: Paths.project_task_path(company, task),
        origin: origin,
        task_status: String.to_atom(task.status)
      }
    end)
  end

  # Load milestones that are pending
  defp load_pending_milestones(company, person) do
    from(m in Milestone,
      join: project in assoc(m, :project),
      join: champion in assoc(project, :champion),
      join: space in assoc(project, :group),
      where: m.status == :pending,
      where: champion.id == ^person.id,
      where: is_nil(project.deleted_at),
      where: is_nil(m.deleted_at),
      preload: [project: {project, group: space}]
    )
    |> Repo.all()
    |> Enum.map(fn milestone ->
      origin = build_project_origin(company, milestone.project)
      due_date = Timeframe.end_date(milestone.timeframe)

      %AssignmentV2{
        resource_id: Paths.milestone_id(milestone),
        name: milestone.title,
        due: due_date,
        type: :milestone,
        role: :owner,
        action_label: "Complete #{milestone.title}",
        path: Paths.project_milestone_path(company, milestone),
        origin: origin
      }
    end)
  end

  # Load projects that need check-ins (owner role)
  defp load_pending_project_check_ins(company, person) do
    from(p in Project,
      join: champion in assoc(p, :champion),
      join: space in assoc(p, :group),
      where: p.next_check_in_scheduled_at <= ^DateTime.utc_now(),
      where: p.status == "active",
      where: champion.id == ^person.id,
      where: is_nil(p.deleted_at),
      preload: [champion: champion, group: space]
    )
    |> Repo.all()
    |> Enum.map(fn project ->
      origin = build_project_origin(company, project)

      %AssignmentV2{
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

  # Load check-ins that need acknowledgement (reviewer role)
  defp load_pending_project_check_in_acknowledgements(company, person) do
    from(c in CheckIn,
      join: project in assoc(c, :project),
      join: space in assoc(project, :group),
      join: author in assoc(c, :author),
      left_join: champion in assoc(project, :champion),
      left_join: reviewer in assoc(project, :reviewer),
      where: is_nil(c.acknowledged_by_id),
      where: is_nil(project.deleted_at),
      where:
        (reviewer.id == ^person.id and author.id != reviewer.id) or
          (champion.id == ^person.id and author.id != champion.id),
      preload: [project: {project, reviewer: reviewer, group: space}, author: author]
    )
    |> Repo.all()
    |> Enum.map(fn check_in ->
      origin = build_project_origin(company, check_in.project)

      %AssignmentV2{
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

  # Load goals that need updates (owner role)
  defp load_pending_goal_updates(company, person) do
    from(g in Goal,
      left_join: space in assoc(g, :group),
      where: g.next_update_scheduled_at <= ^DateTime.utc_now(),
      where: is_nil(g.closed_at),
      where: g.champion_id == ^person.id,
      where:
        fragment(
          "(g0.timeframe->'contextual_start_date'->>'date' <= ? OR g0.timeframe->'contextual_start_date'->>'date' IS NULL)",
          ^to_string(Date.utc_today())
        ),
      preload: [group: space]
    )
    |> Repo.all()
    |> Enum.map(fn goal ->
      origin = build_goal_origin(company, goal)

      %AssignmentV2{
        resource_id: Paths.goal_id(goal),
        name: "#{goal.name} – Goal Update",
        due: Operately.Time.as_datetime(goal.next_update_scheduled_at),
        type: :goal_update,
        role: :owner,
        action_label: "Submit goal progress update",
        path: Paths.goal_check_in_new_path(company, goal),
        origin: origin
      }
    end)
  end

  # Load goal updates that need acknowledgement (reviewer role)
  defp load_pending_goal_update_acknowledgements(company, person) do
    from(u in Update,
      join: goal in assoc(u, :goal),
      join: author in assoc(u, :author),
      left_join: space in assoc(goal, :group),
      where: is_nil(goal.deleted_at),
      where: is_nil(u.acknowledged_by_id),
      where:
        (goal.reviewer_id == ^person.id and author.id != goal.reviewer_id) or
          (goal.champion_id == ^person.id and author.id != goal.champion_id),
      preload: [goal: {goal, group: space}, author: author]
    )
    |> Repo.all()
    |> Enum.map(fn update ->
      origin = build_goal_origin(company, update.goal)

      %AssignmentV2{
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

  # Helper functions

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
