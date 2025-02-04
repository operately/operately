defmodule Operately.Assignments.Assignment do
  alias Operately.Assignments.ManagementHierarchy
  alias Operately.{Goals, Projects}
  alias OperatelyWeb.Paths

  @enforce_keys [:resource_id, :name, :due, :type, :path]
  defstruct [
    :resource_id,
    :name,
    :due,
    :type,
    :path,
    :url,
    :author_id,
    :author_name,
    :management_hierarchy
  ]

  def build(assignments, company, reports \\ [])

  def build(assingments, company, reports) when is_list(assingments) do
    Enum.map(assingments, fn a -> build(a, company, reports) end)
  end

  def build(project = %Projects.Project{}, company, reports) do
    %__MODULE__{
      resource_id: Paths.project_id(project),
      name: project.name,
      due: Operately.Time.as_datetime(project.next_check_in_scheduled_at),
      type: :project,
      path: Paths.project_check_in_new_path(company, project),
      url: Paths.project_check_in_new_path(company, project) |> Paths.to_url(),
      management_hierarchy: ManagementHierarchy.find(project, reports)
    }
  end

  def build(check_in = %Projects.CheckIn{}, company, reports) do
    %__MODULE__{
      resource_id: Paths.project_check_in_id(check_in),
      name: check_in.project.name,
      due: Operately.Time.as_datetime(check_in.inserted_at),
      type: :check_in,
      path: Paths.project_check_in_path(company, check_in),
      url: Paths.project_check_in_path(company, check_in) |> Paths.to_url(),
      author_id: Paths.person_id(check_in.author),
      author_name: check_in.author.full_name,
      management_hierarchy: ManagementHierarchy.find(check_in, reports)
    }
  end

  def build(goal = %Goals.Goal{}, company, reports) do
    %__MODULE__{
      resource_id: Paths.goal_id(goal),
      name: goal.name,
      due: Operately.Time.as_datetime(goal.next_update_scheduled_at),
      type: :goal,
      path: Paths.goal_check_in_new_path(company, goal),
      url: Paths.goal_check_in_new_path(company, goal) |> Paths.to_url(),
      management_hierarchy: ManagementHierarchy.find(goal, reports)
    }
  end

  def build(update = %Goals.Update{}, company, reports) do
    %__MODULE__{
      resource_id: Paths.goal_update_id(update),
      name: update.goal.name,
      due: Operately.Time.as_datetime(update.inserted_at),
      type: :goal_update,
      path: Paths.goal_check_in_path(company, update),
      url: Paths.goal_check_in_path(company, update) |> Paths.to_url(),
      author_id: Paths.person_id(update.author),
      author_name: update.author.full_name,
      management_hierarchy: ManagementHierarchy.find(update, reports)
    }
  end
end
