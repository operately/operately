defmodule OperatelyWeb.Api.ExternalQueries.Queries.Goals.ListDiscussions do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  def query_name, do: "goals/list_discussions"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
  end

  @impl true
  def inputs(ctx) do
    %{goal_id: Paths.goal_id(ctx.goal)}
  end

  @impl true
  def assert(res, _ctx) do
    assert is_list(res.discussions)
  end
end
