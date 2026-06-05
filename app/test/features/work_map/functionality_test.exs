defmodule Operately.Features.WorkMap.FunctionalityTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.WorkMapSteps, as: Steps

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

    feature "Projects with future start dates show as Pending, not Outdated", ctx do
      ctx
      |> Steps.given_project_with_future_start_date_exists()
      |> Steps.visit_company_work_map()
      |> Steps.assert_project_status_is_pending()
    end
  end
end
