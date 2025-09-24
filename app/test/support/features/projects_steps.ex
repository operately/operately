defmodule Operately.Support.Features.ProjectSteps do
  use Operately.FeatureCase
  @endpoint OperatelyWeb.Endpoint
  alias Operately.Access.Binding
  alias Operately.Support.Features.UI
  alias Operately.Support.Features.EmailSteps
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.FeedSteps
  alias Operately.People.Person
  alias OperatelyWeb.Paths

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Phoenix.ConnTest

  defp build_api_conn(person, company) do
    person = Operately.Repo.preload(person, :account)
    account = person.account

    Phoenix.ConnTest.build_conn()
    |> Plug.Test.init_test_session(%{})
    |> OperatelyWeb.ConnCase.log_in_account(account, company)
  end

  step :given_a_goal_exists, ctx, name: name do
    {:ok, goal} =
      Operately.Goals.create_goal(ctx.champion, %{
        company_id: ctx.company.id,
        space_id: ctx.group.id,
        name: name,
        champion_id: ctx.champion.id,
        reviewer_id: ctx.reviewer.id,
        timeframe: Operately.ContextualDates.Timeframe.year_timeframe(~D[2021-01-01]),
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
        ],
        company_access_level: Binding.comment_access(),
        space_access_level: Binding.edit_access(),
        anonymous_access_level: Binding.view_access()
      })

    Map.put(ctx, :goal, goal)
  end

  def create_project(ctx, name: name) do
    company = company_fixture(%{name: "Test Org"})
    champion = person_fixture_with_account(%{company_id: company.id, full_name: "John Champion"})
    reviewer = person_fixture_with_account(%{company_id: company.id, full_name: "Leonardo Reviewer"})
    group = group_fixture(champion, %{company_id: company.id, name: "Test Group", company_permissions: Binding.view_access()})

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
      space_access_level: Binding.comment_access()
    }

    {:ok, project} = Operately.Projects.create_project(params)

    Map.merge(ctx, %{company: company, champion: champion, project: project, reviewer: reviewer, group: group})
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

  step :visit_project_page, ctx do
    ctx |> UI.visit(Paths.project_path(ctx.company, ctx.project))
  end

  step :choose_new_goal, ctx, goal_name: goal_name do
    ctx
    |> UI.click_text("Set parent goal")
    |> UI.click(testid: UI.testid(["parent-goal-field", goal_name]))
    |> UI.sleep(300)
  end

  step :change_champion, ctx, name: name do
    ctx
    |> UI.click(testid: "champion-field")
    |> UI.click(testid: "champion-field-assign-another")
    |> UI.click(testid: UI.testid(["champion-field-search-result", name]))
    |> UI.sleep(300)
  end

  step :remove_champion, ctx do
    ctx
    |> UI.click(testid: "champion-field")
    |> UI.click(testid: "champion-field-clear-assignment")
    |> UI.sleep(300)
  end

  step :assert_goal_connected, ctx, goal_name: goal_name do
    ctx
    |> UI.assert_text(goal_name, testid: "parent-goal-field")
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.assert_text(goal_name, testid: "parent-goal-field")
  end

  step :assert_goal_link_on_project_page, ctx, goal_name: goal_name do
    ctx
    |> UI.click(testid: "parent-goal-field")
    |> UI.click(testid: "parent-goal-field-view-goal")
    |> UI.assert_page(Paths.goal_path(ctx.company, ctx.goal))
    |> UI.assert_text(goal_name)
  end

  step :assert_goal_connected_email_sent_to_champion, ctx, goal_name: goal_name do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.reviewer,
      author: ctx.champion,
      action: "connected the project to the #{goal_name} goal"
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
    |> UI.click(testid: "parent-goal-field")
    |> UI.click(testid: "parent-goal-field-clear")
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
      action: "disconnected the project from the #{goal_name} goal"
    })
  end

  step :assert_goal_disconnected_notification_sent_to_reviewer, ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "disconnected the #{ctx.project.name} project from the Improve support first response time goal"
    })
  end

  step :given_a_space_exists, ctx, %{name: name} do
    new_space = group_fixture(ctx.champion, %{name: name, company_id: ctx.company.id})
    Map.put(ctx, :new_space, new_space)
  end

  step :move_project_to_new_space, ctx do
    ctx
    |> UI.click_text("Move to another space")
    |> UI.click(testid: "space-field")
    |> UI.click(testid: "space-field-search-result-new-space")
    |> UI.click_button("Move")
  end

  step :assert_project_moved_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.assert_project_moved_sent(author: ctx.champion, old_space: ctx.group, new_space: ctx.new_space)
  end

  step :assert_project_moved_feed_item_exists, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project, tab: "activity"))
    |> FeedSteps.assert_project_moved(author: ctx.champion, old_space: ctx.group, new_space: ctx.new_space)
  end

  #
  # Assertions
  #

  step :pause_project, ctx do
    ctx
    |> UI.click_text("Pause project")
    |> UI.assert_page(Paths.pause_project_path(ctx.company, ctx.project))
    |> UI.click_button("Pause project")
  end

  step :assert_project_paused, ctx do
    ctx
    |> UI.find(UI.query(testid: "paused-status-banner"), fn el ->
      UI.assert_text(el, "This project is paused")
    end)
  end

  step :assert_pause_notification_sent_to_reviewer, ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "paused the #{ctx.project.name} project"
    })
  end

  step :assert_pause_email_sent_to_reviewer, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.reviewer,
      action: "paused the project",
      author: ctx.champion
    })
  end

  step :assert_pause_visible_on_feed, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project, tab: "activity"))
    |> UI.find(UI.query(testid: "project-feed"), fn el ->
      el |> FeedSteps.assert_project_paused(author: ctx.champion)
    end)
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> UI.find(UI.query(testid: "space-feed"), fn el ->
      el |> FeedSteps.assert_project_paused(author: ctx.champion, project_name: ctx.project.name)
    end)
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.find(UI.query(testid: "company-feed"), fn el ->
      el |> FeedSteps.assert_project_paused(author: ctx.champion, project_name: ctx.project.name)
    end)
  end

  step :resume_project, ctx do
    ctx
    |> UI.click_text("Resume project")
    |> UI.assert_page(Paths.resume_project_path(ctx.company, ctx.project))
    |> UI.click_button("Resume project")
  end

  step :assert_project_active, ctx do
    ctx
    |> UI.assert_page(Paths.project_path(ctx.company, ctx.project))
    |> UI.refute_has(testid: "paused-status-banner")
  end

  step :assert_resume_notification_sent_to_reviewer, ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "resumed the #{ctx.project.name} project"
    })
  end

  step :assert_resume_email_sent_to_reviewer, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.reviewer,
      action: "resumed the project",
      author: ctx.champion
    })
  end

  step :assert_project_resumed_visible_on_feed, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project, tab: "activity"))
    |> FeedSteps.assert_project_resumed(author: ctx.champion)
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> FeedSteps.assert_project_resumed(author: ctx.champion, project_name: ctx.project.name)
    |> UI.visit(Paths.feed_path(ctx.company))
    |> FeedSteps.assert_project_resumed(author: ctx.champion, project_name: ctx.project.name)
  end

  step :rename_project, ctx, new_name: new_name do
    ctx
    |> UI.fill_text_field(testid: "project-name-field", with: new_name)
    |> UI.sleep(300)
  end

  step :assert_project_renamed, ctx, new_name: new_name do
    assert Operately.Projects.get_project!(ctx.project.id).name == new_name

    ctx |> UI.assert_text(new_name)
  end

  step :assert_project_renamed_visible_on_feed, ctx do
    project = Repo.reload(ctx.project)

    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project, tab: "activity"))
    |> FeedSteps.assert_project_renamed(author: ctx.champion)
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> FeedSteps.assert_project_renamed(author: ctx.champion, project_name: project.name)
    |> UI.visit(Paths.feed_path(ctx.company))
    |> FeedSteps.assert_project_renamed(author: ctx.champion, project_name: project.name)
  end

  step :assert_project_goal_connection_visible_on_feed, ctx, goal_name: goal_name do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project, tab: "activity"))
    |> FeedSteps.assert_project_goal_connection(author: ctx.champion, goal_name: goal_name)
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> FeedSteps.assert_project_goal_connection(author: ctx.champion, project_name: ctx.project.name, goal_name: goal_name)
    |> UI.visit(Paths.feed_path(ctx.company))
    |> FeedSteps.assert_project_goal_connection(author: ctx.champion, project_name: ctx.project.name, goal_name: goal_name)
    |> UI.visit(Paths.goal_path(ctx.company, ctx.goal, tab: "activity"))
    |> FeedSteps.assert_project_goal_connection(author: ctx.champion, project_name: ctx.project.name)
  end

  step :assert_project_description_absent, ctx do
    ctx
    |> UI.assert_text("Add a project description...")
  end

  step :submit_project_description, ctx, description: description do
    ctx
    |> UI.click_text("Add a project description...")
    |> UI.fill_rich_text(description)
    |> UI.click_button("Save")
  end

  step :expand_project_description, ctx do
    ctx
    |> UI.find(UI.query(testid: "description-section"), fn el ->
      UI.click_text(el, "Expand")
      |> UI.sleep(300)
    end)
  end

  step :assert_project_description_present, ctx, description: description do
    ctx |> UI.assert_text(description)
  end

  step :assert_champion_changed, ctx, name: name do
    ctx
    |> UI.assert_text(name, testid: "champion-field")
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.assert_text(name, testid: "champion-field")
  end

  step :assert_champion_changed_feed_posted, ctx, champion: champion do
    title = "assigned #{Person.short_name((champion))} as the champion"
    title_long = "assigned #{Person.short_name((champion))} as the champion on #{ctx.project.name}"

    assert_feed(ctx, title, title_long)
  end

  step :assert_champion_removed, ctx do
    ctx
    |> UI.assert_text("Set champion", testid: "champion-field")
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.assert_text("Set champion", testid: "champion-field")
  end

  step :assert_champion_removed_feed_posted, ctx do
    title = "removed the champion"
    title_long = "removed the champion on #{ctx.project.name}"

    assert_feed(ctx, title, title_long)
  end

  step :given_project_has_description, ctx, description: description do
    {:ok, _project} =
      Operately.Projects.update_project(ctx.project, %{
        description: Operately.Support.RichText.rich_text(description)
      })

    ctx
  end

  step :edit_project_description, ctx, description: description do
    ctx
    |> UI.find(UI.query(testid: "description-section"), fn el ->
      el
      |> UI.click_button("Edit")
      |> UI.fill_rich_text(description)
      |> UI.click_button("Save")
      |> UI.sleep(200)
    end)
  end

  step :add_link_as_key_resource, ctx do
    ctx
    |> UI.click_button("Add resource")
    |> UI.fill(label: "Title", with: "Code Repository")
    |> UI.fill(label: "URL", with: "https://github.com/operately/operately")
    |> UI.click_button("Save")
  end

  step :assert_new_key_resource_visible, ctx do
    ctx
    |> UI.assert_text("Code Repository")
  end

  step :assert_project_key_resource_added_visible_on_feed, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project, tab: "activity"))
    |> FeedSteps.assert_project_key_resource_added(author: ctx.champion)
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> FeedSteps.assert_project_key_resource_added(author: ctx.champion, project_name: ctx.project.name)
    |> UI.visit(Paths.feed_path(ctx.company))
    |> FeedSteps.assert_project_key_resource_added(author: ctx.champion, project_name: ctx.project.name)
  end

  step :assert_key_resource_added_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "added a key resource to the #{ctx.project.name} project"
    })
  end

  step :assert_key_resource_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.reviewer,
      action: "key resource added",
      author: ctx.champion
    })
  end

  step :delete_key_resource, ctx, name: name do
    ctx
    |> UI.click(testid: UI.testid(["edit", name]))
    |> UI.click_button("Delete")
    |> UI.find(UI.query(testid: "confirm-resource-deletion"), fn el ->
      UI.click_button(el, "Delete")
    end)
  end

  step :assert_key_resource_deleted, ctx, name: name do
    ctx
    |> UI.refute_text(name, attempts: [50, 100, 200, 500])
  end

  step :assert_project_key_resource_deleted_visible_on_feed, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project, tab: "activity"))
    |> FeedSteps.assert_project_key_resource_deleted(author: ctx.champion)
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> FeedSteps.assert_project_key_resource_deleted(author: ctx.champion, project_name: ctx.project.name)
    |> UI.visit(Paths.feed_path(ctx.company))
    |> FeedSteps.assert_project_key_resource_deleted(author: ctx.champion, project_name: ctx.project.name)
  end

  #
  # New page step definitions
  #

  step :setup, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:product)
    |> Factory.add_space_member(:champion, :product)
    |> Factory.add_space_member(:reviewer, :product)
    |> Factory.add_goal(:parent_goal, :product)
    |> Factory.add_project(:project, :product, name: "Project alpha")
    |> Factory.log_in_person(:creator)
    |> then(fn ctx ->
      UI.visit(ctx, Paths.project_path(ctx.company, ctx.project))
    end)
  end

  #
  # Changing the goal name
  #

  step :change_project_name, ctx do
    ctx
    |> UI.fill_text_field(testid: "project-name-field", with: "New Project Name")
  end

  step :assert_project_name_changed, ctx do
    attempts(ctx, 3, fn ->
      project = Operately.Repo.reload(ctx.project)
      assert project.name == "New Project Name"
    end)
  end

  step :assert_project_name_changed_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.creator, "renamed")
  end

  #
  # Changing the reviewer
  #

  step :given_project_with_reviewer_exists, ctx do
    ctx
    |> Factory.add_space_member(:curr_reviewer, :product)
    |> Factory.add_project(:project, :product, name: "Project alpha", reviewer: :curr_reviewer)
  end

  step :change_reviewer, ctx, name: name do
    ctx
    |> UI.click(testid: "reviewer-field")
    |> UI.click(testid: "reviewer-field-assign-another")
    |> UI.click(testid: UI.testid(["reviewer-field-search-result", name]))
    |> UI.sleep(300)
  end

  step :remove_reviewer, ctx do
    ctx
    |> UI.click(testid: "reviewer-field")
    |> UI.click(testid: "reviewer-field-clear-assignment")
    |> UI.sleep(300)
  end

  step :assert_reviewer_changed, ctx, name: name do
    ctx
    |> UI.assert_text(name, testid: "reviewer-field")
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.assert_text(name, testid: "reviewer-field")
  end

  step :assert_reviewer_removed, ctx do
    ctx
    |> UI.assert_text("Set reviewer", testid: "reviewer-field")
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.assert_text("Set reviewer", testid: "reviewer-field")
  end

  step :assert_reviewer_changed_feed_posted, ctx, reviewer: reviewer do
    title = "assigned #{Person.short_name(reviewer)} as the reviewer"
    title_long = "assigned #{Person.short_name(reviewer)} as the reviewer on #{ctx.project.name}"

    assert_feed(ctx, title, title_long)
  end

  step :assert_reviewer_removed_feed_posted, ctx do
    title = "removed the reviewer"
    title_long = "removed the reviewer on #{ctx.project.name}"

    assert_feed(ctx, title, title_long)
  end

  defp assert_feed(ctx, title, long_tile) do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project, tab: "activity"))
    |> UI.find(UI.query(testid: "project-feed"), fn el ->
      FeedSteps.assert_feed_item_exists(el, %{author: ctx.creator, title: title})
    end)
    |> UI.visit(Paths.space_path(ctx.company, ctx.product))
    |> UI.find(UI.query(testid: "space-feed"), fn el ->
      FeedSteps.assert_feed_item_exists(el, %{author: ctx.creator, title: long_tile})
    end)
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.find(UI.query(testid: "company-feed"), fn el ->
      FeedSteps.assert_feed_item_exists(el, %{author: ctx.creator, title: long_tile})
    end)
  end

  step :download_project_markdown, ctx do
    conn = build_api_conn(ctx.champion, ctx.company)

    markdown =
      conn
      |> get(Paths.export_project_markdown_path(ctx.company, ctx.project))
      |> response(200)

    Map.put(ctx, :project_markdown, markdown)
  end

  step :assert_project_markdown_includes_details, ctx do
    markdown = ctx.project_markdown

    assert is_binary(markdown)
    assert String.contains?(markdown, "# #{ctx.project.name}")
    assert String.contains?(markdown, "Status:")

    ctx
  end
end
