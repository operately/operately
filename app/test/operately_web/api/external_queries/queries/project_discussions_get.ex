defmodule OperatelyWeb.Api.ExternalQueries.Queries.ProjectDiscussionsGet do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  def query_name, do: "project_discussions/get"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_discussion(:discussion, :project)
  end

  @impl true
  def inputs(ctx) do
    %{id: Paths.comment_thread_id(ctx.discussion)}
  end

  @impl true
  def assert(res, _ctx) do
    assert res.discussion
  end
end
