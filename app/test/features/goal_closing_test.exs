defmodule Operately.Features.GoalClosingTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.GoalClosingSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "closing a goal correctly filters out closed projects from active projects warning", ctx do
    ctx
    |> Steps.given_goal_with_projects_exists()
    |> Steps.close_some_projects()
    |> Steps.visit_goal_closing_page()
    |> Steps.assert_closed_projects_not_shown_in_warning()
    |> Steps.assert_active_projects_shown_in_warning()
  end

  feature "closing a goal with all projects closed shows no active projects warning", ctx do
    ctx
    |> Steps.given_goal_with_projects_exists()
    |> Steps.close_all_projects()
    |> Steps.visit_goal_closing_page()
    |> Steps.assert_no_active_projects_warning()
  end

  feature "closing a goal with no projects shows no active projects warning", ctx do
    ctx
    |> Steps.given_goal_with_no_projects_exists()
    |> Steps.visit_goal_closing_page()
    |> Steps.assert_no_active_projects_warning()
  end
end