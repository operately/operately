defmodule Operately.Features.GoalTreeTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.GoalTreeSteps, as: Steps

  setup ctx do
    ctx
    |> Steps.given_goals_and_projects_exist()
  end

  feature "show/hide completed projects", ctx do
    ctx
    |> Steps.close_project(:project_beta)
    |> Steps.visit_goal_tree_page()
    |> Steps.refute_project_visible(:project_beta)
    |> Steps.click_show_completed()
    |> Steps.assert_project_visible(:project_beta)
  end

  feature "expand/collapse goal's children", ctx do
    ctx
    |> Steps.visit_goals_v2_page()
    |> Steps.assert_all_goals_and_projects_are_visible_by_default()
    |> Steps.collapse_goal(ctx.goal_1)
    |> Steps.assert_subgoals_and_projects_are_hidden()
    |> Steps.expand_goal(ctx.goal_1)
    |> Steps.assert_subgoals_and_projects_are_visible()
  end

  feature "expand/collapse all goals", ctx do
    ctx
    |> Steps.visit_goals_v2_page()
    |> Steps.assert_all_goals_and_projects_are_visible_by_default()
    |> Steps.click_collapse_all()
    |> Steps.assert_subgoals_and_projects_are_hidden()
    |> Steps.click_expand_all()
    |> Steps.assert_subgoals_and_projects_are_visible()
  end

  feature "expand/collapse goal's success conditions", ctx do
    ctx
    |> Steps.visit_goals_v2_page()
    |> Steps.assert_goal_success_conditions_are_hidden_by_default()
    |> Steps.expand_goal_success_conditions(ctx.goal_1)
    |> Steps.assert_goal_success_conditions_are_visible()
    |> Steps.collapse_goal_success_conditions(ctx.goal_1)
    |> Steps.assert_goal_success_conditions_are_hidden()
  end

  describe "filter goals and projects" do
    feature "active projects", ctx do
      ctx
      |> Steps.visit_goals_v2_page()
      |> Steps.assert_all_goals_and_projects_are_visible_by_default()
      |> Steps.toggle_active_filter()
      |> Steps.refute_project_visible(:project_alpha)
      |> Steps.refute_project_visible(:project_beta)
      |> Steps.toggle_active_filter()
      |> Steps.assert_project_visible(:project_alpha)
      |> Steps.assert_project_visible(:project_beta)
    end

    feature "paused projects", ctx do
      ctx
      |> Steps.given_project_is_paused(ctx.project_beta)
      |> Steps.visit_goals_v2_page()
      |> Steps.assert_paused_project_hidden(ctx.project_beta)
      |> Steps.toggle_paused_filter()
      |> Steps.assert_project_visible(:project_beta)
      |> Steps.toggle_paused_filter()
      |> Steps.assert_paused_project_hidden(ctx.project_beta)
    end

    feature "completed goals and projects", ctx do
      ctx
      |> Steps.given_goal_is_closed(ctx.goal_2)
      |> Steps.given_project_is_closed(ctx.project_beta)
      |> Steps.visit_goals_v2_page()
      |> Steps.assert_closed_goal_hidden(ctx.goal_2)
      |> Steps.assert_closed_project_hidden(ctx.project_beta)
      |> Steps.toggle_completed_filter()
      |> Steps.assert_goal_visible(:goal_2)
      |> Steps.assert_project_visible(:project_beta)
      |> Steps.toggle_completed_filter()
      |> Steps.assert_closed_goal_hidden(ctx.goal_2)
      |> Steps.assert_closed_project_hidden(ctx.project_beta)
    end

    feature "owned by", ctx do
      ctx
      |> Steps.visit_goals_v2_page()
      |> Steps.assert_all_goals_and_projects_are_visible_by_default()
      |> Steps.select_owned_by_me_filter()
      |> Steps.refute_goal_visible(:goal_1)
      |> Steps.assert_goal_visible(:goal_2)
      |> Steps.assert_project_visible(:project_alpha)
      |> Steps.assert_project_visible(:project_beta)
    end
  end
end
