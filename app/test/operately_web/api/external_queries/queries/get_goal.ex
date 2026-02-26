defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetGoal do
  use Operately.Support.ExternalApi.QueryDefinition

  import ExUnit.Assertions

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  query :get_goal do
    setup &setup_goal/1
    inputs &get_goal_inputs/1
    assert &assert_get_goal/2
  end

  def setup_goal(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
  end

  def get_goal_inputs(ctx) do
    %{id: Paths.goal_id(ctx.goal)}
  end

  def assert_get_goal(response, ctx) do
    assert response.goal
    assert response.goal.id == Paths.goal_id(ctx.goal)
  end
end
