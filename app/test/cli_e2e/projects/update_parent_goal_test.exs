defmodule Operately.CliE2E.Projects.UpdateParentGoalTest do
  use Operately.CliE2ECase

  alias Operately.Support.CliE2E.Projects.UpdateParentGoalSteps, as: Steps

  setup ctx do
    {:ok, Steps.setup(ctx)}
  end

  test "updates project parent goal", ctx do
    ctx
    |> Steps.update_project_parent_goal(:goal)
    |> Steps.assert_parent_goal_updated_successfully()
  end

  test "clears project parent goal", ctx do
    ctx
    |> Steps.update_project_parent_goal(:goal)
    |> Steps.clear_project_parent_goal()
    |> Steps.assert_parent_goal_updated_successfully()
  end
end
