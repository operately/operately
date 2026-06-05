defmodule Operately.Features.Goal.DetailsTest do
  use Operately.FeatureCase
  use Operately.Support.Features.GoalCase

  feature "changing goal name", ctx do
    ctx
    |> Steps.assert_logged_in_member_has_edit_access()
    |> Steps.visit_goal()
    |> Steps.change_goal_name()
    |> Steps.assert_goal_name_changed()
    |> Steps.assert_goal_name_changed_feed_posted()
  end

  feature "changing the champion", ctx do
    ctx
    |> Steps.assert_logged_in_member_has_full_access()
    |> Steps.visit_goal()
    |> Steps.change_champion()
    |> Steps.assert_champion_changed()
    |> Steps.assert_champion_changed_feed_posted()
    |> Steps.assert_champion_changed_email_sent()
    |> Steps.assert_champion_changed_notification_sent()
  end

  feature "removing the champion", ctx do
    ctx
    |> Steps.assert_logged_in_member_has_full_access()
    |> Steps.visit_goal()
    |> Steps.remove_champion()
    |> Steps.assert_champion_removed()
    |> Steps.assert_champion_removed_feed_posted()
  end

  feature "changing the reviewer", ctx do
    ctx
    |> Steps.assert_logged_in_member_has_full_access()
    |> Steps.visit_goal()
    |> Steps.change_reviewer()
    |> Steps.assert_reviewer_changed()
    |> Steps.assert_reviewer_changed_feed_posted()
    |> Steps.assert_reviewer_changed_email_sent()
    |> Steps.assert_reviewer_changed_notification_sent()
  end

  feature "removing the reviewer", ctx do
    ctx
    |> Steps.assert_logged_in_member_has_full_access()
    |> Steps.visit_goal()
    |> Steps.remove_reviewer()
    |> Steps.assert_reviewer_removed()
    |> Steps.assert_reviewer_removed_feed_posted()
  end

  feature "export goal as markdown", ctx do
    ctx
    |> Steps.assert_logged_in_member_has_view_access()
    |> Steps.visit_goal()
    |> Steps.download_goal_markdown()
    |> Steps.assert_goal_markdown_includes_details()
  end

  feature "changing the parent goal", ctx do
    ctx
    |> Steps.assert_logged_in_member_has_edit_access()
    |> Steps.visit_goal()
    |> Steps.change_parent_goal()
    |> Steps.assert_parent_goal_changed_toast()
    |> Steps.assert_parent_goal_changed()
    |> Steps.assert_parent_goal_changed_feed_posted()
  end

  feature "removing the parent goal", ctx do
    ctx
    |> Steps.assert_logged_in_member_has_edit_access()
    |> Steps.visit_goal()
    |> Steps.remove_parent_goal()
    |> Steps.assert_parent_goal_removed()
    |> Steps.assert_parent_goal_removed_feed_posted()
  end

  feature "move to another space", ctx do
    ctx
    |> Steps.assert_logged_in_member_has_full_access()
    |> Steps.visit_goal()
    |> Steps.move_goal_to_another_space()
    |> Steps.assert_goal_moved_to_another_space()
    |> Steps.assert_goal_moved_to_another_space_feed_posted()
  end
end
