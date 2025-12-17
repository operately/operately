defmodule Operately.WorkMaps.WorkMapItem do
  @moduledoc """
  Defines structs for work map items (goals and projects)
  """

  @callback status(item :: any()) :: :on_track | :achieved | :missed | :paused | :caution | :off_track | :pending | :outdated | String.t()
  @callback state(item :: any()) :: :active | :paused | :closed
  @callback next_step(item :: any()) :: String.t()
  @callback progress_percentage(item :: any()) :: float()

  alias Operately.Goals.Goal
  alias Operately.Projects.Project
  alias Operately.Tasks.Task
  alias Operately.ContextualDates.Timeframe

  @typedoc """
  Type that represents a work map item (goal or project)
  """
  @type t() :: %__MODULE__{
          id: String.t(),
          parent_id: String.t() | nil,
          name: String.t(),
          status: String.t(),
          state: String.t(),
          progress: float(),
          space: map(),
          owner: map() | nil,
          champion: map() | nil,
          reviewer: map() | nil,
          contributor: map() | nil,
          next_step: String.t(),
          is_new: boolean(),
          children: list(t()),
          completed_on: DateTime.t() | nil,
          timeframe: map() | nil,
          type: atom(),
          company: map(),
          resource: map(),
          privacy: :public | :internal | :confidential | :secret,
          assignees: list(map()) | nil
        }

  defstruct [
    :id,
    :parent_id,
    :name,
    :status,
    :state,
    :progress,
    :space,
    :project,
    :owner,
    :champion,
    :reviewer,
    :contributor,
    :next_step,
    :is_new,
    :children,
    :completed_on,
    :timeframe,
    :type,
    :company,
    :resource,
    :privacy,
    :assignees
  ]

  def build_item(goal = %Goal{}, children, include_assignees) do
    %__MODULE__{
      id: goal.id,
      parent_id: goal.parent_goal_id,
      name: goal.name,
      status: Goal.status(goal),
      state: Goal.state(goal),
      progress: Goal.progress_percentage(goal),
      space: goal.group,
      project: nil,
      owner: goal.champion,
      champion: goal.champion,
      reviewer: goal.reviewer,
      next_step: Goal.next_step(goal),
      is_new: false,
      children: children,
      completed_on: goal.closed_at,
      timeframe: goal.timeframe,
      type: :goal,
      company: goal.company,
      resource: goal,
      privacy: find_privacy(goal)
    }
    |> then(fn item ->
      if include_assignees do
        Map.put(item, :assignees, build_goal_assignees(goal))
      else
        item
      end
    end)
  end

  def build_item(task = %Task{}, children, _include_assignees) do
    owner = List.first(task.assigned_people || [])

    %__MODULE__{
      id: task.id,
      parent_id: task.project_id,
      name: task.name,
      status: Task.status(task),
      state: Task.state(task),
      progress: Task.progress_percentage(task),
      space: task.project_space || task.space,
      project: task.project,
      owner: owner,
      champion: owner,
      reviewer: nil,
      next_step: Task.next_step(task),
      is_new: false,
      children: children,
      completed_on: task.closed_at,
      timeframe: build_task_timeframe(task),
      type: :task,
      company: task.company,
      resource: task,
      privacy: nil,
      assignees: task.assigned_people
    }
  end

  def build_item(project = %Project{}, children, include_assignees) do
    %__MODULE__{
      id: project.id,
      parent_id: project.goal_id,
      name: project.name,
      status: Project.status(project),
      state: Project.state(project),
      progress: Project.progress_percentage(project),
      space: project.group,
      project: nil,
      owner: project.champion,
      champion: project.champion,
      reviewer: project.reviewer,
      next_step: Project.next_step(project),
      is_new: false,
      children: children,
      completed_on: project.closed_at,
      timeframe: project.timeframe,
      type: :project,
      company: project.company,
      resource: project,
      privacy: find_privacy(project)
    }
    |> then(fn item ->
      if include_assignees do
        Map.put(item, :assignees, project.contributing_people)
      else
        item
      end
    end)
  end

  defp build_goal_assignees(goal = %Goal{}) do
    [
      goal.champion,
      goal.reviewer
    ]
    |> Enum.reject(&is_nil/1)
  end

  defp find_privacy(item) do
    build_access_levels_from_context(item.access_context, item.company_id, item.group_id)
    |> Operately.Access.AccessLevels.calc_privacy()
  end

  defp build_access_levels_from_context(access_context, company_id, space_id) do
    case access_context do
      nil ->
        %Operately.Access.AccessLevels{public: nil, company: nil, space: nil}

      %Ecto.Association.NotLoaded{} ->
        %Operately.Access.AccessLevels{public: nil, company: nil, space: nil}

      %{bindings: bindings} ->
        public = find_binding_by_criteria(bindings, {:company_id, company_id}, :anonymous)
        company = find_binding_by_criteria(bindings, {:company_id, company_id}, :standard)
        space = find_binding_by_criteria(bindings, {:group_id, space_id}, :standard)

        %Operately.Access.AccessLevels{
          public: access_level_or_no_access(public),
          company: access_level_or_no_access(company),
          space: access_level_or_no_access(space)
        }
    end
  end

  defp find_binding_by_criteria(bindings, {group_field, id}, tag) do
    Enum.find(bindings, fn binding ->
      group = binding.group
      group_value = Map.get(group, group_field)
      group_value == id && group.tag == tag
    end)
  end

  defp access_level_or_no_access(nil), do: Operately.Access.Binding.no_access()
  defp access_level_or_no_access(binding), do: binding.access_level

  defp build_task_timeframe(%Task{due_date: nil}), do: nil
  defp build_task_timeframe(%Task{due_date: due_date}) do
    %Timeframe{contextual_start_date: nil, contextual_end_date: due_date}
  end
end
