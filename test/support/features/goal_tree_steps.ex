defmodule Operately.Support.Features.GoalTreeSteps do
  use Operately.FeatureCase

  alias Operately.Support.{Factory, RichText}

  step :given_goals_and_projects_exist, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:product)
    |> Factory.add_space_member(:john, :product)
    |> Factory.add_goal(:goal_1, :product, [champion: :john, name: "Goal Uno"])
    |> Factory.add_goal(:goal_2, :product, [reviewer: :john, name: "Goal Dos", parent_goal: :goal_1])
    |> Factory.add_project(:project_alpha, :product, [goal: :goal_1, name: "Project Alpha"])
    |> Factory.add_project(:project_beta, :product, [goal: :goal_1, name: "Project Beta"])
    |> then(fn ctx -> UI.login_as(ctx, ctx.creator) end)
  end

  step :given_project_is_paused, ctx, project do
    Operately.Operations.ProjectPausing.run(ctx.creator, project)
    ctx
  end

  step :given_project_is_closed, ctx, project do
    Operately.Projects.Project.changeset(project, %{status: "closed"})
    |> Repo.update()
    ctx
  end

  step :given_goal_is_closed, ctx, goal do
    Operately.Operations.GoalClosing.run(ctx.creator, goal, "success", RichText.rich_text("text", :as_string))
    ctx
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

  step :visit_goals_v2_page, ctx do
    ctx
    |> UI.visit(Paths.goals_path(ctx.company) <> "-v2")
  end

  step :click_show_completed, ctx do
    UI.click(ctx, testid: "show-hide-completed")
  end

  step :assert_project_visible, ctx, id do
    UI.assert_text(ctx, ctx[id].name)
  end

  step :refute_project_visible, ctx, id do
    UI.refute_text(ctx, ctx[id].name)
  end

  step :assert_goal_visible, ctx, id do
    UI.assert_text(ctx, ctx[id].name)
  end

  step :refute_goal_visible, ctx, id do
    UI.refute_text(ctx, ctx[id].name)
  end

  step :collapse_goal, ctx, goal do
    id = Paths.goal_id(goal)

    ctx
    |> UI.click(testid: UI.testid(["toggle-node", id]))
  end

  step :expand_goal, ctx, goal do
    id = Paths.goal_id(goal)

    ctx
    |> UI.click(testid: UI.testid(["toggle-node", id]))
  end

  step :click_expand_all, ctx do
    ctx
    |> UI.click(testid: "collapse-expand-all")
  end

  step :click_collapse_all, ctx do
    ctx
    |> UI.click(testid: "collapse-expand-all")
  end

  step :expand_goal_success_conditions, ctx, goal do
    testid = UI.testid(["toggle-goal", Paths.goal_id(goal)])

    ctx
    |> UI.click(testid: testid)
  end

  step :collapse_goal_success_conditions, ctx, goal do
    testid = UI.testid(["toggle-goal", Paths.goal_id(goal)])

    ctx
    |> UI.click(testid: testid)
  end

  step :toggle_active_filter, ctx do
    ctx
    |> UI.click(testid: "view-options")
    |> UI.click(testid: "filters-active")
    |> UI.click(testid: "submit")
  end

  step :toggle_paused_filter, ctx do
    ctx
    |> UI.click(testid: "view-options")
    |> UI.click(testid: "filters-paused")
    |> UI.click(testid: "submit")
  end

  step :toggle_completed_filter, ctx do
    ctx
    |> UI.click(testid: "view-options")
    |> UI.click(testid: "filters-completed")
    |> UI.click(testid: "submit")
  end

  step :select_owned_by_me_filter, ctx do
    ctx
    |> UI.click(testid: "view-options")
    |> UI.click(testid: "ownedBy-me")
    |> UI.click(testid: "submit")
  end

  step :assert_goal_success_conditions_are_visible, ctx do
    ctx
    |> UI.assert_text("First response time")
    |> UI.assert_text("Increase feedback score to 90%")
  end

  step :assert_goal_success_conditions_are_hidden, ctx do
    ctx
    |> UI.refute_text("First response time")
    |> UI.refute_text("Increase feedback score to 90%")
  end

  step :assert_goal_success_conditions_are_hidden_by_default, ctx do
    ctx
    |> UI.refute_text("First response time")
    |> UI.refute_text("Increase feedback score to 90%")
  end

  step :assert_all_goals_and_projects_are_visible_by_default, ctx do
    ctx
    |> UI.assert_text(ctx[:project_alpha].name)
    |> UI.assert_text(ctx[:project_beta].name)
    |> UI.assert_text(ctx[:goal_1].name)
    |> UI.assert_text(ctx[:goal_2].name)
  end

  step :assert_subgoals_and_projects_are_visible, ctx do
    ctx
    |> UI.assert_text(ctx[:project_alpha].name)
    |> UI.assert_text(ctx[:project_beta].name)
    |> UI.assert_text(ctx[:goal_2].name)
  end

  step :assert_subgoals_and_projects_are_hidden, ctx do
    ctx
    |> UI.refute_text(ctx[:project_alpha].name)
    |> UI.refute_text(ctx[:project_beta].name)
    |> UI.refute_text(ctx[:goal_2].name)
  end

  step :assert_paused_project_hidden, ctx, project do
    ctx
    |> UI.refute_text(project.name)
  end

  step :assert_closed_project_hidden, ctx, project do
    ctx
    |> UI.refute_text(project.name)
  end

  step :assert_closed_goal_hidden, ctx, goal do
    ctx
    |> UI.refute_text(goal.name)
  end
end
