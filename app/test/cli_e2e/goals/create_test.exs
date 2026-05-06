defmodule Operately.CliE2E.Goals.CreateTest do
  use Operately.CliE2ECase

  alias Operately.Support.CliE2E.Goals.CreateSteps, as: Steps

  setup ctx do
    {:ok, Steps.setup(ctx)}
  end

  test "creates a goal with just a name", ctx do
    ctx
    |> Steps.create_goal_with_name("Q2 Revenue Growth")
    |> Steps.assert_goal_created_successfully()
  end

  test "creates a goal with name and description", ctx do
    ctx
    |> Steps.create_goal_with_description(%{
      name: "Improve Customer Retention",
      description: "Focus on reducing churn and improving customer satisfaction"
    })
    |> Steps.assert_goal_created_successfully()
    |> Steps.assert_goal_has_description()
  end

  test "creates a goal with markdown description", ctx do
    ctx
    |> Steps.create_goal_with_description(%{
      name: "Product Roadmap Q2",
      description: "Key initiatives:\n- Launch new dashboard\n- Improve API performance\n- Add analytics"
    })
    |> Steps.assert_goal_created_successfully()
    |> Steps.assert_goal_has_description()
  end

  test "creates a goal with markdown description from file", ctx do
    ctx
    |> Steps.create_goal_with_description_file(%{
      name: "Product Roadmap Q2",
      description: "Key initiatives:\n- Launch new dashboard\n- Improve API performance\n- Add analytics"
    })
    |> Steps.assert_goal_created_successfully()
    |> Steps.assert_goal_description_persisted_from_file()
  end
end
