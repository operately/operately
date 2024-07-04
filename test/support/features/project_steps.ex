defmodule Operately.Support.Features.ProjectSteps do
  use Operately.FeatureCase
  alias Operately.Access.Binding
  alias Operately.Support.Features.UI
  alias Operately.Support.Features.EmailSteps
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.FeedSteps

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures

  step :given_a_goal_exists, ctx, name: name do
    {:ok, goal} = Operately.Goals.create_goal(ctx.champion, %{
      company_id: ctx.company.id,
      space_id: ctx.group.id,
      name: name,
      champion_id: ctx.champion.id,
      reviewer_id: ctx.reviewer.id,
      timeframe: %{
        start_date: ~D[2021-01-01],
        end_date: ~D[2021-12-31],
        type: "year"
      },
      targets: [
        %{
          name: "First response time",
          from: 30,
          to: 15,
          unit: "minutes",
          index: 0
        },
        %{
          name: "Increase feedback score to 90%",
          from: 80,
          to: 90,
          unit: "percent",
          index: 1
        }
      ]
    })

    Map.put(ctx, :goal, goal)
  end

  def create_project(ctx, name: name) do
    company = company_fixture(%{name: "Test Org"})
    champion = person_fixture_with_account(%{company_id: company.id, full_name: "John Champion"})
    reviewer = person_fixture_with_account(%{company_id: company.id, full_name: "Leonardo Reviewer"})
    group = group_fixture(champion, %{company_id: company.id, name: "Test Group"})

    params = %Operately.Operations.ProjectCreation{
      company_id: company.id,
      name: name,
      champion_id: champion.id,
      reviewer_id: reviewer.id,
      creator_id: champion.id,
      creator_role: nil,
      visibility: "everyone",
      group_id: group.id,
      company_access_level: Binding.view_access(),
      space_access_level: Binding.comment_access(),
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
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
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
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
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
    |> UI.click(testid: "goal-#{String.downcase(goal_name) |> String.replace(" ", "-")}")

    project = Operately.Projects.get_project!(ctx.project.id)
    project = Operately.Repo.preload(project, :goal)

    Map.put(ctx, :project, project)
  end

  step :assert_goal_connected, ctx, goal_name: goal_name do
    ctx
    |> UI.assert_text(goal_name, testid: "project-goal-link")

    project = Operately.Projects.get_project!(ctx.project.id)
    project = Operately.Repo.preload(project, :goal)

    assert project.goal.name == goal_name

    ctx
  end

  step :assert_goal_link_on_project_page, ctx, goal_name: goal_name do
    ctx
    |> UI.assert_page(Paths.project_path(ctx.company, ctx.project))
    |> UI.assert_text(goal_name)
    |> UI.click(testid: "project-goal-link")
    |> UI.assert_page(Paths.goal_path(ctx.company, ctx.goal))
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

  step :given_the_goal_is_connected_with_project, ctx do
    {:ok, project} = Operately.Projects.update_project(ctx.project, %{goal_id: ctx.goal.id})
    project = Operately.Repo.preload(project, :goal)

    Map.put(ctx, :project, project)
  end

  step :disconnect_goal, ctx do
    ctx
    |> UI.assert_page(Paths.project_path(ctx.company, ctx.project))
    |> UI.click(testid: "project-options-button")
    |> UI.click(testid: "connect-project-to-goal-link")
    |> UI.click(testid: "disconnect-goal")
  end

  step :assert_goal_link_not_on_project_page, ctx do
    ctx
    |> UI.assert_page(Paths.project_path(ctx.company, ctx.project))
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

  step :given_a_space_exists, ctx, %{name: name} do
    new_space = group_fixture(ctx.champion, %{name: name, company_id: ctx.company.id})
    Map.put(ctx, :new_space, new_space)
  end

  step :move_project_to_new_space, ctx do
    ctx
    |> UI.click(testid: "project-options-button")
    |> UI.click(testid: "move-project-link")
    |> UI.click(testid: "space-#{Paths.space_id(ctx.new_space)}")
  end

  step :assert_project_moved_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.assert_project_moved_sent(author: ctx.champion, old_space: ctx.group, new_space: ctx.new_space)
  end

  step :assert_project_moved_feed_item_exists, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> FeedSteps.assert_project_moved(author: ctx.champion, old_space: ctx.group, new_space: ctx.new_space)
  end

  #
  # Navigation between project pages
  #

  step :visit_project_page, ctx do
    ctx |> UI.visit(Paths.project_path(ctx.company, ctx.project))
  end

  def visit_project_milestones_page(ctx, milestone_name) do
    {:ok, milestone} = Operately.Projects.get_milestone_by_name(ctx.project, milestone_name)

    ctx |> UI.visit(Paths.project_milestone_path(ctx.company, ctx.project, milestone))
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
      action: "paused the #{ctx.project.name} project",
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
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
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
      action: "resumed the #{ctx.project.name} project",
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
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.find(UI.query(testid: "project-feed"), fn el ->
      el |> UI.assert_text("resumed the project")
    end)
  end

  step :rename_project, ctx, new_name: new_name do
    ctx
    |> UI.click(testid: "project-options-button")
    |> UI.click(testid: "edit-project-name-button")
    |> UI.fill(testid: "project-name-input", with: new_name)
    |> UI.click(testid: "save")
  end

  step :assert_project_renamed, ctx, new_name: new_name do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.assert_text(new_name)

    project = Operately.Projects.get_project!(ctx.project.id)

    assert project.name == new_name

    ctx
  end

  step :given_a_person_exists, ctx, name: name do
    person_fixture_with_account(%{
      full_name: name,
      title: "Manager",
      company_id: ctx.company.id
    })

    ctx
  end

  step :add_contributor, ctx, name: name, responsibility: responsibility do
    ctx
    |> UI.click(testid: "manage-team-button")
    |> UI.click(testid: "add-contributor-button")
    |> UI.select_person_in(id: "people-search", name: name)
    |> UI.fill(testid: "contributor-responsibility-input", with: responsibility)
    |> UI.click(testid: "save-contributor")
    |> UI.sleep(200)
  end

  step :assert_contributor_added, ctx, name: name, responsibility: responsibility do
    ctx
    |> UI.assert_text(name)
    |> UI.assert_text(responsibility)

    contributors = Operately.Projects.list_project_contributors(ctx.project)
    contributors = Operately.Repo.preload(contributors, :person)
    contrib = Enum.find(contributors, fn c -> c.person.full_name == name end)

    assert contrib != nil
    assert contrib.responsibility == responsibility

    ctx
  end

  step :assert_contributor_added_feed_item_exists, ctx, name: name do
    contributors = Operately.Projects.list_project_contributors(ctx.project)
    contributors = Operately.Repo.preload(contributors, :person)
    contrib = Enum.find(contributors, fn c -> c.person.full_name == name end)

    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> FeedSteps.assert_feed_item_exists(%{
      author: ctx.champion,
      title: "added #{Operately.People.Person.short_name(contrib.person)} to the project",
    })
  end

  step :assert_contributor_added_notification_sent, ctx, name: name do
    contributors = Operately.Projects.list_project_contributors(ctx.project)
    contributors = Operately.Repo.preload(contributors, :person)
    contrib = Enum.find(contributors, fn c -> c.person.full_name == name end)

    ctx
    |> UI.login_as(contrib.person)
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "added you as a contributor"
    })
  end

  step :assert_contributor_added_email_sent, ctx, name: name do
    contributors = Operately.Projects.list_project_contributors(ctx.project)
    contributors = Operately.Repo.preload(contributors, :person)
    contrib = Enum.find(contributors, fn c -> c.person.full_name == name end)

    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: contrib.person,
      author: ctx.champion,
      action: "added you as a contributor"
    })
  end

  step :given_the_project_has_contributor, ctx, name: name do
    contrib = person_fixture_with_account(%{full_name: name, title: "Manager", company_id: ctx.company.id})

    {:ok, _} = Operately.Projects.create_contributor(%{
      person_id: contrib.id,
      role: "contributor",
      project_id: ctx.project.id,
      responsibility: "Lead the backend implementation"
    })

    ctx
  end

  step :remove_contributor, ctx, name: name do
    ctx
    |> UI.click(testid: "project-contributors")
    |> UI.click(testid: "edit-contributor-#{String.downcase(name) |> String.replace(" ", "-")}")
    |> UI.click(testid: "remove-contributor")
  end

  step :assert_contributor_removed, ctx, name: name do
    contributors = Operately.Projects.list_project_contributors(ctx.project)
    contributors = Operately.Repo.preload(contributors, :person)
    contrib = Enum.find(contributors, fn c -> c.person.full_name == name end)

    assert contrib == nil

    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.click(testid: "project-contributors")
    |> UI.refute_has(Query.text("Michael Scott"))
  end

  step :assert_project_description_absent, ctx do
    ctx
    |> UI.assert_text("Project description is not yet set")
    |> UI.assert_text("Write project description")
  end

  step :submit_project_description, ctx, description: description do
    ctx
    |> UI.click(testid: "write-project-description-link")
    |> UI.fill_rich_text(description)
    |> UI.click(testid: "save")
  end

  step :assert_project_description_present, ctx, description: description do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.assert_text(description)
  end

  step :given_project_has_description, ctx, description: description do
    {:ok, _project} = Operately.Projects.update_project(ctx.project, %{
      description: Operately.Support.RichText.rich_text(description)
    })
    ctx
  end

  step :edit_project_description, ctx, description: description do
    ctx
    |> UI.click(testid: "edit-project-description-link")
    |> UI.fill_rich_text(description)
    |> UI.click(testid: "save")
    |> UI.assert_page(Paths.project_path(ctx.company, ctx.project))
  end

end
