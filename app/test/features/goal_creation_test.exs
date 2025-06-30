defmodule Operately.Features.GoalCreationTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.GoalCreationTestSteps, as: Steps

  describe "old goal creation tests" do
    setup ctx, do: Steps.setup_old(ctx)

    @parent_goal_params %{
      name: "Improve support first response time",
      target_name: "First response time",
      from: "30",
      to: "15",
      unit: "minutes"
    }

    @goal_params %{
      name: "Reduce first response time for support tickets",
      target_name: "First response time",
      from: "30",
      to: "15",
      unit: "minutes"
    }

    feature "add a company wide goal", ctx do
      ctx
      |> Steps.initialize_goal_creation()
      |> Steps.add_goal(@goal_params)
      |> Steps.assert_company_goal_added(@goal_params)
      |> Steps.assert_company_goal_created_email_sent(@goal_params.name)
    end

    feature "create a new goal and set parent goal", ctx do
      params = Map.merge(@goal_params, %{parent_name: @parent_goal_params.name})

      ctx
      |> Steps.given_a_goal_exists(@parent_goal_params)
      |> Steps.initialize_goal_creation()
      |> Steps.add_goal(params)
      |> Steps.assert_subgoal_added(params)
      |> Steps.assert_subgoal_created_email_sent(@goal_params.name)
    end

    feature "add subgoal to a company wide goal", ctx do
      params = Map.merge(@goal_params, %{parent_name: @parent_goal_params.name})

      ctx
      |> Steps.given_a_goal_exists(@parent_goal_params)
      |> Steps.initialize_goal_creation()
      |> Steps.add_goal(params)
      |> Steps.assert_subgoal_added(params)
      |> Steps.assert_subgoal_created_email_sent(@goal_params.name)
    end
  end

  describe "new goal creation tests" do
    setup ctx, do: Steps.setup_new(ctx)

    feature "create a new goal", ctx do
      ctx
      |> Steps.visit_new_goal_page()
      |> Steps.fill_in_goal_form("Example Goal")
      |> Steps.submit()
      |> Steps.assert_goal_added("Example Goal")
    end
  end
end
