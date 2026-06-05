defmodule Operately.Features.Goal.DeletionAndPermissionsTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.GoalSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  describe "deletion" do
    feature "deleting a goal with no subitems", ctx do
      ctx
      |> Steps.assert_logged_in_member_has_full_access()
      |> Steps.visit_page()
      |> Steps.delete_goal()
      |> Steps.assert_goal_deleted()
    end

    feature "attemping to delete a goal with subitems", ctx do
      ctx
      |> Steps.assert_logged_in_member_has_full_access()
      |> Steps.visit_page()
      |> Steps.given_goal_has_subgoals()
      |> Steps.visit_page()
      |> Steps.assert_goal_cannot_be_deleted()
    end
  end

  describe "permissions" do
    feature "user with full access can see all action buttons", ctx do
      ctx
      |> Steps.given_user_has_full_access()
      |> Steps.assert_user_has_full_access()
      |> Steps.visit_page()
      |> Steps.assert_champion_editable()
      |> Steps.assert_manage_access_button_visible()
      |> Steps.assert_delete_goal_button_visible()
    end

    feature "user with edit access can see actions they can perform only", ctx do
      ctx
      |> Steps.given_user_has_edit_access()
      |> Steps.assert_user_has_edit_access()
      |> Steps.visit_page()
      |> Steps.refute_champion_editable()
      |> Steps.refute_manage_access_button_visible()
      |> Steps.refute_delete_goal_button_visible()
      |> Steps.assert_start_date_editable()
      |> Steps.assert_parent_goal_editable()
      |> Steps.assert_close_goal_button_visible()
      |> Steps.assert_add_subgoal_button_visible()
      |> Steps.assert_check_in_button_visible()
      |> Steps.assert_discussion_button_visible()
      |> Steps.assert_add_checklist_button_visible()
    end

    feature "user with comment access can't see actions they can't perform", ctx do
      ctx
      |> Steps.given_user_has_comment_access()
      |> Steps.assert_user_has_comment_access()
      |> Steps.visit_page()
      |> Steps.refute_check_in_button_visible()
      |> Steps.refute_discussion_button_visible()
      |> Steps.refute_add_checklist_button_visible()
      |> Steps.refute_parent_goal_editable()
      |> Steps.refute_start_date_editable()
      |> Steps.refute_close_goal_button_visible()
      |> Steps.refute_add_subgoal_button_visible()
    end
  end
end
