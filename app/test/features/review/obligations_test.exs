defmodule Operately.Features.Review.ObligationsTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ReviewSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  describe "review page" do
    feature "viewing and acknowledging project retrospectives", ctx do
      ctx
      |> Steps.given_there_is_a_project_retrospective_pending_acknowledgement()
      |> Steps.visit_review_page()
      |> Steps.assert_project_retrospective_review_is_listed()
      |> Steps.when_a_project_retrospective_is_acknowledged()
      |> Steps.assert_the_acknowledged_project_retrospective_is_no_longer_displayed()
      |> Steps.assert_all_catch_up()
    end

    feature "viewing and acknowledging goal retrospectives", ctx do
      ctx
      |> Steps.given_there_is_a_goal_retrospective_pending_acknowledgement()
      |> Steps.visit_review_page()
      |> Steps.assert_goal_retrospective_review_is_listed()
      |> Steps.when_a_goal_retrospective_is_acknowledged()
      |> Steps.assert_the_acknowledged_goal_retrospective_is_no_longer_displayed()
      |> Steps.assert_all_catch_up()
    end

    feature "acknowledging goal updates clears reassigned reviewer obligations", ctx do
      ctx
      |> Steps.given_there_are_goal_updates_pending_acknowledgement()
      |> Steps.visit_review_page()
      |> Steps.assert_goal_update_reviews_are_listed()
      |> Steps.when_all_goal_updates_are_acknowledged()
      |> Steps.assert_no_goal_update_reviews_are_listed()
      |> Steps.given_the_goal_has_a_new_reviewer()
      |> Steps.log_in_as_the_new_goal_reviewer()
      |> Steps.visit_review_page()
      |> Steps.assert_no_goal_update_reviews_are_listed()
    end

    feature "closing a project removes the check-in from the review page", ctx do
      ctx
      |> Steps.given_there_are_due_project_check_ins()
      |> Steps.visit_review_page()
      |> Steps.assert_the_due_project_is_listed()
      |> Steps.when_a_project_is_closed()
      |> Steps.assert_the_closed_project_is_no_longer_displayed()
      |> Steps.assert_all_catch_up()
    end

    feature "closing work removes reviewer obligations", ctx do
      ctx
      |> Steps.given_there_are_submitted_project_check_ins()
      |> Steps.given_there_are_submitted_goal_updates()
      |> Steps.visit_review_page()
      |> Steps.assert_due_project_check_in_review_is_listed()
      |> Steps.assert_due_goal_check_in_review_is_listed()
      |> Steps.when_a_project_is_closed()
      |> Steps.when_a_goal_is_closed()
      |> Steps.assert_the_acknowledged_project_is_no_longer_displayed()
      |> Steps.assert_the_acknowledged_goal_is_no_longer_displayed()
      |> Steps.assert_all_catch_up()
    end

    feature "deleting work removes reviewer obligations", ctx do
      ctx
      |> Steps.given_there_are_submitted_project_check_ins()
      |> Steps.given_there_are_submitted_goal_updates()
      |> Steps.visit_review_page()
      |> Steps.assert_due_project_check_in_review_is_listed()
      |> Steps.assert_due_goal_check_in_review_is_listed()
      |> Steps.when_a_project_is_deleted()
      |> Steps.when_a_goal_is_deleted()
      |> Steps.assert_the_acknowledged_project_is_no_longer_displayed()
      |> Steps.assert_the_acknowledged_goal_is_no_longer_displayed()
    end

    feature "projects with future start dates do not appear in review page", ctx do
      ctx
      |> Steps.given_there_is_a_project_with_future_start_date()
      |> Steps.visit_review_page()
      |> Steps.assert_future_project_is_not_listed()
      |> Steps.assert_zero_state_message()
    end
  end
end
