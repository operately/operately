defmodule Operately.Features.GoalCheckInsTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.GoalCheckInsSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "check-in on a goal", ctx do
    ctx
    |> Steps.initiate_check_in()
    |> UI.sleep(1000) # delete this line
    # |> Steps.select_on_track()
    # |> Steps.update_target(%{target: ctx.target_1, value: 20})
    # |> Steps.fill_in_message("Everything is going well")
    # |> Steps.submit_check_in()
    # |> Steps.assert_check_in_submitted()
    # |> Steps.assert_check_in_in_feed()
    # |> Steps.assert_check_in_in_notifications()
    # |> Steps.assert_check_in_email_sent()
  end

  feature "extending the timeframe during a check-in", ctx do
    ctx
    |> Steps.initiate_check_in()
    |> UI.sleep(1000) # delete this line
    # |> Steps.select_on_track()
    # |> Steps.fill_in_message("Everything is going well")
    # |> Steps.extend_timeframe()
    # |> Steps.submit_check_in()
    # |> Steps.assert_timeframe_extended_message_visible()
  end

  feature "acknowledge a progress update in the web app", ctx do
    ctx
    |> Steps.given_a_check_in_was_submitted_on_a_goal_that_i_review()
    |> UI.sleep(1000) # delete this line
    # |> Steps.acknowledge_check_in()
    # |> Steps.assert_acknowledge_email_sent()
    # |> Steps.assert_check_in_acknowledged_email_sent_to_champion()
    # |> Steps.assert_check_in_acknowledged_in_feed()
    # |> Steps.assert_check_in_acknowledged_in_notifications()
  end

  feature "acknowledge a check-in from the email", ctx do
    ctx
    |> Steps.given_a_check_in_was_submitted_on_a_goal_that_i_review()
    |> UI.sleep(1000) # delete this line
    # |> Steps.assert_incoming_email()
    # |> Steps.acknowledge_check_in_from_email()
    # |> Steps.assert_check_in_acknowledged_email_sent_to_champion()
    # |> Steps.assert_check_in_acknowledged_in_feed()
    # |> Steps.assert_check_in_acknowledged_in_notifications()
  end

  feature "edit a submitted progress update", ctx do
    ctx
    |> Steps.given_i_submitted_a_check_in()
    |> UI.sleep(1000) # delete this line
    # |> Steps.initiate_editing_check_in()
    # |> Steps.select_caution()
    # |> Steps.update_target(%{target: ctx.target_2, value: 10})
    # |> Steps.fill_in_message("Editing the message")
    # |> Steps.submit_check_in()
    # |> Steps.assert_check_in_edited()
  end

  feature "commenting on a progress update", ctx do
    ctx
    |> Steps.given_a_check_in_exists()
    |> UI.sleep(1000) # delete this line
    # |> Steps.comment_on_check_in("Great job!")
    # |> Steps.assert_check_in_commented_in_feed("Great job!")
    # |> Steps.assert_check_in_commented_in_notifications()
    # |> Steps.assert_check_in_commented_email_sent()
  end
end
