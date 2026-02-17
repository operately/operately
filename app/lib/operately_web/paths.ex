defmodule OperatelyWeb.Paths do
  alias Operately.Goals.Goal
  alias Operately.Groups.Group
  alias Operately.Projects.Project
  alias Operately.Companies.Company
  alias Operately.People.Person
  alias Operately.Projects.Milestone
  alias Operately.Tasks.Task
  alias Operately.Updates.Comment

  def agent_run_id(run = %Operately.People.AgentRun{}) do
    Operately.ShortUuid.encode!(run.id)
  end

  def account_path(company = %Company{}) do
    create_path([company_id(company), "account"])
  end

  def login_path do
    create_path(["log_in"])
  end

  def join_path(token) when is_binary(token) do
    create_path(["join"]) <> "?token=#{token}"
  end

  def person_path(company = %Company{}, person = %Person{}) do
    create_path([company_id(company), "people", person_id(person)])
  end

  def home_path(company = %Company{}) do
    create_path([company_id(company)])
  end

  def people_path(company = %Company{}) do
    create_path([company_id(company), "people"])
  end

  def org_chart_path(company = %Company{}) do
    create_path([company_id(company), "people", "org-chart"])
  end

  def review_path(company = %Company{}) do
    create_path([company_id(company), "review"])
  end

  def profile_path(company = %Company{}, person = %Person{}) do
    create_path([company_id(company), "people", person_id(person)])
  end

  def profile_edit_path(company = %Company{}, person = %Person{}) do
    create_path([company_id(company), "people", person_id(person), "profile", "edit"])
  end

  def goal_path(company = %Company{}, goal = %Goal{}) do
    create_path([company_id(company), "goals", goal_id(goal)])
  end

  def goal_path(company = %Company{}, goal = %Goal{}, tab: tab) do
    create_path([company_id(company), "goals", goal_id(goal)]) <> "?tab=#{tab}"
  end

  def export_goal_markdown_path(company = %Company{}, goal = %Goal{}) do
    create_path([company_id(company), "exports", "markdown", "goals", goal_id(goal)])
  end

  def new_goal_path(company = %Company{}) do
    create_path([company_id(company), "goals", "new"])
  end

  def goal_closing_path(company = %Company{}, goal = %Goal{}) do
    create_path([company_id(company), "goals", goal_id(goal), "complete"])
  end

  def goal_reopening_path(company = %Company{}, goal = %Goal{}) do
    create_path([company_id(company), "goals", goal_id(goal), "reopen"])
  end

  def goal_check_in_path(company = %Company{}, update) do
    create_path([company_id(company), "goal-check-ins", goal_update_id(update)])
  end

  def goal_check_in_path(company = %Company{}, update, comment = %Comment{}) do
    update_with_comment = goal_update_id(update) <> "#" <> comment_id(comment)

    create_path([company_id(company), "goal-check-ins", update_with_comment])
  end

  def goal_check_in_new_path(company = %Company{}, goal = %Goal{}) do
    create_path([company_id(company), "goals", goal_id(goal), "check-ins", "new"])
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

  def new_goal_discussion_path(company = %Company{}, goal = %Goal{}) do
    create_path([company_id(company), "goals", goal_id(goal), "discussions", "new"])
  end

  def goal_access_path(company = %Company{}, goal = %Goal{}) do
    create_path([company_id(company), "goals", goal_id(goal), "access"])
  end

  def work_map_path(company = %Company{}) do
    create_path([company_id(company), "work-map"])
  end

  def work_map_path(company = %Company{}, tab: tab) do
    create_path([company_id(company), "work-map"]) <> "?tab=#{tab}"
  end

  def space_path(company = %Company{}, space = %Group{}) do
    create_path([company_id(company), "spaces", space_id(space)])
  end

  def new_space_path(company = %Company{}) do
    create_path([company_id(company), "spaces", "new"])
  end

  def space_discussions_path(company = %Company{}, space = %Group{}) do
    create_path([company_id(company), "spaces", space_id(space), "discussions"])
  end

  def space_discussions_new_path(company = %Company{}, space = %Group{}) do
    create_path([company_id(company), "spaces", space_id(space), "discussions", "new"])
  end

  def space_work_map_path(company = %Company{}, space = %Group{}) do
    create_path([company_id(company), "spaces", space_id(space), "work-map"])
  end

  def space_kanban_path(company = %Company{}, space = %Group{}) do
    create_path([company_id(company), "spaces", space_id(space), "kanban"])
  end

  def space_task_path(company = %Company{}, space = %Group{}, task = %Operately.Tasks.Task{}) do
    create_path([company_id(company), "spaces", space_id(space), "kanban"]) <> "?taskId=#{task_id(task)}"
  end

  def task_path(company = %Company{}, task = %Task{}) do
    case Task.task_type(task) do
      "space" -> space_task_path(company, task.space, task)
      "project" -> project_task_path(company, task)
    end
  end

  def task_path(company = %Company{}, task = %Task{}, comment = %Comment{}) do
    case Task.task_type(task) do
      "space" -> space_task_path(company, task.space, task)
      "project" -> project_task_path(company, task, comment)
    end
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

  def project_path(company = %Company{}, project = %Project{}, tab: tab) do
    create_path([company_id(company), "projects", project_id(project)]) <> "?tab=#{tab}"
  end

  def export_project_markdown_path(company = %Company{}, project = %Project{}) do
    create_path([company_id(company), "exports", "markdown", "projects", project_id(project)])
  end

  def pause_project_path(company = %Company{}, project = %Project{}) do
    create_path([company_id(company), "projects", project_id(project), "pause"])
  end

  def resume_project_path(company = %Company{}, project = %Project{}) do
    create_path([company_id(company), "projects", project_id(project), "resume"])
  end

  def project_discussion_path(company = %Company{}, discussion) do
    create_path([company_id(company), "project-discussions", comment_thread_id(discussion)])
  end

  def project_discussion_path(company = %Company{}, discussion, comment = %Comment{}) do
    discussion_with_comment = comment_thread_id(discussion) <> "#" <> comment_id(comment)

    create_path([company_id(company), "project-discussions", discussion_with_comment])
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

    create_path([
      company_id(company),
      "projects",
      project_id(project),
      retrospective_with_comment
    ])
  end

  def project_milestone_path(company = %Company{}, milestone = %Milestone{}) do
    create_path([company_id(company), "milestones", milestone_id(milestone)])
  end

  def project_milestone_kanban_path(company = %Company{}, milestone = %Milestone{}) do
    create_path([company_id(company), "milestones", milestone_id(milestone), "kanban"])
  end

  def project_milestone_path(company = %Company{}, milestone = %Milestone{}, comment = %Comment{}) do
    milestone_with_comment = milestone_id(milestone) <> "#" <> comment_id(comment)

    create_path([company_id(company), "milestones", milestone_with_comment])
  end

  def project_task_path(company = %Company{}, task) do
    create_path([company_id(company), "tasks", task_id(task)])
  end

  def project_task_path(company = %Company{}, task, comment = %Comment{}) do
    task_with_comment = task_id(task) <> "#" <> comment_id(comment)

    create_path([company_id(company), "tasks", task_with_comment])
  end

  def project_activity_path(company = %Company{}, activity) do
    create_path([company_id(company), "project-activities", activity_id(activity)])
  end

  def project_activity_path(company = %Company{}, activity, comment = %Comment{}) do
    activity_with_comment = activity_id(activity) <> "#" <> comment_id(comment)

    create_path([company_id(company), "project-activities", activity_with_comment])
  end

  def company_admin_path(company = %Company{}) do
    create_path([company_id(company), "admin"])
  end

  def company_manage_people_path(company = %Company{}) do
    create_path([company_id(company), "admin", "manage-people"])
  end

  def company_member_type_selection_path(company = %Company{}) do
    create_path([company_id(company), "invite-people"])
  end

  def company_invite_person_path(company = %Company{}) do
    create_path([company_id(company), "admin", "manage-people", "add"])
  end

  def company_invite_team_path(company = %Company{}) do
    create_path([company_id(company), "invite-team"])
  end

  def resource_hub_path(company = %Company{}, resource_hub) do
    create_path([company_id(company), "resource-hubs", resource_hub_id(resource_hub)])
  end

  def resource_hub_drafts_path(company = %Company{}, resource_hub) do
    create_path([company_id(company), "resource-hubs", resource_hub_id(resource_hub), "drafts"])
  end

  def new_document_path(company = %Company{}, resource_hub) do
    create_path([
      company_id(company),
      "resource-hubs",
      resource_hub_id(resource_hub),
      "new-document"
    ])
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

  def link_path(company = %Company{}, link) do
    create_path([company_id(company), "links", link_id(link)])
  end

  def link_path(company = %Company{}, link, comment = %Comment{}) do
    link_with_comment = link_id(link) <> "#" <> comment_id(comment)

    create_path([company_id(company), "links", link_with_comment])
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

  def goal_id(goal_id) when is_binary(goal_id) do
    Operately.ShortUuid.encode!(goal_id)
  end

  def goal_id(%{id: id, name: name}) do
    id = Operately.ShortUuid.encode!(id)
    OperatelyWeb.Api.Helpers.id_with_comments(name, id)
  end

  def goal_check_id(check_id) when is_binary(check_id) do
    Operately.ShortUuid.encode!(check_id)
  end

  def goal_check_id(%Operately.Goals.Check{id: id}) do
    Operately.ShortUuid.encode!(id)
  end

  def goal_discussion_id(%{id: id, title: title}) do
    id = Operately.ShortUuid.encode!(id)
    OperatelyWeb.Api.Helpers.id_with_comments(title, id)
  end

  def target_id(target = %Operately.Goals.Target{}) do
    Operately.ShortUuid.encode!(target.id)
  end

  def target_id(target_id) when is_binary(target_id) do
    Operately.ShortUuid.encode!(target_id)
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

  def goal_update_id(update_id) when is_binary(update_id) do
    Operately.ShortUuid.encode!(update_id)
  end

  def goal_update_id(update) do
    id = Operately.ShortUuid.encode!(update.id)
    date = update.inserted_at |> NaiveDateTime.to_date() |> Date.to_string()
    OperatelyWeb.Api.Helpers.id_with_comments(date, id)
  end

  def comment_thread_id(comment_thread) do
    id = Operately.ShortUuid.encode!(comment_thread.id)

    if comment_thread.title do
      OperatelyWeb.Api.Helpers.id_with_comments(comment_thread.title, id)
    else
      date = comment_thread.inserted_at |> NaiveDateTime.to_date() |> Date.to_string()
      OperatelyWeb.Api.Helpers.id_with_comments(date, id)
    end
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

    comment =
      case activity.action do
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

  def resource_hub_id(resource_hub = %Operately.ResourceHubs.ResourceHub{}) do
    id = Operately.ShortUuid.encode!(resource_hub.id)
    OperatelyWeb.Api.Helpers.id_with_comments(resource_hub.name, id)
  end

  def resource_hub_id(resource_hub_id) do
    Operately.ShortUuid.encode!(resource_hub_id)
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

  def decode_id(id) when is_binary(id) do
    Operately.ShortUuid.decode!(id)
  end
end
