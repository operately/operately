defmodule Operately.Features.WorkMapTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.WorkMapSteps, as: Steps

  describe "Company Work Map" do
    setup ctx, do: Steps.setup_company_work_map(ctx)

    feature "All work tab displays goals and projects", ctx do
      ctx
      |> Steps.visit_company_work_map()
      |> Steps.assert_company_goals_are_displayed()
      |> Steps.assert_company_projects_are_displayed()
    end

    feature "Only goals are displayed in goals tab", ctx do
      ctx
      |> Steps.visit_company_work_map()
      |> Steps.go_to_goals_tab()
      |> Steps.assert_company_goals_are_displayed()
      |> Steps.refute_company_projects_are_displayed()
    end

    feature "Only projects are displayed in projects tab", ctx do
      ctx
      |> Steps.visit_company_work_map()
      |> Steps.go_to_projects_tab()
      |> Steps.assert_company_projects_are_displayed()
      |> Steps.refute_company_goals_are_displayed()
    end

    feature "Only paused projects are displayed in paused tab", ctx do
      ctx
      |> Steps.given_company_projects_are_paused()
      |> Steps.visit_company_work_map()
      |> Steps.go_to_paused_tab()
      |> Steps.assert_company_paused_projects_are_displayed()
      |> Steps.refute_company_goals_are_displayed()
      |> Steps.refute_company_active_projects_are_displayed()
    end

    feature "Only completed goals and projects are displayed in completed tab", ctx do
      ctx
      |> Steps.given_company_projects_are_completed()
      |> Steps.given_company_goal_is_completed()
      |> Steps.visit_company_work_map()
      |> Steps.go_to_completed_tab()
      |> Steps.assert_company_completed_items_are_displayed()
      |> Steps.refute_company_active_projects_are_displayed()
      |> Steps.refute_company_active_goals_are_displayed()
    end
  end

  describe "Space Work Map" do
    setup ctx do
      ctx
      |> Steps.setup_company_work_map()
      |> Steps.setup_space_work_map()
    end

    feature "All work tab displays goals and projects", ctx do
      ctx
      |> Steps.visit_space_work_map(:space)
      |> Steps.assert_space_ongoing_goals_are_displayed()
      |> Steps.assert_space_ongoing_projects_are_displayed()
      |> Steps.refute_space_paused_projects_are_displayed()
      |> Steps.refute_space_completed_items_are_displayed()
    end

    feature "Only goals are displayed in goals tab", ctx do
      ctx
      |> Steps.visit_space_work_map(:space)
      |> Steps.go_to_goals_tab()
      |> Steps.assert_space_ongoing_goals_are_displayed()
      |> Steps.refute_space_ongoing_projects_are_displayed()
    end

    feature "Only projects are displayed in projects tab", ctx do
      ctx
      |> Steps.visit_space_work_map(:space)
      |> Steps.go_to_projects_tab()
      |> Steps.assert_space_ongoing_projects_are_displayed()
      |> Steps.refute_space_ongoing_goals_are_displayed()
    end

    feature "Only paused projects are displayed in paused tab", ctx do
      ctx
      |> Steps.visit_space_work_map(:space)
      |> Steps.go_to_paused_tab()
      |> Steps.assert_space_paused_projects_are_displayed()
      |> Steps.refute_space_ongoing_projects_are_displayed()
      |> Steps.refute_space_ongoing_goals_are_displayed()
    end

    feature "Only completed projects and goals are displayed in completed tab", ctx do
      ctx
      |> Steps.visit_space_work_map(:space)
      |> Steps.go_to_completed_tab()
      |> Steps.assert_space_completed_items_are_displayed()
      |> Steps.refute_space_ongoing_projects_are_displayed()
      |> Steps.refute_space_ongoing_goals_are_displayed()
    end
  end

  describe "Work Map functionality" do
    feature "Correct milestone is displayed", ctx do
      ctx
      |> Steps.given_project_with_milestones_exist()
      |> Steps.visit_company_work_map()
      |> Steps.assert_first_milestone_is_displayed()
      |> Steps.mark_project_as_completed()
      |> Steps.visit_company_work_map()
      |> Steps.assert_second_milestone_is_displayed()
    end

    feature "Correct target is displayed", ctx do
      ctx
      |> Steps.given_goal_with_targets_exist()
      |> Steps.visit_company_work_map()
      |> Steps.assert_first_target_is_displayed()
      |> Steps.mark_target_as_completed()
      |> Steps.visit_company_work_map()
      |> Steps.assert_second_target_is_displayed()
    end

    feature "Navigate to Space Work Map", ctx do
      ctx
      |> Steps.given_project_exists()
      |> Steps.visit_company_work_map()
      |> Steps.go_to_space_work_map()
      |> Steps.assert_page_is_space_work_map()
    end

    feature "Collapsed goals persist after navigation", ctx do
      ctx
      |> Steps.setup_company_work_map()
      |> Steps.visit_company_work_map()
      |> Steps.assert_work_map_item_visible(:company_child_project1)
      |> Steps.assert_work_map_item_visible(:company_child_project2)
      |> Steps.collapse_work_map_goal(:company_goal1)
      |> Steps.assert_work_map_item_hidden(:company_child_project1)
      |> Steps.go_to_goals_tab()
      |> Steps.assert_work_map_item_hidden(:company_child_project1)
      |> Steps.go_to_all_tab()
      |> Steps.collapse_work_map_goal(:company_goal2)
      |> Steps.open_work_map_goal(:company_goal1)
      |> Steps.assert_on_goal_page(:company_goal1)
      |> Steps.visit_company_work_map()
      |> Steps.assert_work_map_item_hidden(:company_child_project1)
      |> Steps.assert_work_map_item_hidden(:company_child_project2)
    end
  end
end
