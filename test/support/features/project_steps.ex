defmodule Operately.Support.Features.ProjectSteps do
  use Operately.FeatureCase
  alias Operately.Support.Features.UI
  alias Operately.Support.Features.EmailSteps
  alias Operately.Support.Features.NotificationsSteps

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures

  def create_project(ctx, name: name) do
    company = company_fixture(%{name: "Test Org"})
    champion = person_fixture_with_account(%{company_id: company.id, full_name: "John Champion"})
    reviewer = person_fixture_with_account(%{company_id: company.id, full_name: "Leonardo Reviewer"})
    group = group_fixture(champion, %{company_id: company.id, name: "Test Group"})

    params = %Operately.Projects.ProjectCreation{
      company_id: company.id,
      name: name,
      champion_id: champion.id,
      reviewer_id: reviewer.id,
      creator_id: champion.id,
      creator_role: nil,
      visibility: "everyone",
      group_id: group.id,
    }

    {:ok, project} = Operately.Projects.create_project(params)

    Map.merge(ctx, %{company: company, champion: champion, project: project, reviewer: reviewer, group: group})
  end

  def add_milestone(ctx, attrs) do
    attrs = %{project_id: ctx.project.id} |> Map.merge(attrs)

    {:ok, _} = Operately.Projects.create_milestone(ctx.champion, attrs)

    ctx
  end

  def login(ctx) do
    case ctx[:login_as] do
      :champion ->
        UI.login_as(ctx, ctx.champion)
      :reviewer ->
        UI.login_as(ctx, ctx.reviewer)
      _ ->
        ctx
    end
  end

  def post_new_discussion(ctx, title: title, body: body) do
    ctx
    |> visit_project_page()
    |> UI.click(testid: "new-discussion-button")
    |> UI.fill(testid: "discussion-title-input", with: title)
    |> UI.fill_rich_text(body)
    |> UI.click(testid: "submit-discussion-button")
  end

  def post_comment(ctx, body: body) do
    ctx
    |> UI.click(testid: "add-comment")
    |> UI.fill_rich_text(body)
    |> UI.click(testid: "post-comment")
  end

  def click_on_discussion(ctx, title: title) do
    ctx |> UI.click(title: title)
  end

  def submit_check_in(ctx, content: content) do
    ctx
    |> visit_project_page()
    |> UI.click(testid: "add-check-in")
    |> UI.fill_rich_text(content)
    |> UI.click(testid: "post-check-in")
  end

  def acknowledge_check_in(ctx) do
    ctx
    |> UI.click(testid: "acknowledge-update")
  end

  def acknowledge_review(ctx) do
    ctx
    |> UI.click(testid: "acknowledge-update")
  end

  step :choose_new_goal, ctx, goal_name: goal_name do
    ctx
    |> UI.click(testid: "project-options-button")
    |> UI.click(testid: "connect-project-to-goal-link")
    |> UI.assert_text(goal_name)
    |> UI.click(testid: "select-goal-#{String.downcase(goal_name) |> String.replace(" ", "-")}")

    project = Operately.Projects.get_project!(ctx.project.id)
    project = Operately.Repo.preload(project, :goal)

    Map.put(ctx, :project, project)
  end

  step :assert_goal_connected, ctx, goal_name: goal_name do
    project = Operately.Projects.get_project!(ctx.project.id)
    project = Operately.Repo.preload(project, :goal)

    assert ctx.project.goal.name == goal_name
    ctx
  end

  step :assert_goal_link_on_project_page, ctx, goal_name: goal_name do
    ctx 
    |> UI.assert_page("/projects/#{ctx.project.id}")
    |> UI.assert_text(goal_name)
    |> UI.click(testid: "project-goal-link")
    |> UI.assert_page("/goals/#{ctx.project.goal.id}")
    |> UI.assert_text(goal_name)
  end

  step :assert_goal_connected_email_sent_to_champion, ctx, goal_name: goal_name do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.reviewer,
      author: ctx.champion,
      action: "connected the project to the #{goal_name} goal",
    })
  end

  step :assert_goal_connected_notification_sent_to_reviewer, ctx, goal_name: goal_name do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "connected the #{ctx.project.name} project to the #{goal_name} goal",
    })
  end

  step :connect_goal, ctx, goal do
    {:ok, project} = Operately.Projects.update_project(ctx.project, %{goal_id: goal.id})
    project = Operately.Repo.preload(project, :goal)

    Map.put(ctx, :project, project)
  end

  step :disconnect_goal, ctx do
    ctx
    |> UI.assert_page("/projects/#{ctx.project.id}")
    |> UI.click(testid: "project-options-button")
    |> UI.click(testid: "connect-project-to-goal-link")
    |> UI.click(testid: "disconnect-goal")
  end

  step :assert_goal_link_not_on_project_page, ctx do
    ctx
    |> UI.assert_page("/projects/#{ctx.project.id}")
    |> UI.assert_text("Not yet connected to a goal")
  end

  step :assert_goal_disconnected_email_sent_to_champion, ctx, goal_name: goal_name do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.reviewer,
      author: ctx.champion,
      action: "disconnected the project from the #{goal_name} goal",
    })  
  end

  step :assert_goal_disconnected_notification_sent_to_reviewer, ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "disconnected the #{ctx.project.name} project from the Improve support first response time goal",
    })
  end

  # 
  # Navigation between project pages
  #

  step :visit_project_page, ctx do
    ctx |> UI.visit("/projects/#{ctx.project.id}")
  end

  def visit_project_milestones_page(ctx, milestone_name) do
    {:ok, milestone} = Operately.Projects.get_milestone_by_name(ctx.project, milestone_name)

    ctx |> UI.visit("/projects/#{ctx.project.id}/milestones/#{milestone.id}")
  end

  def follow_last_check_in(ctx) do
    ctx |> UI.click(testid: "last-check-in-link")
  end

  #
  # Assertions
  #

  def assert_email_sent_to_all_contributors(ctx, subject: subject, except: except) do
    contributors = Operately.Projects.list_project_contributors(ctx.project)

    Enum.each(contributors, fn contributor ->
      email = Operately.People.get_person!(contributor.person_id).email

      unless Enum.member?(except, email) do
        UI.assert_email_sent(ctx, subject, to: email)
      end
    end)

    Enum.each(except, fn email ->
      UI.refute_email_sent(ctx, subject, to: email)
    end)
  end

  def assert_discussion_exists(ctx, title: title) do
    ctx |> UI.assert_text(title)
  end

  step :pause_project, ctx do
    ctx 
    |> UI.click(testid: "project-options-button")
    |> UI.click(testid: "pause-project-link")
    |> UI.click(testid: "pause-project-button")
  end

  step :assert_project_paused, ctx do
    ctx |> UI.assert_text("Paused")
  end

  step :assert_pause_notification_sent_to_reviewer, ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "paused the project",
    })
  end

  step :assert_pause_email_sent_to_reviewer, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.reviewer,
      action: "paused the project",
      author: ctx.champion,
    })
  end

  step :assert_pause_visible_on_project_feed, ctx do
    ctx
    |> UI.visit("/projects/#{ctx.project.id}")
    |> UI.find(UI.query(testid: "project-feed"), fn el ->
      el |> UI.assert_text("paused the project")
    end)
  end

  step :resume_project, ctx do
    ctx 
    |> UI.click(testid: "project-options-button")
    |> UI.click(testid: "resume-project-link")
    |> UI.click(testid: "resume-project-button")
  end

  step :assert_project_active, ctx do
    ctx |> UI.assert_text("On Track")
  end

  step :assert_resume_notification_sent_to_reviewer, ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "resumed the project",
    })
  end

  step :assert_resume_email_sent_to_reviewer, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.reviewer,
      action: "resumed the project",
      author: ctx.champion,
    })
  end

  step :assert_resume_visible_on_project_feed, ctx do
    ctx
    |> UI.visit("/projects/#{ctx.project.id}")
    |> UI.find(UI.query(testid: "project-feed"), fn el ->
      el |> UI.assert_text("resumed the project")
    end)
  end

end
