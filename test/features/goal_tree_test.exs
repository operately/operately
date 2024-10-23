defmodule Operately.Features.GoalTreeTest do
  use Operately.FeatureCase

  alias Operately.Support.RichText
  alias Operately.Support.Features.GoalTreeSteps, as: Steps

  setup ctx do
    {:ok, Steps.setup(ctx)}
  end

  feature "show/hide completed projects", ctx do
    ctx
    |> Steps.close_project(:project_beta)
    |> Steps.visit_goal_tree_page()
    |> Steps.refute_project_visible(:project_beta)
    |> Steps.click_show_completed()
    |> Steps.assert_project_visible(:project_beta)
  end

  feature "expand/collapse node's children", ctx do
    ctx
    |> Steps.visit_goals_v2_tmp()
    |> Steps.assert_project_visible(:project_alpha)
    |> Steps.assert_project_visible(:project_beta)
    |> Steps.expand_collapse_node(id: Paths.goal_id(ctx.goal_1))
    |> Steps.refute_project_visible(:project_alpha)
    |> Steps.refute_project_visible(:project_beta)
    |> Steps.expand_collapse_node(id: Paths.goal_id(ctx.goal_1))
    |> Steps.assert_project_visible(:project_alpha)
    |> Steps.assert_project_visible(:project_beta)
  end

  feature "expand/collapse all nodes", ctx do
    ctx
    |> Steps.visit_goals_v2_tmp()
    |> Steps.assert_project_visible(:project_alpha)
    |> Steps.assert_project_visible(:project_beta)
    |> Steps.expand_collapse_all_nodes()
    |> Steps.refute_project_visible(:project_alpha)
    |> Steps.refute_project_visible(:project_beta)
  end

  feature "expand/collapse goal's success conditions", ctx do
    ctx
    |> Steps.visit_goals_v2_tmp()
    |> Steps.refute_goal_success_conditions_visible()
    |> Steps.expand_collapse_goal(:goal_1)
    |> Steps.assert_goal_success_conditions_visible()
    |> Steps.expand_collapse_goal(:goal_1)
    |> Steps.refute_goal_success_conditions_visible()
  end

  feature "filter goals and projects", ctx do
    Operately.Operations.ProjectPausing.run(ctx.creator, ctx.project_beta)
    Operately.Operations.GoalClosing.run(ctx.creator, ctx.goal_2, "success", RichText.rich_text("text", :as_string))

    ctx
    |> Steps.visit_goals_v2_tmp()
    |> Steps.assert_project_visible(:project_alpha)
    |> Steps.refute_project_visible(:project_beta)
    |> Steps.refute_project_visible(:goal_2)
    |> Steps.show_filter_options()
    |> Steps.apply_filter(["filters-paused"])
    |> Steps.assert_project_visible(:project_alpha)
    |> Steps.assert_project_visible(:project_beta)
    |> Steps.show_filter_options()
    |> Steps.apply_filter(["filters-active", "filters-paused"])
    |> Steps.refute_project_visible(:project_alpha)
    |> Steps.refute_project_visible(:project_beta)
    |> Steps.show_filter_options()
    |> Steps.apply_filter(["filters-active", "filters-paused", "filters-completed"])
    |> Steps.assert_project_visible(:project_alpha)
    |> Steps.assert_project_visible(:project_beta)
    |> Steps.assert_project_visible(:goal_2)
    |> Steps.show_filter_options()
    |> Steps.apply_filter(["ownedBy-me"])
    |> Steps.refute_project_visible(:goal_1)
    |> Steps.show_filter_options()
    |> Steps.apply_filter(["ownedBy-anyone", "reviewedBy-me"])
    |> Steps.assert_project_visible(:goal_1)
    |> Steps.refute_project_visible(:goal_2)
  end
end
