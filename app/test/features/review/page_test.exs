defmodule Operately.Features.Review.PageTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ReviewSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  describe "review page" do
    feature "viewing the review page with no due items", ctx do
      ctx
      |> Steps.visit_review_page()
      |> Steps.assert_zero_state_message()
    end

    feature "viewing and submitting due project check-ins", ctx do
      ctx
      |> Steps.given_there_are_due_project_check_ins()
      |> Steps.visit_review_page()
      |> Steps.assert_the_due_project_is_listed()
      |> Steps.when_a_project_check_in_is_submitted()
      |> Steps.assert_the_checked_in_project_is_no_longer_displayed()
      |> Steps.assert_all_catch_up()
    end

    feature "viewing and completing due milestones", ctx do
      ctx
      |> Steps.given_there_are_due_milestones()
      |> Steps.visit_review_page()
      |> Steps.assert_the_due_milestone_is_listed()
      |> Steps.when_a_milestone_is_marked_as_completed()
      |> Steps.assert_completed_milestone_is_no_longer_displayed()
      |> Steps.assert_all_catch_up()
    end

    feature "viewing and completing due tasks", ctx do
      ctx
      |> Steps.given_there_are_due_tasks()
      |> Steps.visit_review_page()
      |> Steps.assert_due_task_is_listed()
      |> Steps.when_task_is_marked_as_completed()
      |> Steps.assert_completed_task_is_no_longer_displayed()
    end

    feature "viewing and completing due space tasks", ctx do
      ctx
      |> Steps.given_there_are_due_space_tasks()
      |> Steps.visit_review_page()
      |> Steps.assert_due_space_task_is_listed()
      |> Steps.when_space_task_is_marked_as_completed()
      |> Steps.assert_completed_space_task_is_no_longer_displayed()
    end

    feature "viewing and submitting due goal updates", ctx do
      ctx
      |> Steps.given_there_are_due_goal_updates()
      |> Steps.visit_review_page()
      |> Steps.assert_the_due_goal_is_listed()
      |> Steps.when_a_goal_update_is_submitted()
      |> Steps.assert_the_updated_goal_is_no_longer_displayed()
      |> Steps.assert_all_catch_up()
    end

    feature "viewing and acknowledging submitted project check-ins", ctx do
      ctx
      |> Steps.given_there_are_submitted_project_check_ins()
      |> Steps.visit_review_page()
      |> Steps.assert_due_project_check_in_review_is_listed()
      |> Steps.when_a_project_check_in_is_acknowledged()
      |> Steps.assert_the_acknowledged_project_is_no_longer_displayed()
    end

    feature "viewing and acknowledging submitted goal updates", ctx do
      ctx
      |> Steps.given_there_are_submitted_goal_updates()
      |> Steps.visit_review_page()
      |> Steps.assert_due_goal_check_in_review_is_listed()
      |> Steps.when_a_goal_update_is_acknowledged()
      |> Steps.assert_the_acknowledged_goal_is_no_longer_displayed()
    end
  end
end
