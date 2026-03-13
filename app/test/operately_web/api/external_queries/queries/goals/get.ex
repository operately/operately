defmodule OperatelyWeb.Api.ExternalQueries.Queries.Goals.Get do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  def query_name, do: "goals/get"

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
