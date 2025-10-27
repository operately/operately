defmodule Operately.Support.Features.GoalCreationTestSteps do
  use Operately.FeatureCase
  alias Operately.Support.Factory

  import Ecto.Query, only: [from: 2]

  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.log_in_person(:creator)
  end

  step :given_a_goal_exists, ctx, goal_params do
    ctx |> Factory.add_goal(:goal, :space, name: goal_params.name)
  end

  step :visit_new_goal_page, ctx do
    ctx |> UI.visit(Paths.new_goal_path(ctx.company))
  end

  step :fill_in_goal_form, ctx, name do
    ctx
    |> UI.fill_text_field(testid: "goal-name", with: name)
    |> UI.click(testid: "space-field")
    |> UI.click(testid: UI.testid(["space-field", "search-result", "general"]))
  end

  step :submit, ctx do
    ctx |> UI.click(testid: "submit")
  end

  step :assert_goal_added, ctx, name do
    ctx
    |> UI.assert_has(testid: "goal-page")
    |> UI.assert_text(name)
  end

  step :add_subgoal, ctx, name do
    ctx
    |> UI.visit(Paths.goal_path(ctx.company, ctx.goal))
    |> UI.click(testid: "add-subgoal")
    |> UI.fill_text_field(testid: "goal-name", with: name)
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "goal-page")
  end

  step :assert_subgoal_added, ctx, name do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.one(from g in Operately.Goals.Goal, where: g.name == ^name)

      assert goal != nil
      assert goal.name == name
      assert goal.parent_goal_id == ctx.goal.id
      assert goal.group_id == ctx.goal.group_id
    end)
  end

  step :visit_company_work_map, ctx do
    ctx |> UI.visit(Paths.work_map_path(ctx.company))
  end

  step :click_add_goal_button, ctx do
    ctx |> UI.click(testid: "add-goal")
  end

  step :fill_in_work_item_form, ctx, name do
    ctx
    |> UI.fill_text_field(testid: "item-name", with: name)
  end

  step :assert_work_item_added, ctx, name do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.one(from g in Operately.Goals.Goal, where: g.name == ^name)
      general = Operately.Repo.one(from s in Operately.Groups.Group, where: s.name == "General")

      assert goal != nil
      assert goal.name == name
      assert goal.parent_goal_id == nil
      assert goal.group_id == general.id
    end)
  end

  step :hover_over_and_click_add_button, ctx, goal_name do
    ctx
    |> UI.hover(testid: UI.testid(["work-item", goal_name]))
    |> UI.click(testid: "add-subitem")
  end
end
