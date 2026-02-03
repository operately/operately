defmodule Operately.Features.GoalTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.GoalSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "changing goal name", ctx do
    ctx
    |> Steps.change_goal_name()
    |> Steps.assert_goal_name_changed()
    |> Steps.assert_goal_name_changed_feed_posted()
  end

  feature "changing the champion", ctx do
    ctx
    |> Steps.change_champion()
    |> Steps.assert_champion_changed()
    |> Steps.assert_champion_changed_feed_posted()
    |> Steps.assert_champion_changed_email_sent()
    |> Steps.assert_champion_changed_notification_sent()
  end

  feature "removing the champion", ctx do
    ctx
    |> Steps.remove_champion()
    |> Steps.assert_champion_removed()
    |> Steps.assert_champion_removed_feed_posted()
  end

  feature "changing the reviewer", ctx do
    ctx
    |> Steps.change_reviewer()
    |> Steps.assert_reviewer_changed()
    |> Steps.assert_reviewer_changed_feed_posted()
    |> Steps.assert_reviewer_changed_email_sent()
    |> Steps.assert_reviewer_changed_notification_sent()
  end

  feature "removing the reviewer", ctx do
    ctx
    |> Steps.remove_reviewer()
    |> Steps.assert_reviewer_removed()
    |> Steps.assert_reviewer_removed_feed_posted()
  end

  feature "export goal as markdown", ctx do
    ctx
    |> Steps.download_goal_markdown()
    |> Steps.assert_goal_markdown_includes_details()
  end

  # feature "changing the due date", ctx do
  #   ctx
  #   |> Steps.change_due_date()
  #   |> Steps.assert_due_date_changed()
  #   |> Steps.assert_due_date_changed_feed_posted()
  # end

  # feature "removing the due date", ctx do
  #   ctx
  #   |> Steps.remove_due_date()
  #   |> Steps.assert_due_date_removed()
  #   |> Steps.assert_due_date_removed_feed_posted()
  # end

  feature "changing the parent goal", ctx do
    ctx
    |> Steps.change_parent_goal()
    |> Steps.assert_parent_goal_changed_toast()
    |> Steps.assert_parent_goal_changed()
    |> Steps.assert_parent_goal_changed_feed_posted()
  end

  feature "removing the parent goal", ctx do
    ctx
    |> Steps.remove_parent_goal()
    |> Steps.assert_parent_goal_removed()
    |> Steps.assert_parent_goal_removed_feed_posted()
  end

  feature "move to another space", ctx do
    ctx
    |> Steps.move_goal_to_another_space()
    |> Steps.assert_goal_moved_to_another_space()
    |> Steps.assert_goal_moved_to_another_space_feed_posted()
  end

  feature "adding the first target", ctx do
    ctx
    |> Steps.add_first_target()
    |> Steps.assert_target_added()
    |> Steps.assert_target_added_feed_posted()
  end

  feature "adding a new target", ctx do
    ctx
    |> Steps.add_new_target()
    |> Steps.assert_target_added()
    |> Steps.assert_target_added_feed_posted()
  end

  feature "deleting a target", ctx do
    ctx
    |> Steps.delete_target()
    |> Steps.assert_target_deleted()
    |> Steps.assert_target_deleted_feed_posted()
  end

  feature "update target value", ctx do
    ctx
    |> Steps.update_target_value()
    |> Steps.assert_target_value_updated()
    |> Steps.assert_target_value_updated_feed_posted()
  end

  feature "changing the access level", ctx do
    ctx
    |> Steps.change_access_level()
    |> Steps.assert_access_level_changed()
  end

  feature "edit goal description", ctx do
    new_description = "New goal description"

    ctx
    |> Steps.visit_page()
    |> Steps.refute_goal_description(new_description)
    |> Steps.edit_goal_description(new_description)
    |> Steps.assert_goal_description(new_description)
    |> Steps.assert_goal_description_feed_posted()
    |> Steps.visit_page()
    |> Steps.assert_goal_description(new_description)
    |> Steps.assert_goal_description_feed_posted()
  end

  feature "mentioning a person in a goal description sends notification and email", ctx do
    ctx = Steps.given_space_member_exists(ctx)

    ctx
    |> Steps.edit_goal_description_mentioning(ctx.space_member)

    ctx
    |> Steps.assert_space_member_goal_description_notification_sent()
    |> Steps.assert_space_member_goal_description_email_sent()
  end

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

  describe "deletion" do
    feature "deleting a goal with no subitems", ctx do
      ctx
      |> Steps.delete_goal()
      |> Steps.assert_goal_deleted()
    end

    feature "attemping to delete a goal with subitems", ctx do
      ctx
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
      |> Steps.assert_parent_goal_editable()
      |> Steps.assert_start_date_editable()
      |> Steps.assert_champion_editable()
      |> Steps.assert_manage_access_button_visible()
      |> Steps.assert_close_goal_button_visible()
      |> Steps.assert_delete_goal_button_visible()
      |> Steps.assert_add_subgoal_button_visible()
    end

    feature "user with edit access can see actions they can perform only", ctx do
      ctx
      |> Steps.given_user_has_edit_access()
      |> Steps.assert_user_has_edit_access()
      |> Steps.visit_page()
      |> Steps.refute_parent_goal_editable()
      |> Steps.refute_start_date_editable()
      |> Steps.refute_champion_editable()
      |> Steps.refute_manage_access_button_visible()
      |> Steps.refute_close_goal_button_visible()
      |> Steps.refute_delete_goal_button_visible()
      |> Steps.refute_add_subgoal_button_visible()
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
    end
  end

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
