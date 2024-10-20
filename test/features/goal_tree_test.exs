defmodule Operately.Features.GoalTreeTest do
  use Operately.FeatureCase

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
end
