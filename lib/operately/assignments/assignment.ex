defmodule Operately.Assignments.Assignment do
  alias Operately.{Goals, Projects}
  alias OperatelyWeb.Paths

  @enforce_keys [:id, :name, :due, :type]
  defstruct [
    :id,
    :name,
    :due,
    :type,
    :url,
    :author_id,
    :author_name,
  ]

  def build(assingments, company) when is_list(assingments) do
    Enum.map(assingments, fn a -> build(a, company) end)
  end

  def build(project = %Projects.Project{}, company) do
    %__MODULE__{
      id: project.id,
      name: project.name,
      due: normalize_date(project.next_check_in_scheduled_at),
      type: :project,
      url: Paths.project_path(company, project),
    }
  end

  def build(check_in = %Projects.CheckIn{}, company) do
    %__MODULE__{
      id: check_in.id,
      name: check_in.project.name,
      due: normalize_date(check_in.inserted_at),
      type: :check_in,
      url: Paths.project_check_in_path(company, check_in),
      author_id: check_in.author.id,
      author_name: check_in.author.full_name,
    }
  end

  def build(milestone = %Projects.Milestone{}, company) do
    %__MODULE__{
      id: milestone.id,
      name: milestone.title,
      due: normalize_date(milestone.deadline_at),
      type: :milestone,
      url: Paths.project_milestone_path(company, milestone),
    }
  end

  def build(goal = %Goals.Goal{}, company) do
    %__MODULE__{
      id: goal.id,
      name: goal.name,
      due: normalize_date(goal.next_update_scheduled_at),
      type: :goal,
      url: Paths.goal_path(company, goal),
    }
  end

  def build(update = %Goals.Update{}, company) do
    %__MODULE__{
      id: update.id,
      name: update.goal.name,
      due: normalize_date(update.inserted_at),
      type: :goal_update,
      url: Paths.goal_check_in_path(company, update),
      author_id: update.author.id,
      author_name: update.author.full_name,
    }
  end

  defp normalize_date(date) do
    DateTime.from_naive!(date, "Etc/UTC")
  end
end
