defmodule Operately.Features.GoalAccessManagementTest do
  use Operately.FeatureCase

  alias Operately.Access.Binding
  alias Operately.Support.Features.GoalAccessSteps, as: Steps

  setup ctx do
    Steps.setup(ctx)
  end

  feature "listing goal access members", ctx do
    ctx
    |> Steps.given_direct_access_member(access_level: Binding.edit_access())
    |> Steps.visit_goal_access_management_page()
    |> Steps.assert_access_members_listed()
  end

  feature "giving a member access to the goal", ctx do
    ctx
    |> Steps.given_company_member_exists()
    |> Steps.visit_goal_access_management_page()
    |> Steps.add_goal_access_member(access_level: Binding.comment_access())
    |> Steps.assert_access_member_added(access_level: Binding.comment_access())
  end

  feature "changing a goal access level", ctx do
    ctx
    |> Steps.given_direct_access_member(access_level: Binding.comment_access())
    |> Steps.visit_goal_access_management_page()
    |> Steps.change_access_level(access_level: Binding.edit_access())
    |> Steps.assert_access_level_changed(access_level: Binding.edit_access())
  end

  feature "removing a goal access member", ctx do
    ctx
    |> Steps.given_direct_access_member(access_level: Binding.comment_access())
    |> Steps.visit_goal_access_management_page()
    |> Steps.remove_access_member()
    |> Steps.assert_access_member_removed()
  end

  describe "permissions" do
    setup ctx do
      Steps.setup_with_edit_access(ctx)
    end

    feature "user with edit access cannot see manage access button", ctx do
      ctx
      |> Steps.ensure_logged_in_user_has_edit_access()
      |> Steps.visit_goal_page()
      |> Steps.assert_manage_access_button_not_visible()
    end

    feature "user with edit access sees 404 when navigating directly to access page", ctx do
      ctx
      |> Steps.ensure_logged_in_user_has_edit_access()
      |> Steps.visit_goal_access_page_directly_and_assert_404()
    end
  end
end
