defmodule Operately.WorkMaps.WorkMapItem do
  @moduledoc """
  Defines structs for work map items (goals and projects)
  """
  alias Operately.{Goals, Projects}
  alias Operately.Goals.Goal
  alias Operately.Projects.Project

  defstruct [
    :id,
    :parent_id,
    :name,
    :status,
    :progress,
    :deadline,
    :closed_at,
    :space,
    :owner,
    :next_step,
    :is_new,
    :children,
    :completed_on,
    :type,
    :timeframe,
    :started_at,
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
      next_step: "",
      is_new: false,
      children: children,
      completed_on: goal.closed_at,
      type: :goal,
      timeframe: goal.timeframe,
    }
  end

  def build_item(project = %Project{}, children) do
    %__MODULE__{
      id: project.id,
      parent_id: project.goal_id,
      name: project.name,
      status: project.status,
      progress: Projects.progress_percentage(project),
      deadline: project.deadline,
      closed_at: project.closed_at,
      space: project.group,
      owner: project.champion,
      next_step: "",
      is_new: false,
      children: children,
      completed_on: project.closed_at,
      started_at: project.started_at,
      type: :project,
    }
  end
end
