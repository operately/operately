defprotocol Operately.Assignments.Reviewable do
  def reviewer_id(resource)

  def due_date(resource)

  def is_reviewer?(resource, person)

  def to_assignment(resource, company, reports)
end

defimpl Operately.Assignments.Reviewable, for: Operately.Projects.Project do
  alias OperatelyWeb.Paths
  alias Operately.Assignments.{Assignment, ManagementHierarchy}

  def reviewer_id(project), do: project.reviewer && project.reviewer.id

  def due_date(project), do: project.next_check_in_scheduled_at

  def is_reviewer?(project, person), do: reviewer_id(project) == person.id

  def to_assignment(project, company, reports) do
    path = Paths.project_check_in_new_path(company, project)

    %Assignment{
      resource_id: Paths.project_id(project),
      name: project.name,
      due: Operately.Time.as_datetime(project.next_check_in_scheduled_at),
      type: :project,
      path: path,
      url: Paths.to_url(path),
      management_hierarchy: ManagementHierarchy.find(project, reports)
    }
  end
end

defimpl Operately.Assignments.Reviewable, for: Operately.Projects.CheckIn do
  alias OperatelyWeb.Paths
  alias Operately.Assignments.{Assignment, ManagementHierarchy}

  def reviewer_id(check_in), do: check_in.project.reviewer && check_in.project.reviewer.id

  def due_date(check_in), do: check_in.inserted_at

  def is_reviewer?(check_in, person), do: reviewer_id(check_in) == person.id

  def to_assignment(check_in, company, reports) do
    path = Paths.project_check_in_path(company, check_in)

    %Assignment{
      resource_id: Paths.project_check_in_id(check_in),
      name: check_in.project.name,
      due: Operately.Time.as_datetime(check_in.inserted_at),
      type: :check_in,
      path: path,
      url: Paths.to_url(path),
      author_id: Paths.person_id(check_in.author),
      author_name: check_in.author.full_name,
      management_hierarchy: ManagementHierarchy.find(check_in, reports)
    }
  end
end

defimpl Operately.Assignments.Reviewable, for: Operately.Goals.Goal do
  alias OperatelyWeb.Paths
  alias Operately.Assignments.{Assignment, ManagementHierarchy}

  def reviewer_id(goal), do: goal.reviewer_id

  def due_date(goal), do: goal.next_update_scheduled_at

  def is_reviewer?(goal, person), do: reviewer_id(goal) == person.id

  def to_assignment(goal, company, reports) do
    path = Paths.goal_check_in_new_path(company, goal)

    %Assignment{
      resource_id: Paths.goal_id(goal),
      name: goal.name,
      due: Operately.Time.as_datetime(goal.next_update_scheduled_at),
      type: :goal,
      path: path,
      url: Paths.to_url(path),
      management_hierarchy: ManagementHierarchy.find(goal, reports)
    }
  end
end

defimpl Operately.Assignments.Reviewable, for: Operately.Goals.Update do
  alias OperatelyWeb.Paths
  alias Operately.Assignments.{Assignment, ManagementHierarchy}

  def reviewer_id(update), do: update.goal.reviewer_id

  def due_date(update), do: update.inserted_at

  def is_reviewer?(update, person), do: reviewer_id(update) == person.id

  def to_assignment(update, company, reports) do
    path = Paths.goal_check_in_path(company, update)

    %Assignment{
      resource_id: Paths.goal_update_id(update),
      name: update.goal.name,
      due: Operately.Time.as_datetime(update.inserted_at),
      type: :goal_update,
      path: path,
      url: Paths.to_url(path),
      author_id: Paths.person_id(update.author),
      author_name: update.author.full_name,
      management_hierarchy: ManagementHierarchy.find(update, reports)
    }
  end
end
