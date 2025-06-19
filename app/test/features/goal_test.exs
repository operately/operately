defmodule Operately.Features.GoalTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.GoalSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "changing goal name", ctx do
    ctx
    |> Steps.change_goal_name()
    |> Steps.assert_goal_name_changed()
  end

  feature "changing the champion", ctx do
    ctx
    |> Steps.change_champion()
    |> Steps.assert_champion_changed()
    |> Steps.assert_champion_changed_feed_posted()
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
  end

  feature "removing the reviewer", ctx do
    ctx
    |> Steps.remove_reviewer()
    |> Steps.assert_reviewer_removed()
    |> Steps.assert_reviewer_removed_feed_posted()
  end

  feature "changing the due date", ctx do
    ctx
    |> Steps.change_due_date()
    |> Steps.assert_due_date_changed()
    |> Steps.assert_due_date_changed_feed_posted()
  end

  feature "removing the due date", ctx do
    ctx
    |> Steps.remove_due_date()
    |> Steps.assert_due_date_removed()
    |> Steps.assert_due_date_removed_feed_posted()
  end

  feature "changing the parent goal", ctx do
    ctx
    |> Steps.change_parent_goal()
    |> Steps.assert_parent_goal_changed()
  end

  feature "removing the parent goal", ctx do
    ctx
    |> Steps.remove_parent_goal()
    |> Steps.assert_parent_goal_removed()
  end

  feature "move to another space", ctx do
    ctx
    |> Steps.move_goal_to_another_space()
    |> Steps.assert_goal_moved_to_another_space()
  end

  feature "adding a new target", ctx do
    ctx
    |> Steps.add_new_target()
    |> Steps.assert_target_added()
  end

  feature "deleting a target", ctx do
    ctx
    |> Steps.delete_target()
    |> Steps.assert_target_deleted()
  end

  feature "update target value", ctx do
    ctx
    |> Steps.update_target_value()
    |> Steps.assert_target_value_updated()
  end

  feature "changing the access level", ctx do
    ctx
    |> Steps.change_access_level()
    |> Steps.assert_access_level_changed()
  end

  # describe "closing a goal" do
  # feature "closing goal", ctx do
  #   ctx
  #   |> Steps.close_goal(%{success: "yes", retrospective: "We did it!"})
  #   |> Steps.assert_goal_closed_as_accomplished()
  #   |> Steps.assert_goal_is_not_editable()
  #   |> Steps.assert_goal_closed_email_sent()
  #   |> Steps.assert_goal_closed_feed_posted()
  #   |> Steps.assert_goal_closed_notification_sent()
  # end

  # feature "closing a goal that has active subitems", ctx do
  #   ctx
  #   |> Steps.given_a_goal_has_active_subitems()
  #   |> Steps.initiate_goal_closing()
  #   |> Steps.assert_warning_about_active_subitems()
  #   |> Steps.close_goal_with_active_subitems()
  #   |> Steps.assert_goal_closed_as_accomplished()
  #   |> Steps.assert_goal_is_not_editable()
  #   |> Steps.assert_goal_closed_email_sent()
  #   |> Steps.assert_goal_closed_feed_posted()
  #   |> Steps.assert_goal_closed_notification_sent()
  # end

  # feature "closing goal and marking it as not accomplished", ctx do
  #   ctx
  #   |> Steps.close_goal(%{success: "no", retrospective: "We didn't do it :("})
  #   |> Steps.assert_goal_closed_as_dropped()
  #   |> Steps.assert_goal_is_not_editable()
  #   |> Steps.assert_goal_closed_email_sent()
  #   |> Steps.assert_goal_closed_feed_posted()
  #   |> Steps.assert_goal_closed_notification_sent()
  # end

  # feature "attempting to close a goal without a retrospective shows an error", ctx do
  #   ctx
  #   |> Steps.visit_page()
  #   |> Steps.attempt_to_close_goal_with_empty_retrospective(%{success: "yes"})
  #   |> Steps.assert_retrospective_error_shown()
  #   |> Steps.fill_retrospective_and_submit("Added retrospective after error")
  #   |> Steps.assert_goal_closed_as_accomplished()
  #   |> Steps.assert_goal_is_not_editable()
  #   |> Steps.assert_goal_closed_email_sent()
  #   |> Steps.assert_goal_closed_feed_posted()
  #   |> Steps.assert_goal_closed_notification_sent()
  # end

  # feature "commenting on goal closing", ctx do
  #   ctx
  #   |> Steps.visit_page()
  #   |> Steps.close_goal(%{success: "yes", retrospective: "We did it!"})
  #   |> Steps.comment_on_the_goal_closed()
  #   |> Steps.assert_comment_on_the_goal_closing_feed_posted()
  #   |> Steps.assert_comment_on_the_goal_closing_email_sent()
  #   |> Steps.assert_comment_on_the_goal_closing_notification_sent()
  # end
  # end

  # feature "re-opening a closed goal", ctx do
  #   ctx
  #   |> Steps.visit_page()
  #   |> Steps.close_goal(%{success: "yes", retrospective: "We did it!"})
  #   |> Steps.reopen_goal(%{message: "It was too early to close it. Reopening."})
  #   |> Steps.assert_goal_reopened()
  #   |> Steps.assert_goal_reopened_email_sent()
  #   |> Steps.assert_goal_reopened_feed_posted()
  #   |> Steps.assert_goal_reopened_notification_sent()
  # end

  # feature "commenting on goal reopening", ctx do
  #   ctx
  #   |> Steps.visit_page()
  #   |> Steps.close_goal(%{success: "yes", retrospective: "We did it!"})
  #   |> Steps.reopen_goal(%{message: "It was too early to close it. Reopening."})
  #   |> Steps.comment_on_the_goal_reopened()
  #   |> Steps.assert_comment_on_the_goal_reopening_feed_posted()
  #   |> Steps.assert_comment_on_the_goal_reopening_email_sent()
  #   |> Steps.assert_comment_on_the_goal_reopening_notification_sent()
  # end

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
