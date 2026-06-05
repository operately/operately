defmodule Operately.Features.Goal.PreloadAccessTest do
  use Operately.FeatureCase
  use Operately.Support.Features.GoalCase

  describe "goal page preload access" do
    feature "goal page hides space navigation when space is not accessible", ctx do
      ctx
      |> Steps.given_goal_in_secret_space_for_reviewer()
      |> Steps.login_as_reviewer()
      |> Steps.visit_page()
      |> Steps.assert_goal_navigation_without_space()
      |> Steps.assert_move_to_another_space_is_hidden()
    end

    feature "goal page hides parent goal when viewer cannot access it", ctx do
      ctx
      |> Steps.given_goal_with_hidden_parent_goal()
      |> Steps.assert_goal_has_parent_goal()
      |> Steps.assert_company_member_cant_see_parent_goal()
      |> Steps.login_as_company_member()
      |> Steps.visit_page()
      |> Steps.assert_goal_page_loaded()
      |> Steps.assert_parent_goal_field_not_rendered()
    end

    feature "goal page hides related work items the viewer cannot access", ctx do
      ctx
      |> Steps.given_goal_with_hidden_related_work_items()
      |> Steps.login_as_company_member()
      |> Steps.visit_page()
      |> Steps.assert_goal_page_loaded()
      |> Steps.assert_related_work_items_visible()
      |> Steps.refute_hidden_related_work_items()
    end

    feature "goal page shows accessible nested related work even when intermediate items are hidden", ctx do
      ctx
      |> Steps.given_goal_with_nested_related_work_access()
      |> Steps.login_as_company_member()
      |> Steps.visit_page()
      |> Steps.assert_goal_page_loaded()
      |> Steps.assert_nested_related_work_items_visible()
      |> Steps.refute_nested_related_work_items_hidden()
    end
  end
end
