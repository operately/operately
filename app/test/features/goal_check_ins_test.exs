defmodule Operately.Features.GoalChecksInsTest do
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
    |> Steps.assert_acknowledge_button_visible_to_champion()
    |> Steps.acknowledge_check_in_from_email_as_champion()
    |> Steps.assert_acknowledged_email_sent_to_reviewer()
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

  feature "commenting on a check-in", ctx do
    ctx
    |> Steps.given_a_check_in_exists()
    |> Steps.comment_on_check_in_as_reviewer("Great job!")
    |> Steps.assert_check_in_commented_in_feed("Great job!")
    |> Steps.assert_check_in_commented_in_notifications()
    |> Steps.assert_check_in_commented_notification_redirects_on_click()
    |> Steps.assert_comment_email_sent()
  end

  feature "delete comment from check-in", ctx do
    ctx
    |> Steps.given_a_check_in_exists()
    |> Steps.visit_check_in()
    |> Steps.leave_comment_on_check_in("This is a comment")
    |> Steps.delete_comment("This is a comment")
    |> Steps.assert_comment_deleted()
    |> Steps.assert_check_in_comment_visible_on_feed_after_deletion()
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

  describe "goal check-in pages preload access" do
    feature "goal check-in new page hides space navigation when space is not accessible", ctx do
      ctx
      |> Steps.given_goal_in_secret_space_for_champion()
      |> Steps.visit_goal_new_check_in_page()
      |> Steps.assert_check_in_new_navigation_without_space()
    end

    feature "goal check-in page hides space navigation when space is not accessible", ctx do
      params = %{
        status: "on_track",
        message: "Checking-in on my goal",
        targets: %{
          "First response time" => 20,
          "Increase feedback score to 90%" => 80
        }
      }

      ctx
      |> Steps.given_goal_in_secret_space_for_champion()
      |> Steps.visit_check_ins_tab(:secret_goal)
      |> Steps.check_in(params)
      |> Steps.assert_check_in_navigation_without_space()
    end
  end
end
