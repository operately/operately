defmodule OperatelyWeb.Api.ExternalQueries.Queries.Goals.List do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  def query_name, do: "goals/list"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
  end

  @impl true
  def inputs(ctx) do
    %{space_id: Paths.space_id(ctx.space)}
  end

  @impl true
  def assert(response, ctx) do
    assert is_list(response.goals)
    assert Enum.any?(response.goals, fn goal -> goal.id == Paths.goal_id(ctx.goal) end)
  end
end
