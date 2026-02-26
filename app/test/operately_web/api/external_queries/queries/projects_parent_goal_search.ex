defmodule OperatelyWeb.Api.ExternalQueries.Queries.ProjectsParentGoalSearch do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  def query_name, do: "projects/parent_goal_search"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  @impl true
  def inputs(ctx) do
    %{space_id: Paths.space_id(ctx.space), query: "test"}
  end

  @impl true
  def assert(res, _ctx) do
    assert res["goals"]
  end
end
