defmodule Operately.Features.WorkMap.CompanyPermissionsTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.WorkMapSteps, as: Steps

  describe "Company Work Map Permissions" do
    feature "Zero state - User can add goals/projects", ctx do
      ctx
      |> Steps.setup_spaces()
      |> Steps.visit_company_work_map()
      |> Steps.assert_can_add_items_zero_state()
    end

    feature "Zero state - User cannot add goals/projects", ctx do
      ctx
      |> Steps.given_there_is_a_space_with_view_access()
      |> Steps.given_user_has_view_access_to_general_space()
      |> Steps.visit_company_work_map()
      |> Steps.assert_cannot_add_items_zero_state()
    end

    feature "User can add goals/projects", ctx do
      ctx
      |> Steps.setup_spaces()
      |> Steps.given_there_are_items_in_spaces()
      |> Steps.visit_company_work_map()
      |> Steps.assert_can_add_items()
    end

    feature "User cannot add goals/projects", ctx do
      ctx
      |> Steps.given_there_is_a_space_with_view_access()
      |> Steps.given_view_space_has_a_goal()
      |> Steps.given_user_has_view_access_to_general_space()
      |> Steps.visit_company_work_map()
      |> Steps.assert_cannot_add_items()
    end

    feature "Space is not loaded when user can't see space", ctx do
      ctx
      |> Steps.given_there_are_resouces_within_secret_space()
      |> Steps.given_logged_in_user_cant_see_secret_space()
      |> Steps.visit_company_work_map()
      |> Steps.assert_goal_and_project_visible()
      |> Steps.assert_secret_space_not_visible()
    end

    feature "Space is loaded when user can see space", ctx do
      ctx
      |> Steps.given_there_are_resources_within_visible_space()
      |> Steps.given_logged_in_user_can_see_visible_space()
      |> Steps.visit_company_work_map()
      |> Steps.assert_goal_and_project_visible()
      |> Steps.assert_space_visible()
    end
  end
end
