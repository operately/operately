defmodule Operately.Features.ReviewTest do
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
      |> Steps.assert_the_due_project_is_listed()
      |> Steps.when_a_project_check_in_is_submitted()
      |> Steps.assert_the_checked_in_project_is_no_longer_displayed()
    end

    feature "viewing and submitting due goal updates", ctx do
      ctx
      |> Steps.given_there_are_due_goal_updates()
      |> Steps.assert_the_due_goal_is_listed()
      |> Steps.when_a_goal_update_is_submitted()
      |> Steps.assert_the_updated_goal_is_no_longer_displayed()
    end

    feature "viewing and acknowledging submitted project check-ins", ctx do
      ctx
      |> Steps.given_there_are_submitted_project_check_ins()
      |> Steps.assert_the_submitted_project_is_listed()
      |> Steps.when_a_project_check_in_is_acknowledged()
      |> Steps.assert_the_acknowledged_project_is_no_longer_displayed()
    end

    feature "viewing and acknowledging submitted goal updates", ctx do
      ctx
      |> Steps.given_there_are_submitted_goal_updates()
      |> Steps.assert_the_submitted_goal_is_listed()
      |> Steps.when_a_goal_update_is_acknowledged()
      |> Steps.assert_the_acknowledged_goal_is_no_longer_displayed()
    end

    feature "review item counter", ctx do
      ctx
      |> Steps.given_there_are_due_project_check_ins()
      |> Steps.given_there_are_due_goal_updates()
      |> Steps.given_there_are_submitted_project_check_ins()
      |> Steps.given_there_are_submitted_goal_updates()
      |> Steps.assert_the_review_item_count(is: 4)
      |> Steps.when_a_project_check_in_is_acknowledged()
      |> Steps.assert_the_review_item_count(is: 3)
    end

    feature "closing a project removes the check-in from the review page", ctx do
      ctx
      |> Steps.given_there_are_due_project_check_ins()
      |> Steps.assert_the_due_project_is_listed()
      |> Steps.when_a_project_is_closed()
      |> Steps.assert_the_closed_project_is_no_longer_displayed()
    end
  end

  describe "review page v2" do
    setup ctx, do: Factory.enable_feature(ctx, "review_v2")

    feature "viewing the review page with no due items", ctx do
      ctx
      |> Steps.visit_review_page()
      |> Steps.assert_zero_state_message(:v2)
    end

    feature "viewing and submitting due project check-ins", ctx do
      ctx
      |> Steps.given_there_are_due_project_check_ins()
      |> Steps.visit_review_page()
      |> Steps.assert_the_due_project_is_listed(:v2)
      |> Steps.when_a_project_check_in_is_submitted()
      |> Steps.assert_the_checked_in_project_is_no_longer_displayed(:v2)
    end

    feature "viewing and completing due milestones", ctx do
      ctx
      |> Steps.given_there_are_due_milestones()
      |> Steps.visit_review_page()
      |> Steps.assert_the_due_milestone_is_listed()
      |> Steps.when_a_milestone_is_marked_as_completed()
      |> Steps.assert_completed_milestone_is_no_longer_displayed()
    end

    feature "viewing and completing due tasks", ctx do
      ctx
      |> Steps.given_there_are_due_tasks()
      |> Steps.visit_review_page()
      |> Steps.assert_due_task_is_listed()
      |> Steps.when_task_is_marked_as_completed()
      |> Steps.assert_completed_task_is_no_longer_displayed()
    end

    feature "viewing and submitting due goal updates", ctx do
      ctx
      |> Steps.given_there_are_due_goal_updates()
      |> Steps.visit_review_page()
      |> Steps.assert_the_due_goal_is_listed(:v2)
      |> Steps.when_a_goal_update_is_submitted()
      |> Steps.assert_the_updated_goal_is_no_longer_displayed(:v2)
    end

    feature "viewing and acknowledging submitted project check-ins", ctx do
      ctx
      |> Steps.given_there_are_submitted_project_check_ins()
      |> Steps.visit_review_page()
      |> Steps.assert_due_project_check_in_review_is_listed()
      |> Steps.when_a_project_check_in_is_acknowledged()
      |> Steps.assert_the_acknowledged_project_is_no_longer_displayed(:v2)
    end

    feature "viewing and acknowledging submitted goal updates", ctx do
      ctx
      |> Steps.given_there_are_submitted_goal_updates()
      |> Steps.visit_review_page()
      |> Steps.assert_due_goal_check_in_review_is_listed()
      |> Steps.when_a_goal_update_is_acknowledged()
      |> Steps.assert_the_acknowledged_goal_is_no_longer_displayed(:v2)
    end

    feature "review item counter", ctx do
      ctx
      |> Steps.given_there_are_due_project_check_ins()
      |> Steps.given_there_are_due_goal_updates()
      |> Steps.given_there_are_submitted_project_check_ins()
      |> Steps.given_there_are_submitted_goal_updates()
      |> Steps.assert_the_review_item_count(is: 4)
      |> Steps.when_a_project_check_in_is_acknowledged()
      |> Steps.assert_the_review_item_count(is: 3)
    end

    feature "closing a project removes the check-in from the review page", ctx do
      ctx
      |> Steps.given_there_are_due_project_check_ins()
      |> Steps.visit_review_page()
      |> Steps.assert_the_due_project_is_listed(:v2)
      |> Steps.when_a_project_is_closed()
      |> Steps.assert_the_closed_project_is_no_longer_displayed(:v2)
    end
  end
end
