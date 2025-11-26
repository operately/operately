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

  describe "navbar review counter" do
    feature "acknowledging items updates counter", ctx do
      ctx
      |> Steps.given_there_are_due_project_check_ins()
      |> Steps.given_there_are_due_goal_updates()
      |> Steps.given_there_are_submitted_project_check_ins()
      |> Steps.given_there_are_submitted_goal_updates()
      |> Steps.visit_review_page()
      |> Steps.assert_the_review_item_count(is: 4)
      |> Steps.when_a_project_check_in_is_acknowledged()
      |> Steps.assert_the_review_item_count(is: 3)
      |> Steps.visit_review_page()
      |> Steps.when_a_goal_update_is_acknowledged()
      |> Steps.assert_the_review_item_count(is: 2)
    end

    feature "creating and deleting tasks updates counter", ctx do
      today = DateTime.utc_now()

      ctx
      |> Steps.given_there_are_due_project_check_ins()
      |> Steps.visit_review_page()
      |> Steps.assert_the_review_item_count(is: 1)
      |> Steps.create_task(today)
      |> Steps.assert_the_review_item_count(is: 2)
      |> Steps.delete_task()
      |> Steps.assert_the_review_item_count(is: 1)
    end

    feature "changing task assignee updates counter", ctx do
      ctx
      |> Steps.given_there_are_due_project_check_ins()
      |> Steps.given_there_are_tasks_without_assignee()
      |> Steps.visit_review_page()
      |> Steps.assert_the_review_item_count(is: 1)
      |> Steps.change_task_assignee()
      |> Steps.assert_the_review_item_count(is: 2)
      |> Steps.clear_task_assignee()
      |> Steps.assert_the_review_item_count(is: 1)
    end

    feature "changing task status updates counter", ctx do
      ctx
      |> Steps.given_there_are_due_project_check_ins()
      |> Steps.given_there_are_due_tasks()
      |> Steps.visit_review_page()
      |> Steps.assert_the_review_item_count(is: 2)
      |> Steps.mark_task_as_completed()
      |> Steps.assert_the_review_item_count(is: 1)
      |> Steps.mark_task_as_not_started()
      |> Steps.assert_the_review_item_count(is: 2)
      |> Steps.mark_task_as_canceled()
      |> Steps.assert_the_review_item_count(is: 1)
    end

    feature "creating and deleting milestones updates counter", ctx do
      today = DateTime.utc_now()

      ctx
      |> Steps.given_there_are_due_project_check_ins()
      |> Steps.visit_review_page()
      |> Steps.assert_the_review_item_count(is: 1)
      |> Steps.create_milestone(today)
      |> Steps.assert_the_review_item_count(is: 2)
      |> Steps.delete_milestone()
      |> Steps.assert_the_review_item_count(is: 1)
    end

    feature "completing milestone updates counter", ctx do
      ctx
      |> Steps.given_there_are_due_project_check_ins()
      |> Steps.given_there_are_due_milestones()
      |> Steps.visit_review_page()
      |> Steps.assert_the_review_item_count(is: 2)
      |> Steps.complete_milestone()
      |> Steps.assert_the_review_item_count(is: 1)
    end
  end
end
