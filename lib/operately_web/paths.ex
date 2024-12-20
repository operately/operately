defmodule OperatelyWeb.Paths do
  alias Operately.Goals.Goal
  alias Operately.Groups.Group
  alias Operately.Projects.Project
  alias Operately.Companies.Company
  alias Operately.People.Person
  alias Operately.Projects.Milestone
  alias Operately.Updates.Comment

  def account_path(company = %Company{}) do
    create_path([company_id(company), "account"])
  end

  def home_path(company = %Company{}) do
    create_path([company_id(company)])
  end

  def profile_path(company = %Company{}, person = %Person{}) do
    create_path([company_id(company), "people", person_id(person)])
  end

  def goal_path(company = %Company{}, goal = %Goal{}) do
    create_path([company_id(company), "goals", goal_id(goal)])
  end

  def goal_check_in_path(company = %Company{}, update) do
    create_path([company_id(company), "goal-updates", goal_update_id(update)])
  end

  def goal_check_in_path(company = %Company{}, update, comment = %Comment{}) do
    update_with_comment = goal_update_id(update) <> "#" <> comment_id(comment)

    create_path([company_id(company), "goal-updates", update_with_comment])
  end

  def goal_check_in_new_path(company = %Company{}, goal = %Goal{}) do
    create_path([company_id(company), "goals", goal_id(goal), "progress-updates", "new"])
  end

  def goal_activity_path(company = %Company{}, activity) do
    create_path([company_id(company), "goal-activities", activity_id(activity)])
  end

  def goal_activity_path(company = %Company{}, activity, comment = %Comment{}) do
    activity_with_comment = activity_id(activity) <> "#" <> comment_id(comment)

    create_path([company_id(company), "goal-activities", activity_with_comment])
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

  def message_path(company = %Company{}, message) do
    create_path([company_id(company), "discussions", message_id(message)])
  end

  def message_path(company = %Company{}, message, comment = %Comment{}) do
    message_with_comment = message_id(message) <> "#" <> comment_id(comment)

    create_path([company_id(company), "discussions", message_with_comment])
  end

  def project_path(company = %Company{}, project = %Project{}) do
    create_path([company_id(company), "projects", project_id(project)])
  end

  def project_check_in_path(company = %Company{}, check_in) do
    create_path([company_id(company), "project-check-ins", project_check_in_id(check_in)])
  end

  def project_check_in_path(company = %Company{}, check_in, comment = %Comment{}) do
    check_in_with_comment = project_check_in_id(check_in) <> "#" <> comment_id(comment)

    create_path([company_id(company), "project-check-ins", check_in_with_comment])
  end

  def project_check_in_new_path(company = %Company{}, project = %Project{}) do
    create_path([company_id(company), "projects", project_id(project), "check-ins", "new"])
  end

  def project_retrospective_path(company = %Company{}, project = %Project{}) do
    create_path([company_id(company), "projects", project_id(project), "retrospective"])
  end

  def project_retrospective_path(company = %Company{}, project = %Project{}, comment = %Comment{}) do
    retrospective_with_comment = "retrospective#" <> comment_id(comment)

    create_path([company_id(company), "projects", project_id(project), retrospective_with_comment])
  end

  def project_milestone_path(company = %Company{}, milestone = %Milestone{}) do
    create_path([company_id(company), "milestones", milestone_id(milestone)])
  end

  def company_admin_path(company = %Company{}) do
    create_path([company_id(company), "admin"])
  end

  def resource_hub_path(company = %Company{}, resource_hub) do
    create_path([company_id(company), "resource-hubs", resource_hub_id(resource_hub)])
  end

  def new_document_path(company = %Company{}, resource_hub) do
    create_path([company_id(company), "resource-hubs", resource_hub_id(resource_hub), "new-document"])
  end

  def folder_path(company = %Company{}, folder) do
    create_path([company_id(company), "folders", folder_id(folder)])
  end

  def document_path(company = %Company{}, document) do
    create_path([company_id(company), "documents", document_id(document)])
  end

  def document_path(company = %Company{}, document, comment = %Comment{}) do
    document_with_comment = document_id(document) <> "#" <> comment_id(comment)

    create_path([company_id(company), "documents", document_with_comment])
  end

  def edit_document_path(company = %Company{}, document) do
    create_path([company_id(company), "documents", document_id(document), "edit"])
  end

  def file_path(company = %Company{}, file) do
    create_path([company_id(company), "files", file_id(file)])
  end

  def file_path(company = %Company{}, file, comment = %Comment{}) do
    file_with_comment = file_id(file) <> "#" <> comment_id(comment)

    create_path([company_id(company), "files", file_with_comment])
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

  def message_id(message) do
    id = Operately.ShortUuid.encode!(message.id)
    title = message.title
    OperatelyWeb.Api.Helpers.id_with_comments(title, id)
  end

  def messages_board_id(messages_board) do
    id = Operately.ShortUuid.encode!(messages_board.id)
    OperatelyWeb.Api.Helpers.id_with_comments(messages_board.name, id)
  end

  def project_check_in_id(check_in) do
    id = Operately.ShortUuid.encode!(check_in.id)
    date = check_in.inserted_at |> NaiveDateTime.to_date() |> Date.to_string()
    OperatelyWeb.Api.Helpers.id_with_comments(date, id)
  end

  def project_retrospective_id(retrospective) do
    id = Operately.ShortUuid.encode!(retrospective.id)
    date = retrospective.inserted_at |> NaiveDateTime.to_date() |> Date.to_string()
    OperatelyWeb.Api.Helpers.id_with_comments(date, id)
  end

  def goal_update_id(update) do
    id = Operately.ShortUuid.encode!(update.id)
    date = update.inserted_at |> NaiveDateTime.to_date() |> Date.to_string()
    OperatelyWeb.Api.Helpers.id_with_comments(date, id)
  end

  def comment_thread_id(comment_thread) do
    id = Operately.ShortUuid.encode!(comment_thread.id)
    date = comment_thread.inserted_at |> NaiveDateTime.to_date() |> Date.to_string()
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

  def comment_id(comment) do
    Operately.ShortUuid.encode!(comment.id)
  end

  def subscription_list_id(comment) do
    Operately.ShortUuid.encode!(comment.id)
  end

  def subscription_id(comment) do
    Operately.ShortUuid.encode!(comment.id)
  end

  def resource_hub_id(resource_hub) do
    id = Operately.ShortUuid.encode!(resource_hub.id)
    OperatelyWeb.Api.Helpers.id_with_comments(resource_hub.name, id)
  end

  def folder_id(folder = %Operately.ResourceHubs.Folder{}) do
    Operately.ShortUuid.encode!(folder.id)
  end

  def folder_id(folder_id) do
    Operately.ShortUuid.encode!(folder_id)
  end

  def node_id(node) do
    Operately.ShortUuid.encode!(node.id)
  end

  def document_id(document) do
    Operately.ShortUuid.encode!(document.id)
  end

  def file_id(file) do
    Operately.ShortUuid.encode!(file.id)
  end

  def link_id(link) do
    Operately.ShortUuid.encode!(link.id)
  end

  def blob_id(blob) do
    Operately.ShortUuid.encode!(blob.id)
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
