defmodule Operately.Features.WorkMap.SpaceTabsTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.WorkMapSteps, as: Steps

  setup ctx do
    ctx
    |> Steps.setup_company_work_map()
    |> Steps.setup_space_work_map()
  end

  describe "Space Work Map" do
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
end
