defmodule Operately.Support.Features.WorkMapSteps do
  use Operately.FeatureCase
  alias Operately.Access.Binding

  step :setup_company_work_map, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space1, name: "Space 1")
    |> Factory.add_space(:space2, name: "Space 2")
    |> Factory.add_goal(:company_goal1, :space1, name: "Company Goal 1")
    |> Factory.add_goal(:company_goal2, :space1, name: "Company Goal 2")
    |> Factory.add_project(:company_root_project1, :space1, name: "Company Root Project 1")
    |> Factory.add_project(:company_root_project2, :space2, name: "Company Root Project 2")
    |> Factory.add_project(:company_child_project1, :space1, goal: :company_goal1, name: "Company Child Project 1")
    |> Factory.add_project(:company_child_project2, :space1, goal: :company_goal2, name: "Company Child Project 2")
    |> Factory.log_in_person(:creator)
  end

  step :setup_space_work_map, ctx do
    ctx
    |> Factory.add_space(:space)
    |> Factory.add_goal(:space_ongoing_goal, :space, name: "Space Ongoing Goal")
    |> Factory.add_goal(:space_closed_goal, :space, name: "Space Closed Goal")
    |> Factory.close_goal(:space_closed_goal)
    |> Factory.add_project(:space_closed_project, :space, name: "Space Closed Project")
    |> Factory.close_project(:space_closed_project)
    |> Factory.add_project(:space_paused_project, :space, name: "Space Paused Project")
    |> Factory.pause_project(:space_paused_project)
    |> Factory.add_project(:space_ongoing_project, :space, name: "Space Ongoing Project")
    |> Factory.log_in_person(:creator)
  end

  step :setup_empty_space_work_map, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space, name: "Space", company_permissions: Binding.view_access())
    |> Factory.log_in_person(:creator)
  end

  step :setup_empty_private_space_work_map, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space, name: "Private Space", company_permissions: Binding.no_access())
    |> Factory.log_in_person(:creator)
  end

  step :setup_spaces, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:edit_space, name: "Editable Space", company_permissions: Binding.edit_access())
    |> Factory.add_space(:view_space, name: "Visible Space", company_permissions: Binding.view_access())
    |> Factory.add_space(:hidden_space, name: "Hidden Space", company_permissions: Binding.no_access())
    |> Factory.add_company_member(:member)
    |> Factory.log_in_person(:member)
  end

  step :given_there_are_items_in_spaces, ctx do
    ctx
    |> Factory.add_goal(:goal, :view_space, name: "Visible Space Goal")
    |> Factory.add_project(:project, :edit_space, name: "Editable Space Project")
  end

  step :given_company_projects_are_paused, ctx do
    ctx
    |> Factory.pause_project(:company_root_project1)
    |> Factory.pause_project(:company_child_project1)
  end

  step :given_company_projects_are_completed, ctx do
    ctx
    |> Factory.close_project(:company_root_project1)
    |> Factory.close_project(:company_child_project1)
  end

  step :given_company_goal_is_completed, ctx do
    Factory.close_goal(ctx, :company_goal1)
  end

  step :given_project_exists, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space, name: "Marketing")
    |> Factory.add_project(:project, :space, champion: :creator, name: "Project")
    |> Factory.log_in_person(:creator)
  end

  step :given_project_with_milestones_exist, ctx do
    today = Date.utc_today()
    first_deadline = NaiveDateTime.new!(today, ~T[10:00:00]) |> NaiveDateTime.add(2 * 24 * 60 * 60)
    second_deadline = NaiveDateTime.new!(today, ~T[10:00:00]) |> NaiveDateTime.add(4 * 24 * 60 * 60)

    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space, name: "Project")
    |> Factory.add_project_milestone(:milestone1, :project, title: "First Milestone")
    |> Factory.set_project_milestone_deadline(:milestone1, first_deadline)
    |> Factory.add_project_milestone(:milestone2, :project, title: "Second Milestone")
    |> Factory.set_project_milestone_deadline(:milestone2, second_deadline)
    |> Factory.log_in_person(:creator)
  end

  step :given_goal_with_targets_exist, ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space, name: "Goal")
      |> Factory.log_in_person(:creator)

    [target1, target2] = Operately.Goals.list_targets(ctx.goal.id) |> Enum.sort_by(& &1.index)

    ctx
    |> Map.put(:target1, target1)
    |> Map.put(:target2, target2)
  end

  step :given_project_with_future_start_date_exists, ctx do
    future_start_date = Date.add(Date.utc_today(), 7)
    overdue_check_in = Date.utc_today() |> Date.add(-10) |> Operately.Time.as_datetime()

    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:future_project, :space,
      name: "Future Project",
      timeframe: %{
        contextual_start_date: Operately.ContextualDates.ContextualDate.create_day_date(future_start_date),
        contextual_end_date: Operately.ContextualDates.ContextualDate.create_day_date(Date.add(Date.utc_today(), 30))
      }
    )
    |> Factory.set_project_next_check_in_date(:future_project, overdue_check_in)
    |> Factory.log_in_person(:creator)
  end

  step :visit_company_work_map, ctx do
    UI.visit(ctx, Paths.work_map_path(ctx.company))
  end

  step :visit_space_work_map, ctx, space_name do
    UI.visit(ctx, Paths.space_work_map_path(ctx.company, ctx[space_name]))
  end

  step :open_zero_state_add_goal, ctx do
    UI.click(ctx, testid: "add-goal")
  end

  step :open_zero_state_add_project, ctx do
    UI.click(ctx, testid: "add-project")
  end

  step :open_quick_add_privacy_settings, ctx do
    UI.click(ctx, testid: "privacy-field")
  end

  step :go_to_goals_tab, ctx do
    UI.click(ctx, testid: "tab-goals")
  end

  step :go_to_projects_tab, ctx do
    UI.click(ctx, testid: "tab-projects")
  end

  step :go_to_paused_tab, ctx do
    UI.click(ctx, testid: "tab-paused")
  end

  step :go_to_completed_tab, ctx do
    UI.click(ctx, testid: "tab-completed")
  end

  step :go_to_all_tab, ctx do
    UI.click_text(ctx, "All work")
  end

  step :collapse_work_map_goal, ctx, goal_key do
    goal = ctx[goal_key]
    testid = UI.testid(["chevron-icon", goal.name])

    UI.click(ctx, testid: testid)
  end

  step :open_work_map_goal, ctx, goal_key do
    goal = ctx[goal_key]
    UI.click_link(ctx, goal.name)
  end

  step :assert_on_goal_page, ctx, goal_key do
    goal = ctx[goal_key]
    UI.assert_page(ctx, Paths.goal_path(ctx.company, goal))
  end

  step :assert_work_map_item_visible, ctx, item_key do
    item = ctx[item_key]
    UI.assert_text(ctx, item.name)
  end

  step :assert_work_map_item_hidden, ctx, item_key do
    item = ctx[item_key]
    UI.refute_text(ctx, item.name)
  end

  step :go_to_space_work_map, ctx do
    UI.click_link(ctx, ctx.space.name)
  end

  step :mark_project_as_completed, ctx do
    ctx
    |> UI.visit(Paths.project_milestone_path(ctx.company, ctx.milestone1))
    |> UI.click_button("Mark complete")
    |> UI.find(UI.query(testid: "milestone-header"), fn el ->
      el
      |> UI.assert_text("Completed")
    end)
    |> UI.sleep(300)
  end

  step :mark_target_as_completed, ctx do
    {:ok, target} = Operately.Goals.update_target(ctx.target1, %{value: 15})

    Map.put(ctx, :target, target)
  end

  #
  # Company Work Map Assertions
  #

  step :assert_company_goals_are_displayed, ctx do
    ctx
    |> UI.assert_text(ctx.company_goal1.name)
    |> UI.assert_text(ctx.company_goal2.name)
  end

  step :assert_company_projects_are_displayed, ctx do
    ctx
    |> UI.assert_text(ctx.company_root_project1.name)
    |> UI.assert_text(ctx.company_root_project2.name)
    |> UI.assert_text(ctx.company_child_project1.name)
    |> UI.assert_text(ctx.company_child_project2.name)
  end

  step :assert_company_paused_projects_are_displayed, ctx do
    ctx
    |> UI.assert_text(ctx.company_root_project1.name)
    |> UI.assert_text(ctx.company_child_project1.name)
  end

  step :assert_company_completed_items_are_displayed, ctx do
    ctx
    |> UI.assert_text(ctx.company_goal1.name)
    |> UI.assert_text(ctx.company_root_project1.name)
    |> UI.assert_text(ctx.company_child_project1.name)
  end

  step :refute_company_goals_are_displayed, ctx do
    ctx
    |> UI.refute_text(ctx.company_goal1.name)
    |> UI.refute_text(ctx.company_goal2.name)
  end

  step :refute_company_projects_are_displayed, ctx do
    ctx
    |> UI.refute_text(ctx.company_root_project1.name)
    |> UI.refute_text(ctx.company_root_project2.name)
    |> UI.refute_text(ctx.company_child_project1.name)
    |> UI.refute_text(ctx.company_child_project2.name)
  end

  step :refute_company_active_projects_are_displayed, ctx do
    ctx
    |> UI.refute_text(ctx.company_root_project2.name)
    |> UI.refute_text(ctx.company_child_project2.name)
  end

  step :refute_company_active_goals_are_displayed, ctx do
    UI.refute_text(ctx, ctx.company_goal2.name)
  end

  #
  # Space Work Map Assertions
  #

  step :assert_space_ongoing_goals_are_displayed, ctx do
    UI.assert_text(ctx, ctx.space_ongoing_goal.name)
  end

  step :assert_space_ongoing_projects_are_displayed, ctx do
    UI.assert_text(ctx, ctx.space_ongoing_project.name)
  end

  step :assert_space_paused_projects_are_displayed, ctx do
    UI.assert_text(ctx, ctx.space_paused_project.name)
  end

  step :assert_space_completed_items_are_displayed, ctx do
    ctx
    |> UI.assert_text(ctx.space_closed_project.name)
    |> UI.assert_text(ctx.space_closed_goal.name)
  end

  step :refute_space_ongoing_goals_are_displayed, ctx do
    UI.refute_text(ctx, ctx.space_ongoing_goal.name)
  end

  step :refute_space_ongoing_projects_are_displayed, ctx do
    UI.refute_text(ctx, ctx.space_ongoing_project.name)
  end

  step :refute_space_paused_projects_are_displayed, ctx do
    UI.refute_text(ctx, ctx.space_paused_project.name)
  end

  step :refute_space_completed_items_are_displayed, ctx do
    ctx
    |> UI.refute_text(ctx.space_closed_project.name)
    |> UI.refute_text(ctx.space_closed_goal.name)
  end

  step :assert_company_members_permissions_visible, ctx do
    UI.assert_text(ctx, "Company Members")
  end

  step :refute_company_members_permissions_visible, ctx do
    UI.refute_text(ctx, "Company Members")
  end

  #
  # Functionality assertions
  #

  step :assert_page_is_space_work_map, ctx do
    UI.assert_page(ctx, Paths.space_work_map_path(ctx.company, ctx.space))
  end

  step :assert_first_milestone_is_displayed, ctx do
    ctx
    |> UI.assert_text(ctx.milestone1.title)
    |> UI.refute_text(ctx.milestone2.title)
  end

  step :assert_second_milestone_is_displayed, ctx do
    ctx
    |> UI.assert_text(ctx.milestone2.title)
    |> UI.refute_text(ctx.milestone1.title)
  end

  step :assert_first_target_is_displayed, ctx do
    ctx
    |> UI.assert_text(ctx.target1.name)
    |> UI.refute_text(ctx.target2.name)
  end

  step :assert_second_target_is_displayed, ctx do
    ctx
    |> UI.assert_text(ctx.target2.name)
    |> UI.refute_text(ctx.target1.name)
  end

  step :assert_project_status_is_pending, ctx do
    ctx
    |> UI.assert_text("Future Project")
    |> UI.assert_text("Pending")
    |> UI.refute_text("Outdated")
  end

  #
  # Permissions
  #

  step :assert_work_map_not_accessible, ctx do
    ctx
    |> UI.assert_text("404")
    |> UI.assert_text("Page Not Found")
  end

  step :assert_can_add_items_zero_state, ctx do
    ctx
    |> UI.assert_text("Start by adding a goal or project")
    |> UI.assert_has(testid: "add-goal")
    |> UI.assert_has(testid: "add-project")
  end

  step :assert_can_add_items, ctx do
    ctx
    |> UI.refute_has(testid: "add-item-modal")
    |> UI.click_text("Add new item")
    |> UI.assert_has(testid: "add-item-modal")
  end

  step :assert_cannot_add_items_zero_state, ctx do
    ctx
    |> UI.assert_text("Nothing here yet.")
    |> UI.refute_text("Start by adding a goal or project")
    |> UI.refute_has(testid: "add-goal")
    |> UI.refute_has(testid: "add-project")
  end

  step :assert_cannot_add_items, ctx do
    ctx
    |> UI.assert_page(Paths.space_work_map_path(ctx.company, ctx.view_space))
    |> UI.assert_text(ctx.goal.name)
    |> UI.refute_text("Add new item")
  end
end
