defmodule Operately.Features.Review.CounterTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ReviewSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  describe "navbar review counter" do
    feature "acknowledging items updates counter", ctx do
      ctx
      |> Steps.given_there_are_due_project_check_ins()
      |> Steps.given_there_are_due_goal_updates()
      |> Steps.given_there_are_submitted_project_check_ins()
      |> Steps.given_there_are_submitted_goal_updates()
      |> Steps.given_there_is_a_project_retrospective_pending_acknowledgement()
      |> Steps.visit_review_page()
      |> Steps.assert_the_review_item_count(is: 5)
      |> Steps.when_a_project_check_in_is_acknowledged()
      |> Steps.assert_the_review_item_count(is: 4)
      |> Steps.visit_review_page()
      |> Steps.when_a_goal_update_is_acknowledged()
      |> Steps.assert_the_review_item_count(is: 3)
      |> Steps.visit_review_page()
      |> Steps.when_a_project_retrospective_is_acknowledged()
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

    feature "completing space tasks updates counter", ctx do
      ctx
      |> Steps.given_there_are_due_space_tasks()
      |> Steps.visit_review_page()
      |> Steps.assert_the_review_item_count(is: 1)
      |> Steps.when_space_task_is_marked_as_completed()
      |> Steps.assert_the_review_item_count(is: 0)
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
