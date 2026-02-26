defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetGoalProgressUpdate do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  @impl true
  def setup(ctx) do
    ctx
    |> setup_goal()
    |> Factory.add_goal_update(:goal_update, :goal, :creator)
  end

  @impl true
  def inputs(ctx) do
    %{id: Paths.goal_update_id(ctx.goal_update)}
  end

  @impl true
  def assert(response, ctx) do
    assert response.update
    assert response.update.id == Paths.goal_update_id(ctx.goal_update)
  end

  defp setup_goal(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
  end
end
