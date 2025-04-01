defmodule Operately.Features.GoalProgressUpdateTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.GoalCheckInsSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "check-in on a goal", ctx do
    params = %{
      status: "on_track",
      message: "Checking-in on my goal",
      targets: %{
        "First response time" => 20,
        "Increase feedback score to 90%" => 80
      }
    }

    ctx
    |> Steps.check_in(params)
    |> Steps.assert_check_in_feed_item(params)
    |> Steps.assert_check_in_notifications()
    |> Steps.assert_check_in_email_sent()
  end

  feature "acknowledge a check-in in the web app", ctx do
    ctx
    |> Steps.given_a_check_in_exists()
    |> Steps.acknowledge_check_in()
    |> Steps.assert_acknowledge_email_sent()
    |> Steps.assert_check_in_acknowledged_in_feed()
    |> Steps.assert_check_in_acknowledged_in_notifications()
  end

  feature "acknowledge a check-in from the email", ctx do
    params = %{
      status: "on_track",
      message: "Checking-in on my goal",
      targets: %{
        "First response time" => 20,
        "Increase feedback score to 90%" => 80
      }
    }

    ctx
    |> Steps.check_in(params)
    |> Steps.acknowledge_check_in_from_email()
    |> Steps.assert_acknowledge_email_sent()
    |> Steps.assert_check_in_acknowledged_in_feed()
    |> Steps.assert_check_in_acknowledged_in_notifications()
  end

  feature "acknowledge a check-in as a champion (reviewer submitted)", ctx do
    ctx
    |> Steps.given_a_reviewer_submitted_check_in()
    |> Steps.acknowledge_check_in_from_email_as_champion()
    |> Steps.assert_acknowledge_email_sent_to_reviewer()
  end

  feature "edit a submitted check-in", ctx do
    params = %{
      status: "at risk",
      message: "Checking-in on my goal",
      targets: %{
        "First response time" => 20,
        "Increase feedback score to 90%" => 80
      }
    }

    edit_params = %{
      status: "on track",
      message: "This is an edited check-in.",
      targets: %{
        "First response time" => 30,
        "Increase feedback score to 90%" => 90
      }
    }

    ctx
    |> Steps.check_in(params)
    |> Steps.edit_check_in(edit_params)
    |> Steps.assert_check_in_edited(edit_params)
  end

  feature "commenting on a check-in", ctx do
    ctx
    |> Steps.given_a_check_in_exists()
    |> Steps.comment_on_check_in_as_reviewer("Great job!")
    |> Steps.assert_check_in_commented_in_feed("Great job!")
    |> Steps.assert_check_in_commented_in_notifications()
    |> Steps.assert_check_in_commented_notification_redirects_on_click()
    |> Steps.assert_comment_email_sent()
  end
end
