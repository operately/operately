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

  step :given_project_and_goal_with_other_reviewer_exists, ctx do
    ctx
    |> Factory.add_goal(:goal_3, :product, [reviewer: :john, name: "Goal Tres"])
    |> Factory.add_project(:project_omega, :product, [reviewer: :john, name: "Project Omega"])
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

  step :given_goal_update_exist, ctx do
    ctx
    |> Factory.add_goal_update(:update, :goal_1, :john)
  end

  step :given_project_check_in_exist, ctx do
    ctx = Factory.add_project_check_in(ctx, :check_in, :project_alpha, :creator)

    {:ok, _} = Operately.Projects.update_project(ctx.project_alpha, %{last_check_in_id: ctx.check_in.id})

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

  step :select_reviewed_by_me_filter, ctx do
    ctx
    |> UI.click(testid: "view-options")
    |> UI.click(testid: "reviewedBy-me")
    |> UI.click(testid: "submit")
  end

  step :open_status_pop_up, ctx, attrs do
    testid = cond do
      Map.has_key?(attrs, :goal) -> UI.testid(["status", Paths.goal_id(attrs.goal)])
      Map.has_key?(attrs, :project) -> UI.testid(["status", Paths.goal_id(attrs.project)])
    end

    ctx
    |> UI.click(testid: testid)
  end

  step :assert_goal_update_content, ctx do
    ctx
    |> UI.assert_text("1. How's the goal going?")
    |> UI.assert_text("On Track")
    |> UI.assert_text("Work is progressing as planned")
    |> UI.assert_text("2. What's new since the last update?")
    |> UI.assert_text("3. Success conditions")
  end

  step :assert_project_check_in_content, ctx do
    ctx
    |> UI.assert_text("1. How's the project going?")
    |> UI.assert_text("On Track")
    |> UI.assert_text("Work is progressing as planned")
    |> UI.assert_text("2. What's new since the last check-in?")
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
