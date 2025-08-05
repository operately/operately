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
end
