defmodule Operately.Assignments.Assignment do
  @moduledoc """
  Represents an assignment with metadata for categorization and display.

  This struct is used by both LoaderV2 (for loading raw assignments) and
  Categorizer (which enriches assignments with due status metadata).
  """

  alias Operately.Projects.{Project, CheckIn, Milestone}
  alias Operately.Goals.{Goal, Update}
  alias Operately.Tasks.Task
  alias Operately.Groups.Group
  alias Operately.ContextualDates.{ContextualDate, Timeframe}
  alias OperatelyWeb.Paths

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
    :description,
    :due_date,
    :due_status,
    :due_status_label
  ]

  @due_soon_window_in_days 1
  @due_status_values [:overdue, :due_today, :due_soon, :upcoming, :none]

  defmodule Origin do
    @enforce_keys [:id, :name, :type, :path]
    defstruct [:id, :name, :type, :path, :space_name, :due_date]
  end

  @doc """
  Builds a complete Assignment from various source types.

  Handles pattern matching for:
  - Project tasks (Task with project association)
  - Space tasks (Task with space association)
  - Milestones
  - Projects (for check-ins)
  - Project check-ins (for acknowledgements)
  - Goals (for updates)
  - Goal updates (for acknowledgements)
  """

  # Project task (owner role)
  def build(%Task{project: %Project{}} = task, company) do
    origin = build_project_origin(company, task.project)
    due_date = ContextualDate.get_date(task.due_date)

    build_with_enrichment(%{
      resource_id: Paths.task_id(task),
      name: task.name,
      due: due_date,
      type: :project_task,
      role: :owner,
      action_label: task.name,
      path: Paths.project_task_path(company, task),
      origin: origin,
      task_status: String.to_atom(task.task_status.value)
    })
  end

  # Space task (owner role)
  def build(%Task{space: %Group{}} = task, company) do
    origin = build_space_origin(company, task.space)
    due_date = ContextualDate.get_date(task.due_date)

    build_with_enrichment(%{
      resource_id: Paths.task_id(task),
      name: task.name,
      due: due_date,
      type: :space_task,
      role: :owner,
      action_label: task.name,
      path: Paths.space_task_path(company, task.space, task),
      origin: origin,
      task_status: String.to_atom(task.task_status.value)
    })
  end

  # Milestone (owner role)
  def build(%Milestone{} = milestone, company) do
    origin = build_project_origin(company, milestone.project)
    due_date = Timeframe.end_date(milestone.timeframe)

    build_with_enrichment(%{
      resource_id: Paths.milestone_id(milestone),
      name: milestone.title,
      due: due_date,
      type: :milestone,
      role: :owner,
      action_label: milestone.title,
      path: Paths.project_milestone_path(company, milestone),
      origin: origin
    })
  end

  # Project check-in (owner role)
  def build(%Project{} = project, company) do
    origin = build_project_origin(company, project)

    build_with_enrichment(%{
      resource_id: Paths.project_id(project),
      name: "#{project.name} - Check-in",
      due: Operately.Time.as_datetime(project.next_check_in_scheduled_at),
      type: :check_in,
      role: :owner,
      action_label: "Submit weekly check-in",
      path: Paths.project_check_in_new_path(company, project),
      origin: origin
    })
  end

  # Project check-in acknowledgement (reviewer role)
  def build(%CheckIn{} = check_in, company) do
    origin = build_project_origin(company, check_in.project)

    build_with_enrichment(%{
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
    })
  end

  # Goal update (owner role)
  def build(%Goal{} = goal, company) do
    origin = build_goal_origin(company, goal)

    build_with_enrichment(%{
      resource_id: Paths.goal_id(goal),
      name: "#{goal.name} - Goal Update",
      due: Operately.Time.as_datetime(goal.next_update_scheduled_at),
      type: :goal_update,
      role: :owner,
      action_label: "Submit goal progress update",
      path: Paths.goal_check_in_new_path(company, goal),
      origin: origin
    })
  end

  # Goal update acknowledgement (reviewer role)
  def build(%Update{} = update, company) do
    origin = build_goal_origin(company, update.goal)

    build_with_enrichment(%{
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
    })
  end

  def due_status_values, do: @due_status_values

  # Build with enrichment helper
  defp build_with_enrichment(attrs) do
    due_date = safe_parse_date(attrs[:due])
    {status, label} = resolve_due_status(due_date)

    struct!(__MODULE__, Map.merge(attrs, %{
      due_date: due_date,
      due_status: status,
      due_status_label: label
    }))
  end

  defp safe_parse_date(nil), do: nil
  defp safe_parse_date(%DateTime{} = datetime), do: DateTime.to_date(datetime)
  defp safe_parse_date(%Date{} = date), do: date
  defp safe_parse_date(_), do: nil

  defp resolve_due_status(nil), do: {:none, "No due date"}
  defp resolve_due_status(due_date) do
    today = Date.utc_today()
    diff = Date.diff(due_date, today)

    cond do
      diff < 0 ->
        days = abs(diff)
        label = if days == 1, do: "Overdue by 1 day", else: "Overdue by #{days} days"
        {:overdue, label}

      diff == 0 ->
        {:due_today, "Due today"}

      diff == 1 ->
        {:due_soon, "Due tomorrow"}

      diff <= @due_soon_window_in_days ->
        {:due_soon, "Due in #{diff} days"}

      true ->
        {:upcoming, "Due in #{diff} days"}
    end
  end

  defp build_project_origin(company, project) do
    %Origin{
      id: Paths.project_id(project),
      name: project.name,
      type: :project,
      path: Paths.project_path(company, project),
      space_name: if(project.group, do: project.group.name, else: nil),
      due_date: extract_timeframe_end_date(project.timeframe)
    }
  end

  defp build_space_origin(company, space) do
    %Origin{
      id: Paths.space_id(space),
      name: space.name,
      type: :space,
      path: Paths.space_path(company, space),
      space_name: space.name,
      due_date: nil
    }
  end

  defp build_goal_origin(company, goal) do
    %Origin{
      id: Paths.goal_id(goal),
      name: goal.name,
      type: :goal,
      path: Paths.goal_path(company, goal),
      space_name: if(goal.group, do: goal.group.name, else: nil),
      due_date: extract_timeframe_end_date(goal.timeframe)
    }
  end

  defp extract_timeframe_end_date(nil), do: nil
  defp extract_timeframe_end_date(timeframe) do
    case Timeframe.end_date(timeframe) do
      %Date{} = date -> date
      _ -> nil
    end
  end
end
