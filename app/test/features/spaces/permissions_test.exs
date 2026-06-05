defmodule Operately.Features.Spaces.PermissionsTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.SpacesSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  describe "permissions" do
    feature "user with full access can see all action", ctx do
      ctx
      |> Steps.given_user_has_full_access()
      |> Steps.assert_user_has_full_access()
      |> Steps.visit_page()
      |> Steps.assert_manage_access_visible()
      |> Steps.assert_delete_space_visible()
    end

    feature "user with edit access can see actions they can perform only", ctx do
      ctx
      |> Steps.given_user_has_edit_access()
      |> Steps.assert_user_has_edit_access()
      |> Steps.visit_page()
      |> Steps.refute_manage_access_visible()
      |> Steps.refute_delete_space_visible()
      |> Steps.assert_edit_space_visible()
      |> Steps.assert_configure_tools_and_delete_options_visible()
      |> Steps.assert_user_can_add_projects_and_goals_zero_state()
      |> Steps.assert_user_can_add_projects_and_goals_non_zero_state()
      |> Steps.assert_user_can_post_discussion()
      |> Steps.assert_user_can_add_resources()
      |> Steps.assert_user_can_add_tasks()
    end

    feature "user with comment access can't see actions they can't perform", ctx do
      ctx
      |> Steps.given_user_has_comment_access()
      |> Steps.assert_user_has_comment_access()
      |> Steps.visit_page()
      |> Steps.refute_edit_space_visible()
      |> Steps.refute_configure_tools_and_delete_options_visible()
      |> Steps.refute_user_can_add_projects_and_goals_zero_state()
      |> Steps.refute_user_can_add_projects_and_goals_non_zero_state()
      |> Steps.refute_user_can_post_discussion()
      |> Steps.refute_user_can_add_resources()
    end
  end
end
