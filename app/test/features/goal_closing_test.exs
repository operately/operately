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

  feature "closing goal moves it to Completed tab in Work Map", ctx do
    ctx
    |> Steps.given_goal_with_no_projects_exists()
    |> Steps.assert_open_goal_in_all_work_tab_in_work_map()
    |> Steps.assert_open_goal_in_goals_tab_in_work_map()
    |> Steps.refute_open_goal_in_completed_tab_in_work_map()
    |> Steps.visit_goal_page()
    |> Steps.close_goal()
    |> Steps.assert_closed_goal_in_completed_tab_in_work_map()
    |> Steps.refute_closed_goal_in_all_work_tab_in_work_map()
    |> Steps.refute_closed_goal_in_goals_tab_in_work_map()
  end

  feature "reopening a goal moves it to All Work and Goals tabs in Work Map", ctx do
    ctx
    |> Steps.given_closed_goal_exists()
    |> Steps.assert_closed_goal_in_completed_tab_in_work_map()
    |> Steps.refute_closed_goal_in_all_work_tab_in_work_map()
    |> Steps.refute_closed_goal_in_goals_tab_in_work_map()
    |> Steps.visit_goal_page()
    |> Steps.reopen_goal()
    |> Steps.assert_open_goal_in_all_work_tab_in_work_map()
    |> Steps.assert_open_goal_in_goals_tab_in_work_map()
    |> Steps.refute_open_goal_in_completed_tab_in_work_map()
  end

  feature "goal is successfully reopened", ctx do
    ctx
    |> Steps.given_closed_goal_exists()
    |> Steps.visit_goal_page()
    |> Steps.assert_goal_is_closed()
    |> Steps.reopen_goal()
    |> Steps.assert_goal_is_reopened()
  end
end
