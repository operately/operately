defmodule Operately.Features.GoalTreeTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.GoalTreeSteps, as: Steps

  setup ctx do
    ctx
    |> Steps.given_goals_and_projects_exist()
  end

  feature "expand/collapse goal's children", ctx do
    ctx
    |> Steps.visit_goal_tree_page()
    |> Steps.assert_all_goals_and_projects_are_visible_by_default()
    |> Steps.collapse_goal(ctx.goal_1)
    |> Steps.assert_subgoals_and_projects_are_hidden()
    |> Steps.expand_goal(ctx.goal_1)
    |> Steps.assert_subgoals_and_projects_are_visible()
  end

  feature "expand/collapse all goals", ctx do
    ctx
    |> Steps.visit_goal_tree_page()
    |> Steps.assert_all_goals_and_projects_are_visible_by_default()
    |> Steps.click_collapse_all()
    |> Steps.assert_subgoals_and_projects_are_hidden()
    |> Steps.click_expand_all()
    |> Steps.assert_subgoals_and_projects_are_visible()
  end

  feature "display goal's last update", ctx do
    ctx
    |> Steps.given_goal_update_exist()
    |> Steps.visit_goal_tree_page()
    |> Steps.open_status_pop_up(%{goal: ctx.goal_1})
    |> Steps.assert_goal_update_content()
  end

  feature "display project's last update", ctx do
    ctx
    |> Steps.given_project_check_in_exist()
    |> Steps.visit_goal_tree_page()
    |> Steps.open_status_pop_up(%{project: ctx.project_alpha})
    |> Steps.assert_project_check_in_content()
  end

  feature "display if closed goal was accomplished", ctx do
    ctx
    |> Steps.given_goal_is_closed_as_accomplished(:goal_1)
    |> Steps.visit_goal_tree_page()
    |> Steps.assert_goal_accomplished_status()
  end

  feature "display if closed goal was not accomplished", ctx do
    ctx
    |> Steps.given_goal_is_closed_as_not_accomplished(:goal_1)
    |> Steps.visit_goal_tree_page()
    |> Steps.assert_goal_not_accomplished_status()
  end

  feature "show only goals", ctx do
    ctx
    |> Steps.visit_goal_tree_page()
    |> Steps.assert_all_goals_and_projects_are_visible_by_default()
    |> Steps.show_only_goals()
    |> Steps.assert_goal_visible(:goal_1)
    |> Steps.refute_project_visible(:project_alpha)
  end

  feature "show only projects", ctx do
    ctx
    |> Steps.visit_goal_tree_page()
    |> Steps.assert_all_goals_and_projects_are_visible_by_default()
    |> Steps.show_only_projects()
    |> Steps.refute_goal_visible(:goal_1)
    |> Steps.assert_project_visible(:project_alpha)
  end

  describe "view options" do
    feature "filter active projects", ctx do
      ctx
      |> Steps.visit_goal_tree_page()
      |> Steps.assert_all_goals_and_projects_are_visible_by_default()
      |> Steps.toggle_active_filter()
      |> Steps.refute_project_visible(:project_alpha)
      |> Steps.refute_project_visible(:project_beta)
      |> Steps.toggle_active_filter()
      |> Steps.assert_project_visible(:project_alpha)
      |> Steps.assert_project_visible(:project_beta)
    end

    feature "filter paused projects", ctx do
      ctx
      |> Steps.given_project_is_paused(ctx.project_beta)
      |> Steps.visit_goal_tree_page()
      |> Steps.assert_paused_project_hidden(ctx.project_beta)
      |> Steps.toggle_paused_filter()
      |> Steps.assert_project_visible(:project_beta)
      |> Steps.toggle_paused_filter()
      |> Steps.assert_paused_project_hidden(ctx.project_beta)
    end

    feature "filter completed goals and projects", ctx do
      ctx
      |> Steps.given_goal_is_closed(:goal_2)
      |> Steps.given_project_is_closed(:project_beta)
      |> Steps.visit_goal_tree_page()
      |> Steps.assert_closed_goal_hidden(ctx.goal_2)
      |> Steps.assert_closed_project_hidden(ctx.project_beta)
      |> Steps.toggle_completed_filter()
      |> Steps.assert_goal_visible(:goal_2)
      |> Steps.assert_project_visible(:project_beta)
      |> Steps.toggle_completed_filter()
      |> Steps.assert_closed_goal_hidden(ctx.goal_2)
      |> Steps.assert_closed_project_hidden(ctx.project_beta)
    end

    feature "filter by my role = owner", ctx do
      ctx
      |> Steps.visit_goal_tree_page()
      |> Steps.assert_all_goals_and_projects_are_visible_by_default()
      |> Steps.select_owned_by_me_filter()
      |> Steps.assert_goal_visible(:goal_1)
      |> Steps.assert_goal_visible(:goal_2)
      |> Steps.assert_project_visible(:project_alpha)
      |> Steps.assert_project_visible(:project_beta)
    end

    feature "filter by my role = reviewer", ctx do
      ctx
      |> Steps.given_project_and_goal_with_other_reviewer_exists()
      |> Steps.visit_goal_tree_page()
      |> Steps.assert_goal_visible(:goal_3)
      |> Steps.assert_project_visible(:project_omega)
      |> Steps.select_reviewed_by_me_filter()
      |> Steps.refute_goal_visible(:goal_3)
      |> Steps.refute_project_visible(:project_omega)
    end

    feature "display default and compact view", ctx do
      ctx
      |> Steps.visit_goal_tree_page()
      |> Steps.assert_all_goals_and_projects_are_visible_by_default()
      |> Steps.assert_resources_details_visible_by_default()
      |> Steps.select_compact_density()
      |> Steps.assert_resources_details_hidden()
    end
  end

  describe "view options are saved to local storage" do
    feature "expand/collapse goal's children", ctx do
      ctx
      |> Steps.visit_goal_tree_page()
      |> Steps.assert_all_goals_and_projects_are_visible_by_default()
      |> Steps.collapse_goal(ctx.goal_1)
      |> Steps.assert_subgoals_and_projects_are_hidden()
      |> Steps.visit_goal_page(ctx.goal_1)
      |> Steps.visit_goal_tree_page()
      |> Steps.assert_subgoals_and_projects_are_hidden()
    end

    feature "active projects", ctx do
      ctx
      |> Steps.visit_goal_tree_page()
      |> Steps.assert_all_goals_and_projects_are_visible_by_default()
      |> Steps.toggle_active_filter()
      |> Steps.refute_project_visible(:project_alpha)
      |> Steps.refute_project_visible(:project_beta)
      |> Steps.visit_goal_page(ctx.goal_1)
      |> Steps.visit_goal_tree_page()
      |> Steps.refute_project_visible(:project_alpha)
      |> Steps.refute_project_visible(:project_beta)
    end

    feature "paused projects", ctx do
      ctx
      |> Steps.given_project_is_paused(ctx.project_beta)
      |> Steps.visit_goal_tree_page()
      |> Steps.assert_paused_project_hidden(ctx.project_beta)
      |> Steps.toggle_paused_filter()
      |> Steps.assert_project_visible(:project_beta)
      |> Steps.visit_goal_page(ctx.goal_1)
      |> Steps.visit_goal_tree_page()
      |> Steps.assert_project_visible(:project_beta)
    end

    feature "completed goals and projects", ctx do
      ctx
      |> Steps.given_goal_is_closed(:goal_2)
      |> Steps.given_project_is_closed(:project_beta)
      |> Steps.visit_goal_tree_page()
      |> Steps.assert_closed_goal_hidden(ctx.goal_2)
      |> Steps.assert_closed_project_hidden(ctx.project_beta)
      |> Steps.toggle_completed_filter()
      |> Steps.assert_goal_visible(:goal_2)
      |> Steps.assert_project_visible(:project_beta)
      |> Steps.visit_goal_page(ctx.goal_1)
      |> Steps.visit_goal_tree_page()
      |> Steps.assert_goal_visible(:goal_2)
      |> Steps.assert_project_visible(:project_beta)
    end

    feature "default and compact view", ctx do
      ctx
      |> Steps.visit_goal_tree_page()
      |> Steps.assert_all_goals_and_projects_are_visible_by_default()
      |> Steps.assert_resources_details_visible_by_default()
      |> Steps.select_compact_density()
      |> Steps.assert_resources_details_hidden()
      |> Steps.visit_goal_page(ctx.goal_1)
      |> Steps.visit_goal_tree_page()
      |> Steps.assert_resources_details_hidden()
    end
  end
end
