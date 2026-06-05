defmodule Operately.Features.Goal.AccessManagementTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.GoalSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  describe "access management" do
    feature "outside collaborator cannot see goal with comment access until admin grants access", ctx do
      ctx
      |> Steps.setup_goal_with_comment_access_and_outside_collaborator()
      |> Steps.login_as_outside_collaborator()
      |> Steps.visit_goal_page_as_collaborator()
      |> Steps.assert_goal_page_not_found()
      |> Steps.login_as_admin()
      |> Steps.visit_goal_access_management_page()
      |> Steps.give_collaborator_view_access()
      |> Steps.login_as_outside_collaborator()
      |> Steps.visit_goal_page_as_collaborator()
      |> Steps.assert_goal_page_loaded()
    end

    feature "space member cannot create discussion with comment access until admin grants edit access", ctx do
      ctx
      |> Steps.setup_goal_with_comment_access_and_space_member()
      |> Steps.login_as_space_member()
      |> Steps.visit_goal_discussions_page_as_member()
      |> Steps.assert_start_discussion_button_not_visible()
      |> Steps.login_as_admin()
      |> Steps.visit_goal_access_management_page()
      |> Steps.give_member_edit_access()
      |> Steps.login_as_space_member()
      |> Steps.visit_goal_discussions_page_as_member()
      |> Steps.assert_start_discussion_button_visible()
      |> Steps.click_start_discussion_button()
      |> Steps.assert_add_discussion_page_loaded()
    end

    feature "outside collaborator loses access when admin removes it", ctx do
      ctx
      |> Steps.setup_goal_with_comment_access_and_outside_collaborator()
      |> Steps.login_as_admin()
      |> Steps.visit_goal_access_management_page()
      |> Steps.give_collaborator_view_access()
      |> Steps.login_as_outside_collaborator()
      |> Steps.visit_goal_page_as_collaborator()
      |> Steps.assert_goal_page_loaded()
      |> Steps.login_as_admin()
      |> Steps.visit_goal_access_management_page()
      |> Steps.remove_collaborator_access()
      |> Steps.assert_collaborator_has_no_access()
    end
  end
end
