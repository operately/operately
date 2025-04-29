defmodule Operately.WorkMaps.WorkMapItem do
  @moduledoc """
  Defines structs for work map items (goals and projects)
  """
  alias Operately.{Goals, Projects}
  alias Operately.Goals.Goal
  alias Operately.Projects.Project

  @typedoc """
  Type that represents a work map item (goal or project)
  """
  @type t() :: %__MODULE__{
    id: String.t(),
    parent_id: String.t() | nil,
    name: String.t(),
    status: String.t(),
    progress: float(),
    closed_at: DateTime.t() | nil,
    space: map(),
    owner: map() | nil,
    next_step: String.t(),
    is_new: boolean(),
    children: list(t()),
    completed_on: DateTime.t() | nil,
    timeframe: map() | nil,
    type: atom(),
    company: map(),
    resource: map(),
    privacy: :public | :internal | :confidential | :secret,
  }

  defstruct [
    :id,
    :parent_id,
    :name,
    :status,
    :progress,
    :closed_at,
    :space,
    :owner,
    :next_step,
    :is_new,
    :children,
    :completed_on,
    :timeframe,
    :type,
    :company,
    :resource,
    :privacy,
  ]

  def build_item(goal = %Goal{}, children) do
    %__MODULE__{
      id: goal.id,
      parent_id: goal.parent_goal_id,
      name: goal.name,
      status: goal_status(goal),
      progress: Goals.progress_percentage(goal),
      closed_at: goal.closed_at,
      space: goal.group,
      owner: goal.champion,
      next_step: next_target(goal),
      is_new: false,
      children: children,
      completed_on: goal.closed_at,
      timeframe: goal.timeframe,
      type: :goal,
      company: goal.company,
      resource: goal,
    }
  end

  def build_item(project = %Project{}, children) do
    project = Project.set_next_milestone(project)

    %__MODULE__{
      id: project.id,
      parent_id: project.goal_id,
      name: project.name,
      status: project_status(project),
      progress: Projects.progress_percentage(project),
      closed_at: project.closed_at,
      space: project.group,
      owner: project.champion,
      next_step: if(project.next_milestone, do: project.next_milestone.title, else: ""),
      is_new: false,
      children: children,
      completed_on: project.closed_at,
      timeframe: project_timeframe(project),
      type: :project,
      company: project.company,
      resource: project,
      privacy: find_privacy(project),
    }
  end

  defp next_target(goal = %Goal{}) do
    case goal.targets do
      [] -> ""

      %Ecto.Association.NotLoaded{} -> ""

      targets ->
        target =
          targets
          |> Enum.filter(fn target ->
            cond do
              target.from < target.to -> target.value < target.to
              target.from > target.to -> target.value > target.to
              true -> false
            end
          end)
          |> Enum.sort_by(fn target -> target.index end)
          |> List.first()


        if target, do: target.name, else: ""
    end
  end

  defp project_timeframe(project = %Project{}) do
    %{
      start_date: project.started_at,
      end_date: project.deadline,
      type: "days",
    }
  end

  defp project_status(project = %Project{}) do
    cond do
      project.closed_at -> "completed"
      project.last_check_in -> project.last_check_in.status
      true -> "on_track"
    end
  end

  defp goal_status(goal = %Goal{}) do
    cond do
      goal.success == "yes" -> "achieved"
      goal.success == "no" -> "missed"
      goal.last_update -> goal.last_update.status
      true -> "on_track"
    end
  end

  defp find_privacy(item) do
    build_access_levels_from_context(item.access_context, item.company_id, item.group_id)
    |> Operately.Access.AccessLevels.calc_privacy()
  end

  defp build_access_levels_from_context(access_context, company_id, space_id) do
    if is_nil(access_context) or access_context == %Ecto.Association.NotLoaded{} do
      %Operately.Access.AccessLevels{
        public: nil,
        company: nil,
        space: nil
      }
    else
      bindings = access_context.bindings

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
end
