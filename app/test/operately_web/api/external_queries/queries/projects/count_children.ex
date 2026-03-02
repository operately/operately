defmodule OperatelyWeb.Api.ExternalQueries.Queries.Projects.CountChildren do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  def query_name, do: "projects/count_children"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
  end

  @impl true
  def inputs(ctx) do
    %{id: Paths.project_id(ctx.project)}
  end

  @impl true
  def assert(res, _ctx) do
    assert res.children_count.tasks_count == 0
    assert res.children_count.discussions_count == 0
    assert res.children_count.check_ins_count == 0
  end
end
