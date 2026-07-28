defmodule OperatelyWeb.Api.ExternalQueries.Queries.Goals.CountChildren do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  def query_name, do: "goals/count_children"

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
  def assert(res, _ctx) do
    assert res.children_count.discussions_count == 0
    assert res.children_count.check_ins_count == 0
    assert res.children_count.docs_and_files_count == 0
  end
end
