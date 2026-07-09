defmodule Operately.Features.GoalChecksIns.SubmissionTest do
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

  feature "check-in status is displayed on the check-ins tab", ctx do
    params = %{
      status: "caution",
      message: "We're facing some challenges",
      targets: %{
        "First response time" => 15,
        "Increase feedback score to 90%" => 70
      }
    }

    ctx
    |> Steps.check_in(params)
    |> Steps.visit_check_ins_tab()
    |> Steps.assert_check_in_status_displayed("caution")
  end

  feature "check-in title shows only month on check-ins tab", ctx do
    today = Date.utc_today()
    month = Calendar.strftime(today, "%B")

    ctx
    |> Steps.given_a_check_in_exists()
    |> Steps.visit_check_ins_tab()
    |> UI.assert_text("Check-In for #{month}", testid: "check-in-title")
    |> UI.refute_text("Check-In for #{month} #{today.day}", testid: "check-in-title")
  end

  feature "edit a submitted check-in", ctx do
    params = %{
      status: "off_track",
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

  feature "cannot edit check-in after 72 hours", ctx do
    ctx
    |> Steps.given_an_old_check_in_exists()
    |> Steps.assert_check_in_not_editable()
  end

  feature "cannot edit check-in that is not the latest", ctx do
    ctx
    |> Steps.given_multiple_check_ins_exist()
    |> Steps.assert_latest_check_in_is_editable()
    |> Steps.assert_other_check_ins_not_editable()
  end
end
