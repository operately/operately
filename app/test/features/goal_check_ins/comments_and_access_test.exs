defmodule Operately.Features.GoalChecksIns.CommentsAndAccessTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.GoalCheckInsSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

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
