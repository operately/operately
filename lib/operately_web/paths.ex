defmodule OperatelyWeb.Paths do
  alias Operately.Goals.Goal
  alias Operately.Groups.Group
  alias Operately.Projects.Project
  alias Operately.Companies.Company
  alias Operately.People.Person

  def account_path(company = %Company{}) do
    create_path([company_id(company), "account"])
  end

  def home_path(company = %Company{}) do
    create_path([company_id(company)])
  end

  def profile_path(company = %Company{}, person = %Person{}) do
    create_path([company_id(company), "people", person.id])
  end

  def goal_path(company = %Company{}, goal = %Goal{}) do
    create_path([company_id(company), "goals", goal_id(goal)])
  end

  def goal_check_in_path(company = %Company{}, goal = %Goal{}, update) do
    create_path([company_id(company), "goals", goal_id(goal), "progress-updates", update.id])
  end

  def goal_check_in_new_path(company = %Company{}, goal = %Goal{}) do
    create_path([company_id(company), "goals", goal_id(goal), "progress-updates", "new"])
  end

  def goal_activity_path(company = %Company{}, goal = %Goal{}, activity) do
    create_path([company_id(company), "goals", goal_id(goal), "activities", activity.id])
  end

  def goal_discussions_path(company = %Company{}, goal = %Goal{}) do
    create_path([company_id(company), "goals", goal_id(goal), "discussions"])
  end

  def goals_path(company = %Company{}) do
    create_path([company_id(company), "goals"])
  end

  def space_path(company = %Company{}, space = %Group{}) do
    create_path([company_id(company), "spaces", space_id(space)])
  end

  def space_goals_path(company = %Company{}, space = %Group{}) do
    create_path([company_id(company), "spaces", space_id(space), "goals"])
  end

  def space_discussions_path(company = %Company{}, space = %Group{}) do
    create_path([company_id(company), "spaces", space_id(space), "discussions"])
  end

  def space_discussions_new_path(company = %Company{}, space = %Group{}) do
    create_path([company_id(company), "spaces", space_id(space), "discussions", "new"])
  end

  def feed_path(company = %Company{}) do
    create_path([company_id(company), "feed"])
  end

  def notifications_path(company = %Company{}) do
    create_path([company_id(company), "notifications"])
  end

  def discussion_path(company = %Company{}, discussion) do
    create_path([company_id(company), "discussions", discussion_id(discussion)])
  end

  def project_path(company = %Company{}, project = %Project{}) do
    create_path([company_id(company), "projects", project_id(project)])
  end

  def project_check_in_path(company = %Company{}, project = %Project{}, check_in) do
    create_path([company_id(company), "projects", project_id(project), "check-ins", project_check_in_id(check_in.id)])
  end

  def project_check_in_new_path(company = %Company{}, project = %Project{}) do
    create_path([company_id(company), "projects", project_id(project), "check-ins", "new"])
  end

  def project_retrospective_path(company = %Company{}, project = %Project{}) do
    create_path([company_id(company), "projects", project_id(project), "retrospective"])
  end

  def project_milestone_path(company = %Company{}, project = %Project{}, milestone) do
    create_path([company_id(company), "projects", project_id(project), "milestones", milestone.id])
  end

  def company_admin_path(company = %Company{}) do
    create_path([company_id(company), "admin"])
  end

  @doc """
  Returns the URL for the given path.

  Example:
    path = Paths.goal_path(company, goal)
    url = Paths.to_url(path)
  """
  def to_url(path) do
    OperatelyWeb.Endpoint.url() <> path
  end

  #
  # ID Helpers
  #

  def company_id(company) do
    short_id = Operately.Companies.ShortId.encode!(company.short_id)
    OperatelyWeb.Api.Helpers.id_with_comments(company.name, short_id)
  end

  def space_id(space) do
    id = Operately.ShortUuid.encode!(space.id)
    OperatelyWeb.Api.Helpers.id_with_comments(space.name, id)
  end

  def goal_id(goal) do
    goal.id
  end

  def project_id(project) do
    id = Operately.ShortUuid.encode!(project.id)
    OperatelyWeb.Api.Helpers.id_with_comments(project.name, id)
  end

  def task_id(task) do
    id = Operately.ShortUuid.encode!(task.id)
    OperatelyWeb.Api.Helpers.id_with_comments(task.name, id)
  end

  def discussion_id(discussion) do
    id = Operately.ShortUuid.encode!(discussion.id)
    title = discussion.content[:title] || discussion.content["title"] || ""
    OperatelyWeb.Api.Helpers.id_with_comments(title, id)
  end

  def project_check_in_id(check_in) do
    id = Operately.ShortUuid.encode!(check_in.id)
    date = check_in.inserted_at |> Timex.format!("{YYYY}-{0M}-{0D}")
    OperatelyWeb.Api.Helpers.id_with_comments(date, id)
  end

  #
  # Path Construction Helpers
  #

  def create_path(parts) do
    if Enum.any?(parts, fn part -> part == nil end) do
      raise ArgumentError, "illegal nil in path parts"
    end

    if Enum.any?(parts, fn part -> part == "" end) do
      raise ArgumentError, "illegal empty string in path parts"
    end

    "/" <> Enum.join(parts, "/")
  end

end
