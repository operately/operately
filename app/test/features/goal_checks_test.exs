defmodule Operately.Features.GoalChecksTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.GoalChecksSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "listing existing goal checks", ctx do
    ctx
    |> Steps.given_goal_has_multiple_checks()
    |> Steps.visit_goal_page()
    |> Steps.assert_goal_checks_listed()
  end

  feature "adding a new goal check", ctx do
    ctx
    |> Steps.visit_goal_page()
    |> Steps.add_goal_check()
    |> Steps.assert_goal_check_added()
    |> Steps.assert_check_added_feed_posted()
  end

  feature "deleting a goal check", ctx do
    ctx
    |> Steps.given_a_check_exists()
    |> Steps.visit_goal_page()
    |> Steps.delete_goal_check()
    |> Steps.assert_goal_check_deleted()
    |> Steps.assert_check_removing_feed_posted()
  end

  feature "updating a goal check", ctx do
    ctx
    |> Steps.given_a_check_exists()
    |> Steps.visit_goal_page()
    |> Steps.update_goal_check()
    |> Steps.assert_goal_check_updated()
  end

  feature "toggling a goal check", ctx do
    ctx
    |> Steps.given_a_check_exists()
    |> Steps.visit_goal_page()
    |> Steps.toggle_goal_check()
    |> Steps.assert_check_completed()
    |> Steps.toggle_goal_check()
    |> Steps.assert_check_pending()
    |> Steps.assert_check_completed_feed_posted()
    |> Steps.assert_check_pending_feed_posted()
  end
end
