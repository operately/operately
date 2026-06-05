defmodule Operately.Features.WorkMap.CompanyTabsTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.WorkMapSteps, as: Steps

  setup ctx, do: Steps.setup_company_work_map(ctx)

  describe "Company Work Map" do
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
end
