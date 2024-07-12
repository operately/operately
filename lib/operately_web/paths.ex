defmodule OperatelyWeb.Paths do
  alias Operately.Goals.Goal
  alias Operately.Groups.Group
  alias Operately.Projects.Project
  alias Operately.Companies.Company
  alias Operately.People.Person
  alias Operately.Projects.Milestone

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
    create_path([company_id(company), "goals", goal_id(goal), "progress-updates", goal_update_id(update)])
  end

  def goal_check_in_new_path(company = %Company{}, goal = %Goal{}) do
    create_path([company_id(company), "goals", goal_id(goal), "progress-updates", "new"])
  end

  def goal_activity_path(company = %Company{}, activity) do
    create_path([company_id(company), "goal-activities", activity_id(activity)])
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

  def project_check_in_path(company = %Company{}, check_in) do
    create_path([company_id(company), "project-check-ins", project_check_in_id(check_in)])
  end

  def project_check_in_new_path(company = %Company{}, project = %Project{}) do
    create_path([company_id(company), "projects", project_id(project), "check-ins", "new"])
  end

  def project_retrospective_path(company = %Company{}, project = %Project{}) do
    create_path([company_id(company), "projects", project_id(project), "retrospective"])
  end

  def project_milestone_path(company = %Company{}, milestone = %Milestone{}) do
    create_path([company_id(company), "milestones", milestone_id(milestone)])
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
    id = Operately.ShortUuid.encode!(goal.id)
    OperatelyWeb.Api.Helpers.id_with_comments(goal.name, id)
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
    date = check_in.inserted_at |> NaiveDateTime.to_date() |> Date.to_string()
    OperatelyWeb.Api.Helpers.id_with_comments(date, id)
  end

  def goal_update_id(update) do
    id = Operately.ShortUuid.encode!(update.id)
    date = update.inserted_at |> NaiveDateTime.to_date() |> Date.to_string()
    OperatelyWeb.Api.Helpers.id_with_comments(date, id)
  end

  def milestone_id(milestone) do
    milestone_id(milestone.id, milestone.title)
  end

  def milestone_id(id, title) do
    id = Operately.ShortUuid.encode!(id)
    OperatelyWeb.Api.Helpers.id_with_comments(title, id)
  end

  def key_resource_id(resource) do
    id = Operately.ShortUuid.encode!(resource.id)
    OperatelyWeb.Api.Helpers.id_with_comments(resource.title, id)
  end

  def activity_id(activity) do
    id = Operately.ShortUuid.encode!(activity.id)

    comment = case activity.action do
      "goal_discussion_creation" -> activity.comment_thread.title
      _ -> activity.action |> String.replace("_", "-") |> String.replace("goal-", "")
    end

    OperatelyWeb.Api.Helpers.id_with_comments(comment, id)
  end

  def person_id(person) do
    id = Operately.ShortUuid.encode!(person.id)
    OperatelyWeb.Api.Helpers.id_with_comments(person.full_name, id)
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
