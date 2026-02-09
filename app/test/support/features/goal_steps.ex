defmodule Operately.Support.Features.GoalSteps do
  use Operately.FeatureCase
  @endpoint OperatelyWeb.Endpoint

  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Support.Features.EmailSteps
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.ContextualDates.ContextualDate
  alias OperatelyWeb.Paths
  alias Operately.People.Person
  alias Wallaby.QueryError

  import Phoenix.ConnTest

  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_company_member(:view_access_member)
    |> Factory.add_space(:product)
    |> Factory.add_space_member(:champion, :product)
    |> Factory.add_space_member(:reviewer, :product)
    |> Factory.add_space_member(:edit_access_member, :product)
    |> Factory.add_goal(:parent_goal, :product)
    |> Factory.add_goal(:goal, :product,
      name: "Improve support first response time",
      champion: :champion,
      reviewer: :reviewer,
      timeframe: %{
        contextual_start_date: Operately.Time.days_ago(10) |> ContextualDate.create_day_date(),
        contextual_end_date: Operately.Time.days_from_now(10) |> ContextualDate.create_day_date()
      },
      parent_goal: :parent_goal,
      space_access: Binding.edit_access()
    )
  end

  defp build_api_conn(person, company) do
    person = Operately.Repo.preload(person, :account)
    account = person.account

    Phoenix.ConnTest.build_conn()
    |> Plug.Test.init_test_session(%{})
    |> OperatelyWeb.ConnCase.log_in_account(account, company)
  end

  step :visit_goal, ctx do
    UI.visit(ctx, Paths.goal_path(ctx.company, ctx.goal))
  end

  step :assert_logged_in_member_has_view_access, ctx do
    {:ok, goal} = Operately.Goals.Goal.get(ctx.view_access_member, id: ctx.goal.id)

    assert goal.request_info.access_level == Binding.view_access()

    UI.login_as(ctx, ctx.view_access_member)
  end

  step :assert_logged_in_member_has_edit_access, ctx do
    {:ok, goal} = Operately.Goals.Goal.get(ctx.edit_access_member, id: ctx.goal.id)

    assert goal.request_info.access_level == Binding.edit_access()

    UI.login_as(ctx, ctx.edit_access_member)
  end

  step :assert_logged_in_member_has_full_access, ctx do
    {:ok, goal} = Operately.Goals.Goal.get(ctx.champion, id: ctx.goal.id)

    assert goal.request_info.access_level == Binding.full_access()

    UI.login_as(ctx, ctx.champion)
  end

  #
  # Changing the goal name
  #

  step :change_goal_name, ctx do
    ctx
    |> UI.fill_text_field(testid: "goal-name-field", with: "New Goal Name", submit: true)
  end

  step :given_space_member_exists, ctx, opts \\ [] do
    ctx
    |> Factory.add_space_member(:space_member, :product, opts)
  end

  step :given_goal_in_secret_space_for_reviewer, ctx do
    ctx
    |> Factory.add_space(:space, company_permissions: Binding.no_access())
    |> Factory.add_goal(:goal, :space,
      name: "Hidden goal",
      champion: :champion,
      reviewer: :reviewer
    )
  end

  step :login_as_reviewer, ctx do
    UI.login_as(ctx, ctx.reviewer)
  end

  step :assert_goal_navigation_without_space, ctx do
    home_link = Paths.work_map_path(ctx.company, tab: "goals")
    space = Map.get(ctx, :space, ctx.product)
    space_link = Paths.space_path(ctx.company, space)
    workmap_link = Paths.space_work_map_path(ctx.company, space) <> "?tab=goals"

    ctx
    |> UI.assert_has(css: "[data-test-id=\"goal-page\"] nav a[href=\"#{home_link}\"]")
    |> UI.refute_has(css: "[data-test-id=\"goal-page\"] nav a[href=\"#{space_link}\"]")
    |> UI.refute_has(css: "[data-test-id=\"goal-page\"] nav a[href=\"#{workmap_link}\"]")
  end

  step :assert_move_to_another_space_is_hidden, ctx do
    ctx |> UI.refute_has(testid: "move-to-another-space")
  end

  step :given_goal_with_hidden_parent_goal, ctx do
    ctx
    |> Factory.add_company_member(:company_member)
    |> Factory.add_space(:space)
    |> Factory.add_goal(:hidden_parent_goal, :space, name: "Hidden Parent Goal", company_access: Binding.no_access(), space_access: Binding.no_access())
    |> Factory.add_goal(:goal, :space, name: "Child goal", champion: :company_member, parent_goal: :hidden_parent_goal)
  end

  step :assert_company_member_cant_see_parent_goal, ctx do
    assert {:error, :not_found} = Operately.Goals.Goal.get(ctx.company_member, id: ctx.hidden_parent_goal.id)

    ctx
  end

  step :login_as_company_member, ctx do
    UI.login_as(ctx, ctx.company_member)
  end

  step :assert_goal_has_parent_goal, ctx do
    goal = Operately.Repo.reload(ctx.goal)

    assert goal.parent_goal_id == ctx.hidden_parent_goal.id

    ctx
  end

  step :assert_parent_goal_field_not_rendered, ctx do
    ctx |> UI.refute_has(testid: "parent-goal-field")
  end

  step :assert_goal_page_loaded, ctx do
    ctx
    |> UI.sleep(300)
    |> UI.assert_has(testid: "goal-page")
  end

  step :given_goal_with_hidden_related_work_items, ctx do
    ctx
    |> Factory.add_company_member(:company_member)
    |> Factory.add_goal(:visible_child_goal, :product, parent_goal: :goal, name: "Visible Child Goal")
    |> Factory.add_project(:visible_child_project, :product, goal: :goal, name: "Visible Child Project")
    |> Factory.add_goal(:hidden_child_goal, :product,
      parent_goal: :goal,
      name: "Hidden Child Goal",
      company_access: Binding.no_access(),
      space_access: Binding.no_access()
    )
    |> Factory.add_project(:hidden_child_project, :product,
      goal: :goal,
      name: "Hidden Child Project",
      company_access_level: Binding.no_access(),
      space_access_level: Binding.no_access()
    )
  end

  step :assert_related_work_items_visible, ctx do
    ctx
    |> UI.assert_text(ctx.visible_child_goal.name)
    |> UI.assert_text(ctx.visible_child_project.name)
  end

  step :refute_hidden_related_work_items, ctx do
    ctx
    |> UI.refute_text(ctx.hidden_child_goal.name)
    |> UI.refute_text(ctx.hidden_child_project.name)
  end

  step :given_goal_with_nested_related_work_access, ctx do
    ctx
    |> Factory.add_company_member(:company_member)
    |> Factory.add_goal(:child_goal, :product, parent_goal: :goal, name: "Accessible Child Goal")
    |> Factory.add_goal(:grandchild_goal, :product,
      parent_goal: :child_goal,
      name: "Hidden Grandchild Goal",
      company_access: Binding.no_access(),
      space_access: Binding.no_access()
    )
    |> Factory.add_project(:grandchild_project, :product,
      goal: :child_goal,
      name: "Visible Grandchild Project",
      company_access_level: Binding.view_access(),
      space_access_level: Binding.view_access()
    )
  end

  step :assert_nested_related_work_items_visible, ctx do
    ctx
    |> UI.assert_text(ctx.child_goal.name)
    |> UI.assert_text(ctx.grandchild_project.name)
  end

  step :refute_nested_related_work_items_hidden, ctx do
    ctx
    |> UI.refute_text(ctx.grandchild_goal.name)
  end

  #
  # Description
  #

  step :edit_goal_description, ctx, description do
    ctx
    |> open_goal_description_editor()
    |> UI.fill_rich_text(description)
    |> submit_goal_description()
  end

  step :edit_goal_description_mentioning, ctx, person do
    ctx
    |> open_goal_description_editor()
    |> UI.mention_person_in_rich_text(person)
    |> submit_goal_description()
  end

  step :assert_goal_description, ctx, description do
    ctx
    |> UI.assert_text(description)
  end

  step :refute_goal_description, ctx, description do
    ctx
    |> UI.refute_text(description)
  end

  step :assert_goal_description_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.creator, "updated goal #{ctx.goal.name} description")
  end

  step :assert_space_member_goal_description_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.goal.name,
      to: ctx.space_member,
      author: ctx.edit_access_member,
      action: "updated the goal description"
    })
  end

  step :assert_space_member_goal_description_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.space_member)
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.edit_access_member,
      action: "Goal \"#{ctx.goal.name}\" description was updated"
    })
  end

  step :assert_goal_name_changed, ctx do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.reload(ctx.goal)
      assert goal.name == "New Goal Name"
    end)
  end

  step :assert_goal_name_changed_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.creator, "renamed")
  end

  #
  # Changing the parent goal
  #

  step :change_parent_goal, ctx do
    ctx
    |> Factory.add_goal(:new_parent, :product, name: "Example Goal")
    |> UI.click(testid: "parent-goal-field")
    |> UI.click(testid: "parent-goal-field-search")
    |> UI.click(testid: "parent-goal-field-example-goal")
  end

  step :assert_parent_goal_changed, ctx do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.reload(ctx.goal)
      assert goal.parent_goal_id == ctx.new_parent.id
    end)
  end

  step :assert_parent_goal_changed_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.creator, "changed the parent goal")
  end

  step :assert_parent_goal_changed_toast, ctx do
    ctx
    |> UI.assert_text("Parent Goal Updated")
    |> UI.assert_text("The parent goal has been successfully changed.")
  end

  #
  # Removing the parent goal
  #

  step :remove_parent_goal, ctx do
    ctx
    |> UI.click(testid: "parent-goal-field")
    |> UI.click(testid: "parent-goal-field-clear")
  end

  step :assert_parent_goal_removed, ctx do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.reload(ctx.goal)
      assert goal.parent_goal_id == nil
    end)
  end

  step :assert_parent_goal_removed_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.creator, "Removed the parent goal")
  end

  #
  # Changing the champion
  #

  step :change_champion, ctx do
    ctx
    |> Factory.add_space_member(:new_champion, :product, name: "Alfred Newfield")
    |> UI.click(testid: "champion-field")
    |> UI.click(testid: "champion-field-assign-another")
    |> UI.click(testid: "champion-field-search-result-alfred-newfield")
  end

  step :assert_champion_changed, ctx do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.reload(ctx.goal)
      assert goal.champion_id == ctx.new_champion.id
    end)
  end

  step :assert_champion_changed_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.creator, "assigned Alfred N. as the champion")
  end

  step :assert_champion_changed_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.goal.name,
      to: ctx.new_champion,
      author: ctx.champion,
      action: "assigned you as the champion"
    })
  end

  step :assert_champion_changed_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.new_champion)
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "#{Person.first_name(ctx.champion)} assigned you as the champion"
    })
  end

  #
  # Removing the champion
  #

  step :remove_champion, ctx do
    ctx
    |> UI.click(testid: "champion-field")
    |> UI.click(testid: "champion-field-clear-assignment")
  end

  step :assert_champion_removed, ctx do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.reload(ctx.goal)
      assert goal.champion_id == nil
    end)
  end

  step :assert_champion_removed_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.creator, "removed the champion")
  end

  #
  # Changing the reviewer
  #

  step :change_reviewer, ctx do
    ctx
    |> Factory.add_space_member(:new_reviewer, :product, name: "Alfred Newfield")
    |> UI.click(testid: "reviewer-field")
    |> UI.click(testid: "reviewer-field-assign-another")
    |> UI.click(testid: "reviewer-field-search-result-alfred-newfield")
  end

  step :assert_reviewer_changed, ctx do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.reload(ctx.goal)
      assert goal.reviewer_id == ctx.new_reviewer.id
    end)
  end

  step :assert_reviewer_changed_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.creator, "assigned Alfred N. as the reviewer")
  end

  step :assert_reviewer_changed_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.goal.name,
      to: ctx.new_reviewer,
      author: ctx.champion,
      action: "assigned you as the reviewer"
    })
  end

  step :assert_reviewer_changed_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.new_reviewer)
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "#{Person.first_name(ctx.champion)} assigned you as the reviewer"
    })
  end

  #
  # Removing the reviewer
  #

  step :remove_reviewer, ctx do
    ctx
    |> UI.click(testid: "reviewer-field")
    |> UI.click(testid: "reviewer-field-clear-assignment")
  end

  step :assert_reviewer_removed, ctx do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.reload(ctx.goal)
      assert goal.reviewer_id == nil
    end)
  end

  step :assert_reviewer_removed_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.creator, "removed the reviewer")
  end

  #
  # Changing the due date
  #

  step :change_due_date, ctx do
    new_date = Operately.Time.days_from_now(3) |> Operately.Time.as_date()

    ctx
    |> Map.put(:selected_date, new_date)
    |> UI.select_date(testid: "due-date-field", date: new_date)
  end

  step :assert_due_date_changed, ctx do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.reload(ctx.goal)
      assert goal.timeframe.end_date == ctx.selected_date
    end)
  end

  step :assert_due_date_changed_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.creator, "changed the due date")
  end

  #
  # Removing the due date
  #

  step :remove_due_date, ctx do
    ctx
    |> UI.click(testid: "due-date-field")
    |> UI.click(testid: "due-date-field-clear")
  end

  step :assert_due_date_removed, ctx do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.reload(ctx.goal)
      assert goal.timeframe == nil
    end)
  end

  step :assert_due_date_removed_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.creator, "cleared the due date")
  end

  #
  # Moving the goal to another space
  #

  step :move_goal_to_another_space, ctx do
    ctx
    |> UI.click(testid: "move-to-another-space")
    |> UI.click(testid: "space-field")
    |> UI.click(testid: "space-field-search-result-general")
    |> UI.click(testid: "save")
  end

  step :assert_goal_moved_to_another_space, ctx do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.reload(ctx.goal)
      space = Operately.Repo.preload(goal, [:group]).group

      assert space.name == "General"
    end)
  end

  step :assert_goal_moved_to_another_space_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.creator, "moved the #{ctx.goal.name} goal to General")
  end

  #
  # Adding a new target
  #

  step :add_first_target, ctx do
    remove_all_targets(ctx)

    ctx
    |> UI.visit(Paths.goal_path(ctx.company, ctx.goal))
    |> UI.click(testid: "add-target")
    |> UI.fill(testid: "target-name", with: "Incoming Requests")
    |> UI.fill(testid: "target-from", with: "0")
    |> UI.fill(testid: "target-to", with: "100")
    |> UI.fill(testid: "target-unit", with: "Requests")
    |> UI.click(testid: "save")
  end

  step :add_new_target, ctx do
    ctx
    |> UI.click(testid: "add-target")
    |> UI.fill(testid: "target-name", with: "Incoming Requests")
    |> UI.fill(testid: "target-from", with: "0")
    |> UI.fill(testid: "target-to", with: "100")
    |> UI.fill(testid: "target-unit", with: "Requests")
    |> UI.click(testid: "save")
  end

  step :assert_target_added, ctx do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.reload(ctx.goal)
      targets = Operately.Repo.preload(goal, [:targets]).targets

      target = Enum.find(targets, fn t -> t.name == "Incoming Requests" end)

      assert target != nil
      assert target.from == 0
      assert target.to == 100
      assert target.unit == "Requests"
    end)
  end

  step :assert_target_added_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.creator, "added the Incoming Requests target")
  end

  #
  # Deleting a target
  #

  step :delete_target, ctx do
    target = Operately.Repo.preload(ctx.goal, [:targets]).targets |> List.first()

    ctx
    |> Map.put(:target, target)
    |> UI.click(testid: UI.testid(["target", target.name]))
    |> UI.click(testid: "delete-target")
    |> UI.click(testid: "confirm")
  end

  step :assert_target_deleted, ctx do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.reload(ctx.goal)
      targets = Operately.Repo.preload(goal, [:targets]).targets

      refute Enum.any?(targets, fn t -> t.name == ctx.target.name end)
    end)
  end

  step :assert_target_deleted_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.creator, "deleted the #{ctx.target.name} target")
  end

  #
  # Updating a target value
  #

  step :update_target_value, ctx do
    target = Operately.Repo.preload(ctx.goal, [:targets]).targets |> List.first()

    ctx
    |> Map.put(:target, target)
    |> UI.click(testid: UI.testid(["update-target", target.name]))
    |> UI.fill(testid: "target-value", with: "200")
    |> UI.click(testid: "save")
  end

  step :assert_target_value_updated, ctx do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.reload(ctx.goal)
      targets = Operately.Repo.preload(goal, [:targets]).targets

      target = Enum.find(targets, fn t -> t.id == ctx.target.id end)

      assert target != nil
      assert target.value == 200
    end)
  end

  step :assert_target_value_updated_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.creator, "updated the value for the #{ctx.target.name} target")
  end

  #
  # Deleting a goal
  #

  step :delete_goal, ctx do
    ctx
    |> UI.click(testid: "delete-goal-button")
    |> UI.click(testid: "delete")
  end

  step :assert_goal_deleted, ctx do
    attempts(ctx, 3, fn ->
      assert Operately.Repo.reload(ctx.goal) == nil
    end)
  end

  #
  # Goal with subgoals cannot be deleted
  #

  step :given_goal_has_subgoals, ctx do
    ctx
    |> Factory.add_goal(:subgoal, :product, parent_goal: :goal)
  end

  step :visit_page, ctx do
    UI.visit(ctx, Paths.goal_path(ctx.company, ctx.goal))
  end

  step :assert_goal_cannot_be_deleted, ctx do
    ctx
    |> UI.click(testid: "delete-goal-button")
    |> UI.assert_text("Cannot delete")
  end

  #
  # Changing the access level
  #

  step :change_access_level, ctx do
    ctx
    |> UI.click(testid: "goal-privacy-field")
    |> UI.select(testid: "goal-privacy-field-company-select", option: "No Access")
    |> UI.click(testid: "save")
  end

  step :assert_access_level_changed, ctx do
    attempts(ctx, 3, fn ->
      context = Access.get_context(goal_id: ctx.goal.id)
      company_members = Access.get_group!(company_id: ctx.goal.company_id, tag: :standard)
      company_binding = Access.get_binding(context_id: context.id, group_id: company_members.id)

      assert company_binding.access_level == 0
    end)
  end

  defp open_goal_description_editor(ctx) do
    try do
      ctx
      |> UI.click_text("Describe the goal to provide context and clarity.")
    rescue
      QueryError ->
        ctx
        |> UI.click_button("Edit")
    end
  end

  defp submit_goal_description(ctx) do
    ctx
    |> UI.click_button("Save")
    |> UI.sleep(300)
  end

  defp remove_all_targets(ctx) do
    Operately.Repo.preload(ctx.goal, [:targets]).targets
    |> Enum.each(fn target ->
      Operately.Repo.delete(target)
    end)
  end

  step :download_goal_markdown, ctx do
    conn = build_api_conn(ctx.champion, ctx.company)

    markdown =
      conn
      |> get(Paths.export_goal_markdown_path(ctx.company, ctx.goal))
      |> response(200)

    Map.put(ctx, :goal_markdown, markdown)
  end

  step :assert_goal_markdown_includes_details, ctx do
    markdown = ctx.goal_markdown

    assert is_binary(markdown)
    assert String.contains?(markdown, "# #{ctx.goal.name}")
    assert String.contains?(markdown, "Status:")

    ctx
  end

  #
  # Access management
  #

  step :setup_goal_with_comment_access_and_outside_collaborator, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_company_owner(:owner)
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space, name: "Test Goal", company_access: Binding.comment_access(), space_access: Binding.comment_access())
    |> Factory.add_outside_collaborator(:collaborator, :owner)
    |> Factory.log_in_person(:creator)
  end

  step :setup_goal_with_comment_access_and_space_member, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:member, :space)
    |> Factory.add_goal(:goal, :space, name: "Test Goal", company_access: Binding.comment_access(), space_access: Binding.comment_access())
    |> Factory.log_in_person(:creator)
  end

  step :login_as_outside_collaborator, ctx do
    ctx |> UI.login_as(ctx.collaborator)
  end

  step :login_as_space_member, ctx do
    ctx |> UI.login_as(ctx.member)
  end

  step :login_as_admin, ctx do
    ctx |> UI.login_as(ctx.creator)
  end

  step :visit_goal_page_as_collaborator, ctx do
    ctx |> UI.visit(Paths.goal_path(ctx.company, ctx.goal))
  end

  step :visit_goal_discussions_page_as_member, ctx do
    ctx
    |> UI.visit(Paths.goal_path(ctx.company, ctx.goal, tab: "discussions"))
  end

  step :assert_goal_page_not_found, ctx do
    ctx |> UI.assert_text("Page Not Found")
  end

  step :visit_goal_access_management_page, ctx do
    ctx
    |> UI.visit(Paths.goal_path(ctx.company, ctx.goal))
    |> UI.click(testid: "manage-goal-access-button")
    |> UI.assert_has(testid: "goal-access-management-page")
  end

  step :give_collaborator_view_access, ctx do
    ctx
    |> UI.click(testid: "add-goal-access")
    |> UI.assert_has(testid: "goal-access-add-page")
    |> UI.select_person_in(testid: "members-0-personid", name: ctx.collaborator.full_name)
    |> UI.select(testid: "members-0-accesslevel", option: "View Access")
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "goal-access-management-page")
  end

  step :give_member_edit_access, ctx do
    ctx
    |> UI.click(testid: "add-goal-access")
    |> UI.assert_has(testid: "goal-access-add-page")
    |> UI.select_person_in(testid: "members-0-personid", name: ctx.member.full_name)
    |> UI.click(testid: "members-0-accesslevel")
    |> UI.send_keys(["Edit", :enter])
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "goal-access-management-page")
  end

  step :assert_start_discussion_button_not_visible, ctx do
    ctx |> UI.refute_has(testid: "start-discussion")
  end

  step :assert_start_discussion_button_visible, ctx do
    ctx |> UI.assert_has(testid: "start-discussion")
  end

  step :click_start_discussion_button, ctx do
    ctx |> UI.click(testid: "start-discussion")
  end

  step :assert_add_discussion_page_loaded, ctx do
    ctx |> UI.assert_page(Paths.new_goal_discussion_path(ctx.company, ctx.goal))
  end

  step :remove_collaborator_access, ctx do
    ctx
    |> UI.click(testid: UI.testid(["goal-access-menu", ctx.collaborator.full_name]))
    |> UI.click(testid: "remove-goal-access")
    |> UI.sleep(500)
  end

  step :assert_collaborator_has_no_access, ctx do
    {:error, :not_found} = Operately.Goals.Goal.get(ctx.collaborator, id: ctx.goal.id)

    ctx
  end

  #
  # Permission-based visibility tests
  #

  step :given_user_has_full_access, ctx do
    ctx
    |> Factory.add_space_member(:person, :product)
    |> Factory.add_goal(:goal, :product, champion: :person)
    |> Factory.log_in_person(:person)
  end

  step :given_user_has_edit_access, ctx do
    ctx
    |> Factory.add_space_member(:person, :product)
    |> Factory.add_goal(:goal, :product, space_access: Binding.edit_access())
    |> Factory.add_project(:child_project, :product, goal: :goal)
    |> Factory.log_in_person(:person)
  end

  step :given_user_has_comment_access, ctx do
    ctx
    |> Factory.add_company_member(:person)
    |> Factory.add_goal(:goal, :product, company_access: Binding.comment_access())
    |> Factory.log_in_person(:person)
  end

  step :assert_user_has_full_access, ctx do
    {:ok, goal} = Operately.Goals.Goal.get(ctx.person, id: ctx.goal.id)

    assert goal.request_info.access_level == Binding.full_access()

    ctx
  end

  step :assert_user_has_edit_access, ctx do
    {:ok, goal} = Operately.Goals.Goal.get(ctx.person, id: ctx.goal.id)

    assert goal.request_info.access_level == Binding.edit_access()

    ctx
  end

  step :assert_user_has_comment_access, ctx do
    {:ok, goal} = Operately.Goals.Goal.get(ctx.person, id: ctx.goal.id)

    assert goal.request_info.access_level == Binding.comment_access()

    ctx
  end

  step :assert_parent_goal_editable, ctx do
    ctx
    |> UI.click_text("Set parent goal")
    |> UI.assert_has(testid: UI.testid(["parent-goal-field", ctx.parent_goal.name]))
  end

  step :refute_parent_goal_editable, ctx do
    ctx
    |> UI.refute_text("Set parent goal")
  end

  step :assert_start_date_editable, ctx do
    ctx |> UI.assert_has(testid: "start-date-field")
  end

  step :refute_start_date_editable, ctx do
    ctx
    |> UI.assert_has(testid: "start-date-field-readonly")
    |> UI.refute_has(testid: "start-date-field")
  end

  step :assert_champion_editable, ctx do
    ctx
    |> UI.click(testid: "champion-field")
    |> UI.assert_has(testid: "champion-field-view-profile")
    |> UI.assert_has(testid: "champion-field-assign-another")
  end

  step :refute_champion_editable, ctx do
    ctx
    |> UI.assert_has(testid: "champion-field-readonly")
    |> UI.refute_has(testid: "champion-field")
  end

  step :assert_manage_access_button_visible, ctx do
    ctx |> UI.assert_has(testid: "manage-goal-access-button")
  end

  step :refute_manage_access_button_visible, ctx do
    ctx |> UI.refute_has(testid: "manage-goal-access-button")
  end

  step :assert_close_goal_button_visible, ctx do
    ctx |> UI.assert_has(testid: "close-goal-button")
  end

  step :refute_close_goal_button_visible, ctx do
    ctx |> UI.refute_has(testid: "close-goal-button")
  end

  step :assert_delete_goal_button_visible, ctx do
    ctx |> UI.assert_has(testid: "delete-goal-button")
  end

  step :refute_delete_goal_button_visible, ctx do
    ctx |> UI.refute_has(testid: "delete-goal-button")
  end

  step :assert_add_subgoal_button_visible, ctx do
    ctx |> UI.assert_has(testid: "add-subgoal")
  end

  step :refute_add_subgoal_button_visible, ctx do
    ctx |> UI.refute_has(testid: "add-subgoal")
  end

  step :assert_check_in_button_visible, ctx do
    ctx
    |> UI.assert_has(testid: "sidebar-check-in-button")
    |> UI.click(testid: "tab-check-ins")
    |> UI.assert_has(testid: "check-in-button")
  end

  step :refute_check_in_button_visible, ctx do
    ctx
    |> UI.refute_has(testid: "sidebar-check-in-button")
    |> UI.click(testid: "tab-check-ins")
    |> UI.refute_has(testid: "check-in-button")
  end

  step :assert_discussion_button_visible, ctx do
    ctx
    |> UI.click(testid: "tab-discussions")
    |> UI.assert_has(testid: "start-discussion")
  end

  step :refute_discussion_button_visible, ctx do
    ctx
    |> UI.click(testid: "tab-discussions")
    |> UI.refute_has(testid: "start-discussion")
  end

  step :assert_add_checklist_button_visible, ctx do
    ctx
    |> UI.click(testid: "tab-overview")
    |> UI.assert_has(testid: "add-checklist-item")
  end

  step :refute_add_checklist_button_visible, ctx do
    ctx
    |> UI.click(testid: "tab-overview")
    |> UI.refute_has(testid: "add-checklist-item")
  end
end
