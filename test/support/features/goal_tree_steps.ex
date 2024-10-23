defmodule Operately.Support.Features.GoalTreeSteps do
  use Operately.FeatureCase

  alias Operately.Support.Factory

  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:product)
    |> Factory.add_space_member(:john, :product)
    |> Factory.add_goal(:goal_1, :product, [champion: :john, name: "Goal Uno"])
    |> Factory.add_goal(:goal_2, :product, [reviewer: :john, name: "Goal Dos"])
    |> Factory.add_project(:project_alpha, :product, [goal: :goal_1, name: "Project Alpha"])
    |> Factory.add_project(:project_beta, :product, [goal: :goal_1, name: "Project Beta"])
    |> then(fn ctx -> UI.login_as(ctx, ctx.creator) end)
  end

  step :close_project, ctx, id do
    project = ctx[id]

    {:ok, project} = Operately.Projects.update_project(project, %{status: "closed"})

    Map.put(ctx, id, project)

    ctx
  end

  step :visit_goal_tree_page, ctx do
    UI.visit(ctx, Paths.goals_path(ctx.company))
  end

  step :refute_project_visible, ctx, id do
    UI.refute_text(ctx, ctx[id].name)
  end

  step :click_show_completed, ctx do
    UI.click(ctx, testid: "show-hide-completed")
  end

  step :assert_project_visible, ctx, id do
    UI.assert_text(ctx, ctx[id].name)
  end

  step :expand_collapse_node, ctx, id: id do
    testid = "toggle-node-" <> id |> String.downcase()

    ctx
    |> UI.click(testid: testid)
  end

  step :expand_collapse_all_nodes, ctx do
    ctx
    |> UI.click(testid: "collapse-expand-all")
  end

  step :show_filter_options, ctx do
    ctx
    |> UI.click(testid: "view-options")
  end

  step :expand_collapse_goal, ctx, goal_name do
    testid = "toggle-goal-" <> Paths.goal_id(ctx[goal_name]) |> String.downcase()

    ctx
    |> UI.click(testid: testid)
  end

  step :apply_filter, ctx, testids do
    testids
    |> Enum.reduce(ctx, fn testid, ctx ->
      UI.click(ctx, testid: testid)
    end)
    |> UI.click(testid: "submit")
  end

  step :assert_goal_success_conditions_visible, ctx do
    ctx
    |> UI.assert_text("First response time")
    |> UI.assert_text("Increase feedback score to 90%")
  end

  step :refute_goal_success_conditions_visible, ctx do
    ctx
    |> UI.refute_text("First response time")
    |> UI.refute_text("Increase feedback score to 90%")
  end
end
