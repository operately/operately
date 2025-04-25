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
  ]

  def build_item(goal = %Goal{}, children) do
    %__MODULE__{
      id: goal.id,
      parent_id: goal.parent_goal_id,
      name: goal.name,
      status: if(goal.last_update, do: goal.last_update.status, else: "on_track"),
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
    }
  end

  def build_item(project = %Project{}, children) do
    project = Project.set_next_milestone(project)

    %__MODULE__{
      id: project.id,
      parent_id: project.goal_id,
      name: project.name,
      status: if(project.last_check_in, do: project.last_check_in.status, else: "on_track"),
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
end
