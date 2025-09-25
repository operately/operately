defmodule Operately.Features.ReviewTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ReviewSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

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

  feature "paused projects appear in My Work section", ctx do
    ctx
    |> Steps.given_there_are_paused_project_check_ins()
    |> Steps.assert_the_paused_project_is_listed()
  end

  feature "paused project check-ins can be submitted", ctx do
    ctx
    |> Steps.given_there_are_paused_project_check_ins()
    |> Steps.when_a_paused_project_check_in_is_submitted()
    |> Steps.assert_the_checked_in_project_is_no_longer_displayed()
  end

end
