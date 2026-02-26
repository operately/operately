defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetGoal do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
  end

  @impl true
  def inputs(ctx) do
    %{id: Paths.goal_id(ctx.goal)}
  end

  @impl true
  def assert(response, ctx) do
    assert response.goal
    assert response.goal.id == Paths.goal_id(ctx.goal)
  end
end
