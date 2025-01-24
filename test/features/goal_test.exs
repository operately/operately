defmodule Operately.Features.GoalTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.GoalSteps, as: Steps

  setup ctx do
    ctx = Steps.setup(ctx)
    ctx = Steps.visit_page(ctx)

    {:ok, ctx}
  end

  feature "archive goal", ctx do
    ctx
    |> Steps.archive_goal()
    |> Steps.assert_goal_archived()
    |> Steps.assert_goal_archived_email_sent()
    |> Steps.assert_goal_archived_feed_posted()
  end

  feature "editing goals", ctx do
    ctx
    |> Steps.edit_goal()
    |> Steps.assert_goal_edited()
    |> Steps.assert_goal_edited_email_sent()
    |> Steps.assert_goal_edited_feed_posted()
    |> Steps.assert_goal_edited_space_feed_posted()
    |> Steps.assert_goal_edited_company_feed_posted()
  end

  @parent_goal_params %{
    name: "Reduce first response time for support tickets",
    target_name: "First response time",
    from: "30",
    to: "15",
    unit: "minutes",
  }

  feature "adding goal parent", ctx do
    ctx
    |> Steps.assert_goal_is_company_wide()
    |> Steps.given_a_goal_exists(@parent_goal_params)
    |> Steps.change_goal_parent(@parent_goal_params.name)
    |> Steps.assert_goal_parent_changed(@parent_goal_params.name)
    |> Steps.assert_goal_reparent_on_goal_feed(new_name: @parent_goal_params.name)
    |> Steps.assert_goal_reparent_on_space_feed(new_name: @parent_goal_params.name)
    |> Steps.assert_goal_reparent_on_company_feed(new_name: @parent_goal_params.name)
  end

  feature "changing goal parent", ctx do
    ctx = Steps.given_goal_and_potential_parent_goals_exist(ctx)

    ctx
    |> Steps.visit_page()
    |> Steps.change_goal_parent(ctx.parent2.name)
    |> Steps.assert_goal_parent_changed(ctx.parent2.name)
    |> Steps.assert_goal_reparent_on_goal_feed(new_name: ctx.parent2.name, old_name: ctx.parent1.name)
    |> Steps.assert_goal_reparent_on_space_feed(new_name: ctx.parent2.name, old_name: ctx.parent1.name)
    |> Steps.assert_goal_reparent_on_company_feed(new_name: ctx.parent2.name, old_name: ctx.parent1.name)
  end

  feature "closing goal", ctx do
    ctx
    |> Steps.close_goal(%{success: "yes", retrospective: "We did it!"})
    |> Steps.assert_goal_closed_as_accomplished()
    |> Steps.assert_goal_is_not_editable()
    |> Steps.assert_goal_closed_email_sent()
    |> Steps.assert_goal_closed_feed_posted()
    |> Steps.assert_goal_closed_notification_sent()
  end

  feature "closing a goal that has active subitems", ctx do
    ctx
    |> Steps.given_a_goal_has_active_subitems()
    |> Steps.initiate_goal_closing()
    |> Steps.assert_warning_about_active_subitems()
    |> Steps.close_goal_with_active_subitems()
    |> Steps.assert_goal_closed_as_accomplished()
    |> Steps.assert_goal_is_not_editable()
    |> Steps.assert_goal_closed_email_sent()
    |> Steps.assert_goal_closed_feed_posted()
    |> Steps.assert_goal_closed_notification_sent()
  end

  feature "closing goal and marking it as not accomplished", ctx do
    ctx
    |> Steps.close_goal(%{success: "no", retrospective: "We didn't do it :("})
    |> Steps.assert_goal_closed_as_dropped()
    |> Steps.assert_goal_is_not_editable()
    |> Steps.assert_goal_closed_email_sent()
    |> Steps.assert_goal_closed_feed_posted()
    |> Steps.assert_goal_closed_notification_sent()
  end

  feature "commenting on goal closing", ctx do
    ctx
    |> Steps.visit_page()
    |> Steps.close_goal(%{success: "yes", retrospective: "We did it!"})
    |> Steps.comment_on_the_goal_closed()
    |> Steps.assert_comment_on_the_goal_closing_feed_posted()
    |> Steps.assert_comment_on_the_goal_closing_email_sent()
    |> Steps.assert_comment_on_the_goal_closing_notification_sent()
  end

  feature "re-opening a closed goal", ctx do
    ctx
    |> Steps.visit_page()
    |> Steps.close_goal(%{success: "yes", retrospective: "We did it!"})
    |> Steps.reopen_goal(%{message: "It was too early to close it. Reopening."})
    |> Steps.assert_goal_reopened()
    |> Steps.assert_goal_reopened_email_sent()
    |> Steps.assert_goal_reopened_feed_posted()
    |> Steps.assert_goal_reopened_notification_sent()
  end

  feature "commenting on goal reopening", ctx do
    ctx
    |> Steps.visit_page()
    |> Steps.close_goal(%{success: "yes", retrospective: "We did it!"})
    |> Steps.reopen_goal(%{message: "It was too early to close it. Reopening."})
    |> Steps.comment_on_the_goal_reopened()
    |> Steps.assert_comment_on_the_goal_reopening_feed_posted()
    |> Steps.assert_comment_on_the_goal_reopening_email_sent()
    |> Steps.assert_comment_on_the_goal_reopening_notification_sent()
  end

  feature "editing the goal's timeframe", ctx do
    ctx
    |> Steps.visit_page()
    |> Steps.edit_goal_timeframe()
    |> Steps.assert_goal_timeframe_edited()
    |> Steps.assert_goal_timeframe_edited_feed_posted()
    |> Steps.assert_goal_timeframe_edited_email_sent()
    |> Steps.assert_goal_timeframe_edited_notification_sent()
  end

  feature "commenting on the goal's timeframe change", ctx do
    ctx
    |> Steps.edit_goal_timeframe()
    |> Steps.comment_on_the_timeframe_change()
    |> Steps.assert_comment_on_the_timeframe_change_feed_posted()
    |> Steps.assert_comment_on_the_timeframe_change_email_sent()
    |> Steps.assert_comment_on_the_timeframe_change_notification_sent()
  end
end
