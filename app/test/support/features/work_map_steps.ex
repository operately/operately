defmodule Operately.Support.Features.WorkMapSteps do
  use Operately.FeatureCase

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

  step :visit_company_work_map, ctx do
    UI.visit(ctx, Paths.work_map_path(ctx.company))
  end

  step :visit_space_work_map, ctx, space_name do
    UI.visit(ctx, Paths.space_work_map_path(ctx.company, ctx[space_name]))
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
end
