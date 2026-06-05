defmodule Operately.Features.Goal.TargetsAndDescriptionTest do
  use Operately.FeatureCase
  use Operately.Support.Features.GoalCase

  feature "adding the first target", ctx do
    ctx
    |> Steps.assert_logged_in_member_has_edit_access()
    |> Steps.visit_goal()
    |> Steps.add_first_target()
    |> Steps.assert_target_added()
    |> Steps.assert_target_added_feed_posted()
  end

  feature "adding a new target", ctx do
    ctx
    |> Steps.assert_logged_in_member_has_edit_access()
    |> Steps.visit_goal()
    |> Steps.add_new_target()
    |> Steps.assert_target_added()
    |> Steps.assert_target_added_feed_posted()
  end

  feature "deleting a target", ctx do
    ctx
    |> Steps.assert_logged_in_member_has_edit_access()
    |> Steps.visit_goal()
    |> Steps.delete_target()
    |> Steps.assert_target_deleted()
    |> Steps.assert_target_deleted_feed_posted()
  end

  feature "update target value", ctx do
    ctx
    |> Steps.assert_logged_in_member_has_edit_access()
    |> Steps.visit_goal()
    |> Steps.update_target_value()
    |> Steps.assert_target_value_updated()
    |> Steps.assert_target_value_updated_feed_posted()
  end

  feature "changing the access level", ctx do
    ctx
    |> Steps.assert_logged_in_member_has_full_access()
    |> Steps.visit_goal()
    |> Steps.change_access_level()
    |> Steps.assert_access_level_changed()
  end

  feature "edit goal description", ctx do
    new_description = "New goal description"

    ctx
    |> Steps.assert_logged_in_member_has_edit_access()
    |> Steps.visit_goal()
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
    |> Steps.assert_logged_in_member_has_edit_access()
    |> Steps.visit_goal()
    |> Steps.edit_goal_description_mentioning(ctx.space_member)

    ctx
    |> Steps.assert_space_member_goal_description_notification_sent()
    |> Steps.assert_space_member_goal_description_email_sent()
  end
end
