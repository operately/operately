defmodule Operately.Support.Features.GoalCreationTestSteps do
  use Operately.FeatureCase

  alias Operately.Support.Features.EmailSteps
  alias Operately.Support.Factory

  import Ecto.Query, only: [from: 2]

  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:champion, :space)
    |> Factory.add_space_member(:reviewer, :space)
    |> Factory.log_in_person(:champion)
  end

  step :given_a_goal_exists, ctx, goal_params do
    ctx
    |> Factory.add_goal(:goal, :space, [name: goal_params.name, champion: :champion, reviewer: :reviewer, space: :space])
  end

  step :add_goal, ctx, goal_params do
    ctx
    |> UI.fill(testid: "goal-name", with: goal_params.name)
    |> UI.select_person_in(id: "champion-search", name: ctx.champion.full_name)
    |> UI.select_person_in(id: "reviewer-search", name: ctx.reviewer.full_name)
    |> UI.fill(testid: "target-0-name", with: goal_params.target_name)
    |> UI.fill(testid: "target-0-current", with: goal_params.from)
    |> UI.fill(testid: "target-0-target", with: goal_params.to)
    |> UI.fill(testid: "target-0-unit", with: goal_params.unit)
    |> UI.select(testid: "space-selector", option: ctx.space.name)
    |> then(fn ctx ->
      if Map.has_key?(goal_params, :parent_name) do
        ctx
        |> UI.click(testid: "goal-selector")
        |> UI.click(testid: UI.testid(["goal", goal_params.parent_name]))
      else
        ctx
      end
    end)
    |> UI.click(testid: "add-goal-button")
    |> UI.assert_has(testid: "goal-page")
  end

  step :initialize_goal_creation_from_goals_page_via_parent_goal, ctx, parent_goal_name do
    ctx
    |> UI.visit(Paths.goals_path(ctx.company))
    |> UI.hover(testid: "goal-#{UI.testid(parent_goal_name)}")
    |> UI.click(testid: "add-subgoal")
    |> UI.assert_has(testid: "goal-add-page")
  end

  step :initialize_goal_creation_from_global_goals_page, ctx do
    ctx
    |> UI.visit(Paths.goals_path(ctx.company))
    |> UI.click(testid: "add-options")
    |> UI.click(testid: "add-goal")
    |> UI.assert_has(testid: "goal-add-page")
  end

  step :initialize_goal_creation_from_global_new_navigation, ctx do
    ctx
    |> UI.click(testid: "new-dropdown")
    |> UI.click(testid: "new-dropdown-new-goal")
    |> UI.assert_has(testid: "goal-add-page")
  end

  step :assert_company_goal_added, ctx, %{name: name, target_name: target_name, from: current, to: target, unit: unit} do
    goal = Operately.Repo.one(from g in Operately.Goals.Goal, where: g.name == ^name, preload: [:targets])

    assert goal != nil
    assert goal.champion_id == ctx.champion.id
    assert goal.reviewer_id == ctx.reviewer.id
    assert goal.company_id == ctx.company.id
    assert goal.parent_goal_id == nil
    assert goal.group_id == ctx.space.id
    assert goal.targets != nil
    assert Enum.count(goal.targets) == 1
    assert Enum.at(goal.targets, 0).name == target_name
    assert Enum.at(goal.targets, 0).from == Float.parse(current) |> elem(0)
    assert Enum.at(goal.targets, 0).to == Float.parse(target) |> elem(0)
    assert Enum.at(goal.targets, 0).unit == unit

    ctx
    |> UI.visit(Paths.goals_path(ctx.company))
    |> UI.assert_text(name)
  end

  step :assert_company_goal_created_email_sent, ctx, goal_name do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.space.name,
      to: ctx.reviewer,
      author: ctx.champion,
      action: "added the #{goal_name} goal"
    })
  end

  step :assert_subgoal_added, ctx, goal_params do
    parent_goal = Operately.Repo.one(from g in Operately.Goals.Goal, where: g.name == ^goal_params.parent_name)
    goal = Operately.Repo.one(from g in Operately.Goals.Goal, where: g.name == ^goal_params.name, preload: [:targets])

    assert goal != nil
    assert goal.champion_id == ctx.champion.id
    assert goal.reviewer_id == ctx.reviewer.id
    assert goal.company_id == ctx.company.id
    assert goal.parent_goal_id == parent_goal.id
    assert goal.group_id == ctx.space.id
    assert goal.targets != nil
    assert Enum.count(goal.targets) == 1
    assert Enum.at(goal.targets, 0).name == goal_params.target_name
    assert Enum.at(goal.targets, 0).from == Float.parse(goal_params.from) |> elem(0)
    assert Enum.at(goal.targets, 0).to == Float.parse(goal_params.to) |> elem(0)
    assert Enum.at(goal.targets, 0).unit == goal_params.unit

    ctx
    |> UI.visit(Paths.goal_path(ctx.company, goal))
    |> UI.assert_text(goal_params.name)
    |> UI.assert_text(goal_params.target_name)
    |> UI.assert_text(goal_params.parent_name)
  end

  step :assert_subgoal_created_email_sent, ctx, goal_name do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.space.name,
      to: ctx.reviewer,
      author: ctx.champion,
      action: "added the #{goal_name} goal"
    })
  end

end
