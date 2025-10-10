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
      |> Steps.visit_review_page()
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

    feature "closing work removes reviewer obligations", ctx do
      ctx
      |> Steps.given_there_are_submitted_project_check_ins()
      |> Steps.given_there_are_submitted_goal_updates()
      |> Steps.visit_review_page()
      |> Steps.assert_the_submitted_project_is_listed()
      |> Steps.assert_the_submitted_goal_is_listed()
      |> Steps.when_a_project_is_closed()
      |> Steps.when_a_goal_is_closed()
      |> Steps.assert_the_acknowledged_project_is_no_longer_displayed()
      |> Steps.assert_the_acknowledged_goal_is_no_longer_displayed()
    end

    feature "deleting work removes reviewer obligations", ctx do
      ctx
      |> Steps.given_there_are_submitted_project_check_ins()
      |> Steps.given_there_are_submitted_goal_updates()
      |> Steps.visit_review_page()
      |> Steps.assert_the_submitted_project_is_listed()
      |> Steps.assert_the_submitted_goal_is_listed()
      |> Steps.when_a_project_is_deleted()
      |> Steps.when_a_goal_is_deleted()
      |> Steps.assert_the_acknowledged_project_is_no_longer_displayed()
      |> Steps.assert_the_acknowledged_goal_is_no_longer_displayed()
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

    feature "closing a project removes the check-in from the review page", ctx do
      ctx
      |> Steps.given_there_are_due_project_check_ins()
      |> Steps.visit_review_page()
      |> Steps.assert_the_due_project_is_listed(:v2)
      |> Steps.when_a_project_is_closed()
      |> Steps.assert_the_closed_project_is_no_longer_displayed(:v2)
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
      |> Steps.assert_the_acknowledged_project_is_no_longer_displayed(:v2)
      |> Steps.assert_the_acknowledged_goal_is_no_longer_displayed(:v2)
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
      |> Steps.assert_the_acknowledged_project_is_no_longer_displayed(:v2)
      |> Steps.assert_the_acknowledged_goal_is_no_longer_displayed(:v2)
    end
  end

  describe "navbar review counter" do
    setup ctx, do: Factory.enable_feature(ctx, "review_v2")

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
      |> Steps.assert_the_review_item_count(is: 3)
      |> Steps.mark_task_as_completed()
      |> Steps.assert_the_review_item_count(is: 2)
      |> Steps.mark_task_as_not_started()
      |> Steps.assert_the_review_item_count(is: 3)
      |> Steps.mark_task_as_canceled()
      |> Steps.assert_the_review_item_count(is: 2)
    end

    feature "creating and deleting milestones updates counter", ctx do
      ctx
      |> Steps.given_there_are_due_project_check_ins()
      |> Steps.visit_review_page()
      |> Steps.assert_the_review_item_count(is: 1)
      |> Steps.create_milestone()
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
