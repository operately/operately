defmodule Operately.Features.GoalCheckInsTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.GoalCheckInsSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  describe "basic check-in flow (status + message)" do
    feature "with on-track status", ctx do
      verify_check_in_workflow(ctx, %{status: "On track", message: "Everything is going well"})
    end

    feature "with needs attention status", ctx do
      verify_check_in_workflow(ctx, %{status: "Needs attention", message: "I need help with this"})
    end

    feature "with at risk status", ctx do
      verify_check_in_workflow(ctx, %{status: "At risk", message: "Blocked by outside factors"})
    end

    feature "with pending status", ctx do
      verify_check_in_workflow(ctx, %{status: "Pending", message: "We didn't start yet"})
    end

    defp verify_check_in_workflow(ctx, values = %{status: status, message: message}) do
      ctx
      |> Steps.initiate_check_in()
      |> Steps.select_status(status)
      |> Steps.fill_in_message(message)
      |> Steps.submit_check_in()
      |> Steps.assert_check_in_submitted(values)
      |> Steps.assert_check_in_feed_item(values)
      # |> Steps.assert_check_in_in_notifications(values)
      # |> Steps.assert_check_in_email_sent(values)
    end
  end

  describe "updating targets during a check-in" do
    feature "increasing a value", ctx do
      verify_target_update(ctx, %{name: "First response time", change: 12})
    end

    feature "decreasing a value", ctx do
      verify_target_update(ctx, %{name: "First response time", change: -12})
    end

    defp verify_target_update(ctx, values) do
      ctx
      |> Steps.initiate_check_in()
      |> Steps.select_status("On track")
      |> Steps.update_target(values)
      |> Steps.fill_in_message("Everything is going well")
      |> Steps.submit_check_in()
      |> Steps.assert_target_updated(values)
    end
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
    |> Steps.acknowledge_check_in()
    |> Steps.assert_check_in_acknowledged_email_sent_to_champion()
    |> Steps.assert_check_in_acknowledged_in_feed()
    |> Steps.assert_check_in_acknowledged_in_notifications()
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
    |> Steps.comment_on_check_in("Great job!")
    |> Steps.assert_check_in_commented_in_feed("Great job!")
    |> Steps.assert_check_in_commented_in_notifications()
    |> Steps.assert_check_in_commented_email_sent()
  end
end
