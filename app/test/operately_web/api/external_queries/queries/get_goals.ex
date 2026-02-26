defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetGoals do
  use Operately.Support.ExternalApi.QueryDefinition

  import ExUnit.Assertions

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  query :get_goals do
    setup &setup_goal/1
    inputs &get_goals_inputs/1
    assert &assert_get_goals/2
  end

  def setup_goal(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
  end

  def get_goals_inputs(ctx) do
    %{space_id: Paths.space_id(ctx.space)}
  end

  def assert_get_goals(response, ctx) do
    assert is_list(response.goals)
    assert Enum.any?(response.goals, fn goal -> goal.id == Paths.goal_id(ctx.goal) end)
  end
end
