defmodule Operately.Support.Features.GoalTreeSteps do
  use Operately.FeatureCase

  alias Operately.Support.Factory

  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:product)
    |> Factory.add_goal(:goal_1, :product, [name: "Goal Uno"])
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
end
