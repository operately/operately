defmodule Operately.Features.GoalCreationTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.GoalCreationTestSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "create a new goal", ctx do
    ctx
    |> Steps.visit_new_goal_page()
    |> Steps.fill_in_goal_form("Example Goal")
    |> Steps.submit()
    |> Steps.assert_goal_added("Example Goal")
  end

  feature "create a new subgoal from for an exitsting goal (from the goal page)", ctx do
    ctx
    |> Steps.given_a_goal_exists(%{name: "Existing Goal"})
    |> Steps.add_subgoal("Example Subgoal")
    |> Steps.assert_subgoal_added("Example Subgoal")
  end

  feature "create a new goal from the company work map", ctx do
    ctx
    |> Steps.visit_company_work_map()
    |> Steps.click_add_goal_button()
    |> Steps.fill_in_work_item_form("Example Goal")
    |> Steps.submit()
    |> Steps.assert_work_item_added("Example Goal")
  end

  feature "create a sub-goal from the company work map", ctx do
    ctx
    |> Steps.given_a_goal_exists(%{name: "Existing Goal"})
    |> Steps.visit_company_work_map()
    |> Steps.hover_over_and_click_add_button("Existing Goal")
    |> Steps.fill_in_work_item_form("Example Goal")
    |> Steps.submit()
    |> Steps.assert_subgoal_added("Example Goal")
  end
end
